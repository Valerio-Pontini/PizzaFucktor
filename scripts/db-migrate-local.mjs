import { readdir, readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const defaultDatabaseDirectory = join(projectRoot, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');

function columnNames(db, table) {
  return new Set(db.prepare(`PRAGMA table_info("${table}")`).all().map((row) => row.name));
}

function hasColumns(db, table, required) {
  const actual = columnNames(db, table);
  return required.every((column) => actual.has(column));
}

function tableNames(db) {
  return new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name));
}

function indexNames(db) {
  return new Set(db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map((row) => row.name));
}

function migrationSchemaPresent(db, name) {
  const tables = tableNames(db);
  const indexes = indexNames(db);
  if (name.startsWith('0000_')) {
    return ['teams', 'team_members', 'pizzerias'].every((table) => tables.has(table))
      && hasColumns(db, 'teams', ['edition_id', 'slot', 'invite_code'])
      && hasColumns(db, 'team_members', ['user_id', 'team_id', 'display_name'])
      && hasColumns(db, 'pizzerias', ['team_id', 'name', 'address', 'booking_status'])
      && ['team_members_team_id_idx', 'teams_invite_code_unique', 'teams_edition_slot_unique'].every((index) => indexes.has(index));
  }
  if (name.startsWith('0001_')) {
    return ['accounts', 'auth_rate_limits', 'auth_sessions'].every((table) => tables.has(table))
      && hasColumns(db, 'accounts', ['id', 'username_norm', 'password_hash'])
      && hasColumns(db, 'auth_rate_limits', ['rate_key', 'attempts', 'locked_until'])
      && hasColumns(db, 'auth_sessions', ['token_hash', 'user_id', 'expires_at'])
      && hasColumns(db, 'team_members', ['username'])
      && indexes.has('auth_sessions_user_id_idx');
  }
  if (name.startsWith('0002_')) {
    return tables.has('votes')
      && hasColumns(db, 'votes', ['id', 'pizzeria_team_id', 'user_id', 'pizza_score', 'menu_score', 'service_score', 'ambience_score'])
      && ['votes_pizzeria_user_unique', 'votes_pizzeria_team_idx', 'votes_user_updated_idx'].every((index) => indexes.has(index));
  }
  if (name.startsWith('0003_')) {
    return tables.has('votes')
      && hasColumns(db, 'votes', ['pizza_score', 'fritti_score', 'menu_score', 'service_score', 'ambience_score'])
      && ['votes_pizzeria_user_unique', 'votes_pizzeria_team_idx', 'votes_user_updated_idx'].every((index) => indexes.has(index));
  }
  if (name.startsWith('0004_')) {
    return hasColumns(db, 'pizzerias', ['menu_text', 'menu_url'])
      && hasColumns(db, 'table_notes', ['user_id', 'team_id', 'id', 'body', 'created_at']);
  }
  return false;
}

export function applyMigrations(db, migrations) {
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  const hadMigrationTable = tableNames(db).has('__pizzafactor_local_migrations');
  const hadAppSchema = [...tableNames(db)].some((table) => !table.startsWith('_cf_') && table !== '__pizzafactor_local_migrations');
  const existing = !hadMigrationTable && hadAppSchema
    ? migrations.filter((migration) => migrationSchemaPresent(db, migration.name)) : [];
  // Adopt an installed schema only when it matches a continuous migration prefix.
  if (!hadMigrationTable && hadAppSchema && (!existing.length || existing.some((item, index) => item !== migrations[index]))) {
    throw new Error('Schema locale parziale senza registro migrazioni. Controlla il database locale senza cancellare dati.');
  }
  db.exec(`CREATE TABLE IF NOT EXISTS "__pizzafactor_local_migrations" (
    name TEXT PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  );`);
  const applied = new Set(db.prepare('SELECT name FROM "__pizzafactor_local_migrations"').all().map((row) => row.name));

  if (!hadMigrationTable && hadAppSchema) {
    const record = db.prepare('INSERT INTO "__pizzafactor_local_migrations" (name, applied_at) VALUES (?, ?)');
    for (const migration of existing) {
      record.run(migration.name, new Date().toISOString());
      applied.add(migration.name);
      console.log(`Schema già presente; registro ${migration.name}.`);
    }
  }

  for (const migration of migrations) {
    if (applied.has(migration.name)) {
      if (!migrationSchemaPresent(db, migration.name)) throw new Error(`Schema non coerente con ${migration.name}.`);
      continue;
    }

    db.exec('BEGIN IMMEDIATE;');
    try {
      db.exec(migration.sql);
      db.prepare('INSERT INTO "__pizzafactor_local_migrations" (name, applied_at) VALUES (?, ?)')
        .run(migration.name, new Date().toISOString());
      db.exec('COMMIT;');
      console.log(`Applicata ${migration.name}.`);
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  }
}

async function findDatabase(override) {
  if (override) {
    const path = resolve(projectRoot, override);
    const actual = await realpath(path);
    const allowedRoot = await realpath(join(projectRoot, '.wrangler')).catch(() => '');
    const tempRoot = '/tmp';
    if (relative(allowedRoot, actual).startsWith('..') && !actual.startsWith(`${tempRoot}/`) && actual !== tempRoot) {
      throw new Error('Il database di migrazione deve trovarsi in .wrangler/ o /tmp/.');
    }
    return actual;
  }

  let files;
  try {
    files = await readdir(defaultDatabaseDirectory);
  } catch {
    files = [];
  }
  const candidates = files.filter((file) => file.endsWith('.sqlite') && file !== 'metadata.sqlite');
  for (const file of candidates) {
    const path = join(defaultDatabaseDirectory, file);
    const db = new DatabaseSync(path, { readOnly: true });
    const tables = tableNames(db);
    db.close();
    if ([...tables].some((table) => ['teams', 'team_members', 'pizzerias', 'accounts', 'votes'].includes(table))) return path;
  }
  if (candidates.length === 1) return join(defaultDatabaseDirectory, candidates[0]);
  throw new Error('Database D1 locale non individuato. Avvia e arresta la preview locale una volta, poi riprova. Non viene modificato alcun database remoto.');
}

async function main() {
  const overrideArg = process.argv.find((value) => value.startsWith('--database='));
  const databasePath = await findDatabase(overrideArg?.slice('--database='.length));
  const migrationsDirectory = join(projectRoot, 'drizzle');
  const names = (await readdir(migrationsDirectory)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  const migrations = await Promise.all(names.map(async (name) => ({
    name,
    sql: await readFile(join(migrationsDirectory, name), 'utf8'),
  })));
  const db = new DatabaseSync(databasePath);
  try {
    applyMigrations(db, migrations);
  } finally {
    db.close();
  }
  console.log(`Migrazioni locali verificate su ${relative(projectRoot, databasePath) || databasePath}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(isAbsolute(process.argv[1]) ? process.argv[1] : resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
