import { currentUser } from '../../session';
import { database, json } from '../../server';
import { EDITION_CAPACITY, EDITION_ID, rankCompetition } from '../../competition';
import { readEditionProgress } from '../../edition-progress';
import { mapPrivatePizzeria, mapPublicPizzeria, type PizzeriaRow } from '../../pizzeria-data';

type Vote = {
  pizzaScore: number;
  frittiScore: number;
  menuScore: number;
  serviceScore: number;
  ambienceScore: number;
  notes: string;
  updatedAt: string;
};

type TeamRow = PizzeriaRow & {
  id: string;
  name: string;
  slot: number;
  inviteCode: string;
  createdAt: string;
};

type PublicPizzeriaFields = Pick<PizzeriaRow,
  'pizzeriaName' | 'address' | 'city' | 'phone' | 'website' | 'menuText' | 'menuUrl' | 'mapsUrl' | 'dinnerDate' | 'dinnerTime' | 'bookingStatus'
>;

type PlaceRow = PublicPizzeriaFields & { teamId: string; teamName: string; slot: number };

type CompetitionRow = PublicPizzeriaFields & {
  teamId: string;
  teamName: string;
  slot: number;
  voteCount: number;
  totalScore: number;
  myPizzaScore: number | null;
  myFrittiScore: number | null;
  myMenuScore: number | null;
  myServiceScore: number | null;
  myAmbienceScore: number | null;
  myVoteNotes: string | null;
  myVoteUpdatedAt: string | null;
  eligibleVotes: number;
};

function mapCompetition(row: CompetitionRow) {
  const myVote: Vote | null = row.myPizzaScore === null ? null : {
    pizzaScore: Number(row.myPizzaScore),
    frittiScore: Number(row.myFrittiScore),
    menuScore: Number(row.myMenuScore),
    serviceScore: Number(row.myServiceScore),
    ambienceScore: Number(row.myAmbienceScore),
    notes: row.myVoteNotes ?? '',
    updatedAt: row.myVoteUpdatedAt ?? '',
  };
  return {
    teamId: row.teamId,
    teamName: row.teamName,
    slot: Number(row.slot),
    pizzeria: mapPublicPizzeria(row)!,
    voteCount: Number(row.voteCount ?? 0),
    totalScore: Number(row.totalScore ?? 0),
    eligibleVotes: Number(row.eligibleVotes ?? 0),
    myVote,
  };
}

export async function GET() {
  const user = await currentUser();
  if (!user) return json({ error: 'Accedi per continuare.' }, 401);

  const db = database();
  const [team, count, occupied, competition, places, notes, progress] = await Promise.all([
    db.prepare(`
      SELECT t.id, t.name, t.slot, t.invite_code AS inviteCode, t.created_at AS createdAt,
        p.name AS pizzeriaName, p.address, p.city, p.phone, p.website, p.menu_text AS menuText, p.menu_url AS menuUrl, p.maps_url AS mapsUrl,
        p.dinner_date AS dinnerDate, p.dinner_time AS dinnerTime,
        p.booking_status AS bookingStatus, p.booked_under AS bookedUnder,
        p.confirmation_code AS confirmationCode, p.notes
      FROM team_members mine
      JOIN teams t ON t.id = mine.team_id
      LEFT JOIN pizzerias p ON p.team_id = t.id
      WHERE mine.user_id = ? AND t.edition_id = ?
      LIMIT 1
    `).bind(user.userId, EDITION_ID).first<TeamRow>(),
    db.prepare('SELECT COUNT(*) AS total FROM teams WHERE edition_id = ?')
      .bind(EDITION_ID)
      .first<{ total: number }>(),
    db.prepare('SELECT slot FROM teams WHERE edition_id = ? ORDER BY slot')
      .bind(EDITION_ID)
      .all<{ slot: number }>(),
    db.prepare(`
      SELECT t.id AS teamId, t.name AS teamName, t.slot,
        p.name AS pizzeriaName, p.address, p.city, p.phone, p.website, p.menu_text AS menuText, p.menu_url AS menuUrl, p.maps_url AS mapsUrl,
        p.dinner_date AS dinnerDate, p.dinner_time AS dinnerTime, p.booking_status AS bookingStatus,
        COALESCE(stats.voteCount, 0) AS voteCount, COALESCE(stats.totalScore, 0) AS totalScore,
        (SELECT COUNT(*) FROM team_members eligible WHERE eligible.team_id <> t.id
          AND eligible.team_id IN (SELECT id FROM teams WHERE edition_id = ?)) AS eligibleVotes,
        mine.pizza_score AS myPizzaScore, mine.fritti_score AS myFrittiScore, mine.menu_score AS myMenuScore,
        mine.service_score AS myServiceScore, mine.ambience_score AS myAmbienceScore,
        mine.notes AS myVoteNotes, mine.updated_at AS myVoteUpdatedAt
      FROM teams t
      JOIN pizzerias p ON p.team_id = t.id
      LEFT JOIN (
        SELECT v.pizzeria_team_id, COUNT(*) AS voteCount,
          SUM(v.pizza_score + v.fritti_score + v.menu_score + v.service_score + v.ambience_score) AS totalScore
        FROM votes v
        JOIN team_members voter ON voter.user_id = v.user_id
        JOIN teams voter_team ON voter_team.id = voter.team_id AND voter_team.edition_id = ?
        GROUP BY v.pizzeria_team_id
      ) stats ON stats.pizzeria_team_id = t.id
      LEFT JOIN votes mine ON mine.pizzeria_team_id = t.id AND mine.user_id = ?
      WHERE t.edition_id = ?
      ORDER BY t.slot ASC
    `).bind(EDITION_ID, EDITION_ID, user.userId, EDITION_ID).all<CompetitionRow>(),
    db.prepare(`
      SELECT t.id AS teamId, t.name AS teamName, t.slot,
        p.name AS pizzeriaName, p.address, p.city, p.phone, p.website, p.menu_text AS menuText, p.menu_url AS menuUrl, p.maps_url AS mapsUrl,
        p.dinner_date AS dinnerDate, p.dinner_time AS dinnerTime,
        p.booking_status AS bookingStatus
      FROM teams t
      LEFT JOIN pizzerias p ON p.team_id = t.id
      WHERE t.edition_id = ?
      ORDER BY t.slot ASC
    `).bind(EDITION_ID).all<PlaceRow>(),
    db.prepare(`SELECT n.team_id AS teamId, n.id, n.body, n.created_at AS createdAt
      FROM table_notes n JOIN teams t ON t.id = n.team_id
      WHERE n.user_id = ? AND t.edition_id = ? ORDER BY n.created_at DESC, n.id DESC`)
      .bind(user.userId, EDITION_ID).all<{ teamId: string; id: string; body: string; createdAt: string }>(),
    readEditionProgress(db),
  ]);

  const teamCount = Number(count?.total ?? 0);
  const ballotRows = await db.prepare(`
    SELECT v.pizzeria_team_id AS teamId, m.display_name AS player,
      v.pizza_score AS pizzaScore, v.fritti_score AS frittiScore, v.menu_score AS menuScore,
      v.service_score AS serviceScore, v.ambience_score AS ambienceScore
    FROM votes v JOIN team_members m ON m.user_id = v.user_id
    ORDER BY v.pizzeria_team_id, m.joined_at
  `).all<{ teamId: string; player: string; pizzaScore: number; frittiScore: number; menuScore: number; serviceScore: number; ambienceScore: number }>();
  const ballotsByTeam = new Map<string, unknown[]>();
  for (const ballot of ballotRows.results) {
    const list = ballotsByTeam.get(ballot.teamId) ?? [];
    list.push({ player: ballot.player, pizza: Number(ballot.pizzaScore), fritti: Number(ballot.frittiScore), conto: Number(ballot.menuScore), servizioLocale: Number(ballot.serviceScore), menu: Number(ballot.ambienceScore) });
    ballotsByTeam.set(ballot.teamId, list);
  }
  const competitionRows = rankCompetition(competition.results.map(mapCompetition)).map((entry) => ({
    ...entry,
    voteDetails: entry.voteCount >= Number((competition.results.find((row) => row.teamId === entry.teamId)?.eligibleVotes ?? Number.MAX_SAFE_INTEGER)) ? ballotsByTeam.get(entry.teamId) ?? [] : null,
    isWinner: progress.isFinal && entry.rank === 1,
  }));
  const placeRows = places.results.map((row) => ({
    teamId: row.teamId,
    teamName: row.teamName,
    slot: Number(row.slot),
    pizzeria: mapPublicPizzeria(row),
    myNotes: notes.results.filter((note) => note.teamId === row.teamId).map(({ id, body, createdAt }) => ({ id, body, createdAt })),
  }));
  const edition = {
    teams: teamCount,
    capacity: EDITION_CAPACITY,
    openSlots: Math.max(0, EDITION_CAPACITY - teamCount),
    occupiedSlots: occupied.results.map((row) => Number(row.slot)),
    pizzerias: progress.pizzerias,
    participants: progress.participants,
    completeTeams: progress.completeTeams,
    submittedVotes: progress.submittedVotes,
    requiredVotes: progress.requiredVotes,
    isFinal: progress.isFinal,
  };
  if (!team) return json({ user: { username: user.username }, edition, team: null, places: placeRows, competition: competitionRows });

  const memberRows = await db.prepare(`
    SELECT user_id AS userId, display_name AS displayName
    FROM team_members WHERE team_id = ? ORDER BY joined_at ASC LIMIT 2
  `).bind(team.id).all<{ userId: string; displayName: string }>();

  return json({
    user: { username: user.username },
    edition,
    places: placeRows,
    team: {
      id: team.id,
      name: team.name,
      slot: team.slot,
      inviteCode: team.inviteCode,
      createdAt: team.createdAt,
      members: memberRows.results.map((member) => ({
        displayName: member.displayName,
        isYou: member.userId === user.userId,
      })),
      pizzeria: mapPrivatePizzeria(team),
    },
    competition: competitionRows,
  });
}
