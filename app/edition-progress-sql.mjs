export const EDITION_ID = 'edizione-1';
export const EDITION_CAPACITY = 5;
export const REQUIRED_PARTICIPANTS = EDITION_CAPACITY * 2;
export const REQUIRED_BALLOTS = REQUIRED_PARTICIPANTS * (EDITION_CAPACITY - 1);

export const EDITION_PROGRESS_CTES = `
  WITH edition_teams AS (
    SELECT id FROM teams WHERE edition_id = ?
  ), edition_counts AS (
    SELECT
      (SELECT COUNT(*) FROM edition_teams) AS teams,
      (SELECT COUNT(*) FROM pizzerias p JOIN edition_teams t ON t.id = p.team_id) AS pizzerias,
      (SELECT COUNT(*) FROM team_members m JOIN edition_teams t ON t.id = m.team_id) AS participants,
      (SELECT COUNT(*) FROM edition_teams t
        WHERE (SELECT COUNT(*) FROM team_members m WHERE m.team_id = t.id) = 2
      ) AS completeTeams,
      (SELECT COUNT(*) FROM votes v
        JOIN team_members voter ON voter.user_id = v.user_id
        JOIN edition_teams voter_team ON voter_team.id = voter.team_id
        JOIN edition_teams place_team ON place_team.id = v.pizzeria_team_id
        JOIN pizzerias p ON p.team_id = place_team.id
      ) AS submittedVotes
  ), edition_progress_row AS (
    SELECT *, ${REQUIRED_BALLOTS} AS requiredVotes,
      CASE WHEN teams = ${EDITION_CAPACITY}
        AND pizzerias = ${EDITION_CAPACITY}
        AND participants = ${REQUIRED_PARTICIPANTS}
        AND completeTeams = ${EDITION_CAPACITY}
        AND submittedVotes = ${REQUIRED_BALLOTS}
        THEN 1 ELSE 0 END AS isFinal
    FROM edition_counts
  )
`;

export const GUARDED_VOTE_UPSERT_SQL = `
  ${EDITION_PROGRESS_CTES}
  INSERT INTO votes (
    id, pizzeria_team_id, user_id, pizza_score, menu_score, service_score,
    ambience_score, notes, created_at, updated_at
  )
  SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  FROM edition_progress_row progress
  WHERE progress.isFinal = 0
    AND EXISTS (
      SELECT 1 FROM team_members member
      JOIN edition_teams team ON team.id = member.team_id
      WHERE member.user_id = ?
    )
    AND EXISTS (
      SELECT 1 FROM pizzerias place
      JOIN edition_teams team ON team.id = place.team_id
      WHERE place.team_id = ?
    )
  ON CONFLICT(pizzeria_team_id, user_id) DO NOTHING
`;

export const GUARDED_PIZZERIA_UPSERT_SQL = `
  ${EDITION_PROGRESS_CTES}
  INSERT INTO pizzerias (
    team_id, name, address, city, phone, website, maps_url, dinner_date, dinner_time,
    booking_status, booked_under, confirmation_code, notes, updated_by, updated_at, menu_text, menu_url
  )
  SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  FROM edition_progress_row progress
  WHERE progress.isFinal = 0
  ON CONFLICT(team_id) DO UPDATE SET
    name = excluded.name,
    address = excluded.address,
    city = excluded.city,
    phone = excluded.phone,
    website = excluded.website,
    menu_text = COALESCE(excluded.menu_text, pizzerias.menu_text),
    menu_url = COALESCE(excluded.menu_url, pizzerias.menu_url),
    maps_url = excluded.maps_url,
    dinner_date = excluded.dinner_date,
    dinner_time = excluded.dinner_time,
    booking_status = excluded.booking_status,
    booked_under = excluded.booked_under,
    confirmation_code = excluded.confirmation_code,
    notes = excluded.notes,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at
`;

export const GUARDED_TEAM_RENAME_SQL = `
  ${EDITION_PROGRESS_CTES}
  UPDATE teams SET name = ? WHERE id = (
    SELECT team_id FROM team_members WHERE user_id = ?
  ) AND (SELECT isFinal FROM edition_progress_row) = 0
`;
