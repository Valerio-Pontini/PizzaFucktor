ALTER TABLE votes RENAME TO votes_legacy;
CREATE TABLE votes (
  id text PRIMARY KEY NOT NULL,
  pizzeria_team_id text NOT NULL REFERENCES pizzerias(team_id) ON DELETE cascade,
  user_id text NOT NULL REFERENCES accounts(id) ON DELETE cascade,
  pizza_score integer NOT NULL,
  fritti_score integer NOT NULL DEFAULT 5,
  menu_score integer NOT NULL,
  service_score integer NOT NULL,
  ambience_score integer NOT NULL,
  notes text NOT NULL DEFAULT '',
  created_at text NOT NULL,
  updated_at text NOT NULL,
  CONSTRAINT votes_score_range CHECK (pizza_score BETWEEN 1 AND 20 AND fritti_score BETWEEN 1 AND 10 AND menu_score BETWEEN 1 AND 10 AND service_score BETWEEN 1 AND 10 AND ambience_score BETWEEN 1 AND 10)
);
INSERT INTO votes (id, pizzeria_team_id, user_id, pizza_score, fritti_score, menu_score, service_score, ambience_score, notes, created_at, updated_at)
SELECT id, pizzeria_team_id, user_id, pizza_score, 5, menu_score, service_score, ambience_score, notes, created_at, updated_at FROM votes_legacy;
DROP TABLE votes_legacy;
CREATE UNIQUE INDEX votes_pizzeria_user_unique ON votes (pizzeria_team_id, user_id);
CREATE INDEX votes_pizzeria_team_idx ON votes (pizzeria_team_id);
CREATE INDEX votes_user_updated_idx ON votes (user_id, updated_at);
