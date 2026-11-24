ALTER TABLE pizzerias ADD COLUMN menu_text text;
ALTER TABLE pizzerias ADD COLUMN menu_url text;
CREATE TABLE table_notes (
  user_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  id text NOT NULL,
  body text NOT NULL,
  created_at text NOT NULL,
  PRIMARY KEY (user_id, team_id, id)
);
