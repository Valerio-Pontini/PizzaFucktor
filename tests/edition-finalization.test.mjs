import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { applyMigrations } from '../scripts/db-migrate-local.mjs';
import {
  EDITION_ID,
  EDITION_PROGRESS_CTES,
  GUARDED_PIZZERIA_UPSERT_SQL,
  GUARDED_TEAM_RENAME_SQL,
  GUARDED_VOTE_UPSERT_SQL,
} from '../app/edition-progress-sql.mjs';

test('the final eligible ballot seals the edition atomically and blocks later edits', async () => {
  const migrationDirectory = new URL('../drizzle/', import.meta.url);
  const names = (await readdir(migrationDirectory)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  const migrations = await Promise.all(names.map(async (name) => ({
    name,
    sql: await readFile(new URL(name, migrationDirectory), 'utf8'),
  })));
  const db = new DatabaseSync(':memory:');
  try {
    applyMigrations(db, migrations);
    const account = db.prepare(`INSERT INTO accounts
      (id, username, username_norm, password_hash, password_salt, password_iterations, created_at)
      VALUES (?, ?, ?, 'hash', 'salt', 100000, 1)`);
    const team = db.prepare(`INSERT INTO teams
      (id, edition_id, slot, name, invite_code, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'now')`);
    const member = db.prepare(`INSERT INTO team_members
      (user_id, team_id, display_name, email, joined_at, username)
      VALUES (?, ?, ?, '', 'now', ?)`);
    const pizzeria = db.prepare(`INSERT INTO pizzerias
      (team_id, name, address, booking_status, updated_by, updated_at)
      VALUES (?, ?, 'Via di prova 1', 'prenotato', ?, 'now')`);
    for (let teamIndex = 1; teamIndex <= 5; teamIndex += 1) {
      const teamId = `team-${teamIndex}`;
      team.run(teamId, EDITION_ID, teamIndex, `Squadra ${teamIndex}`, `CODE${teamIndex}`, `user-${teamIndex}-1`);
      pizzeria.run(teamId, `Pizzeria ${teamIndex}`, `user-${teamIndex}-1`);
      for (let memberIndex = 1; memberIndex <= 2; memberIndex += 1) {
        const userId = `user-${teamIndex}-${memberIndex}`;
        account.run(userId, userId, userId);
        member.run(userId, teamId, userId, userId);
      }
    }

    const insertVote = db.prepare(`INSERT INTO votes
      (id, pizzeria_team_id, user_id, pizza_score, menu_score, service_score, ambience_score, notes, created_at, updated_at)
      VALUES (?, ?, ?, 3, 3, 3, 3, '', 'now', 'now')`);
    let voteIndex = 0;
    for (let teamIndex = 1; teamIndex <= 5; teamIndex += 1) {
      for (let memberIndex = 1; memberIndex <= 2; memberIndex += 1) {
        for (let placeIndex = 1; placeIndex <= 5; placeIndex += 1) {
          if (teamIndex === placeIndex) continue;
          if (teamIndex === 5 && memberIndex === 2 && placeIndex === 4) continue;
          insertVote.run(`vote-${voteIndex++}`, `team-${placeIndex}`, `user-${teamIndex}-${memberIndex}`);
        }
      }
    }

    const progress = () => db.prepare(`${EDITION_PROGRESS_CTES} SELECT * FROM edition_progress_row`)
      .get(EDITION_ID);
    assert.equal(progress().submittedVotes, 39);
    assert.equal(progress().isFinal, 0);

    const saveVote = db.prepare(GUARDED_VOTE_UPSERT_SQL);
    const finalBallot = saveVote.run(EDITION_ID, 'vote-40', 'team-4', 'user-5-2', 5, 5, 5, 5, '', 'now', 'now', 'user-5-2', 'team-4');
    assert.equal(finalBallot.changes, 1);
    assert.equal(progress().isFinal, 1);

    const blockedEdit = saveVote.run(EDITION_ID, 'replacement', 'team-2', 'user-1-1', 1, 1, 1, 1, '', 'later', 'later', 'user-1-1', 'team-2');
    assert.equal(blockedEdit.changes, 0);
    assert.equal(db.prepare(`SELECT pizza_score FROM votes WHERE pizzeria_team_id = 'team-2' AND user_id = 'user-1-1'`).get().pizza_score, 3);

    const blockedPizzeriaChange = db.prepare(GUARDED_PIZZERIA_UPSERT_SQL).run(
      EDITION_ID, 'team-1', 'Nome alterato', 'Via di prova 2', 'Roma', '', '', '', '', '', 'prenotato', '', '', '', 'user-1-1', 'later', '', '',
    );
    assert.equal(blockedPizzeriaChange.changes, 0);
    const blockedTeamRename = db.prepare(GUARDED_TEAM_RENAME_SQL).run(EDITION_ID, 'Nome alterato', 'user-1-1');
    assert.equal(blockedTeamRename.changes, 0);
    assert.equal(db.prepare(`SELECT name FROM pizzerias WHERE team_id = 'team-1'`).get().name, 'Pizzeria 1');
    assert.equal(db.prepare(`SELECT name FROM teams WHERE id = 'team-1'`).get().name, 'Squadra 1');
  } finally {
    db.close();
  }
});
