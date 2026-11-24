import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { applyMigrations } from '../scripts/db-migrate-local.mjs';

async function readMigrations() {
  const migrationDirectory = new URL('../drizzle/', import.meta.url);
  const names = (await readdir(migrationDirectory)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  return Promise.all(names.map(async (name) => ({
    name,
    sql: await readFile(new URL(name, migrationDirectory), 'utf8'),
  })));
}

test('local D1 migrations apply once and can be run repeatedly', async () => {
  const migrations = await readMigrations();
  const names = migrations.map((migration) => migration.name);
  const db = new DatabaseSync(':memory:');
  try {
    applyMigrations(db, migrations);
    applyMigrations(db, migrations);
    const applied = db.prepare('SELECT name FROM "__pizzafactor_local_migrations" ORDER BY name').all();
    assert.deepEqual(applied.map((row) => row.name), names);
    assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'auth_rate_limits'").get());
    assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'votes'").get());
  } finally {
    db.close();
  }
});

test('an existing untracked edition gains notes and menu fields while keeping its pizzerias', async () => {
  const migrations = await readMigrations();
  const db = new DatabaseSync(':memory:');
  try {
    for (const migration of migrations.filter(({ name }) => name < '0004_')) db.exec(migration.sql);
    db.exec(`INSERT INTO teams (id, edition_id, slot, name, invite_code, created_by, created_at)
      VALUES ('t', 'edizione-1', 1, 'Coppia', 'INVITO', 'u', 'ieri');
      INSERT INTO pizzerias (team_id, name, address, booking_status, notes, updated_by, updated_at)
      VALUES ('t', 'Il forno', 'Via Roma 1', 'prenotato', 'Tavolo in giardino', 'u', 'ieri');`);
    applyMigrations(db, migrations);
    const pizzeria = db.prepare('SELECT notes, menu_url, menu_text FROM pizzerias WHERE team_id = ?').get('t');
    assert.equal(pizzeria.notes, 'Tavolo in giardino');
    assert.equal(pizzeria.menu_url, null);
    assert.equal(pizzeria.menu_text, null);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM table_notes').get().n, 0);
  } finally {
    db.close();
  }
});
