import { EDITION_ID } from '../../competition';
import { database, json } from '../../server';
import { currentUser, sameOrigin } from '../../session';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Richiesta non valida.' }, 403);
  const user = await currentUser(request.headers);
  if (!user) return json({ error: 'Accedi per scrivere un appunto.' }, 401);

  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof input?.teamId !== 'string' || typeof input.id !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(input.id) || typeof input.body !== 'string' ||
      !input.body.trim() || input.body.length > 1200) {
    return json({ error: 'Scrivi un appunto da 1 a 1200 caratteri.' }, 400);
  }

  const db = database();
  const place = await db.prepare(`
    SELECT t.id FROM teams t JOIN teams mine ON mine.edition_id = t.edition_id
    JOIN team_members m ON m.team_id = mine.id
    WHERE t.id = ? AND t.edition_id = ? AND m.user_id = ?
  `).bind(input.teamId, EDITION_ID, user.userId).first();
  if (!place) return json({ error: 'Questa tappa non è disponibile.' }, 404);

  const body = input.body.trim();
  const key = [user.userId, input.teamId, input.id];
  const [, result] = await db.batch<{ id: string; body: string; createdAt: string }>([
    db.prepare(`INSERT INTO table_notes (user_id, team_id, id, body, created_at)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, team_id, id) DO NOTHING`)
      .bind(...key, body, new Date().toISOString()),
    db.prepare(`SELECT id, body, created_at AS createdAt FROM table_notes
      WHERE user_id = ? AND team_id = ? AND id = ?`).bind(...key),
  ]);
  const note = result.results[0];
  if (note?.body !== body) return json({ error: 'Questo appunto è già stato salvato con un altro testo.' }, 409);
  return json({ note });
}
