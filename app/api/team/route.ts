import { currentUser, sameOrigin } from '../../session';
import { cleanText, database, json, requiredUser } from '../../server';
import { readEditionProgress } from '../../edition-progress';
import { EDITION_ID } from '../../competition';
import { GUARDED_TEAM_RENAME_SQL } from '../../edition-progress-sql.mjs';

function inviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const random = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(random, (value) => alphabet[value % alphabet.length]).join('');
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Richiesta non valida.' }, 403);
  const user = await currentUser(request.headers);
  const unauthorized = requiredUser(user?.userId ?? null);
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: 'Richiesta non valida.' }, 400);
  }

  const displayName = cleanText(body.displayName, 60);
  if (displayName.length < 2) return json({ error: 'Inserisci il nome con cui ti vedrà la squadra.' }, 400);

  const db = database();
  const current = await db.prepare(`
    SELECT t.name FROM team_members m JOIN teams t ON t.id = m.team_id WHERE m.user_id = ? LIMIT 1
  `).bind(user!.userId).first<{ name: string }>();
  if (current) return json({ error: `Fai già parte della squadra “${current.name}”.` }, 409);

  if (body.action === 'create') {
    const name = cleanText(body.name, 48);
    if (name.length < 2) return json({ error: 'Dai un nome alla vostra squadra.' }, 400);
    const slot = Number(body.slot);
    if (!Number.isInteger(slot) || slot < 1 || slot > 5) {
      return json({ error: 'Scegli uno dei cinque badge ufficiali.' }, 400);
    }
    const occupiedSlot = await db.prepare('SELECT 1 AS found FROM teams WHERE edition_id = ? AND slot = ? LIMIT 1')
      .bind(EDITION_ID, slot)
      .first();
    if (occupiedSlot) return json({ error: 'Questo badge è già stato assegnato a una squadra. Scegline un altro.' }, 409);

    const id = crypto.randomUUID();
    const code = inviteCode();
      const now = new Date().toISOString();
      try {
        const results = await db.batch([
        db.prepare('INSERT INTO teams (id, edition_id, slot, name, invite_code, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(id, EDITION_ID, slot, name, code, user!.userId, now),
        db.prepare('INSERT INTO team_members (user_id, team_id, display_name, email, username, joined_at) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(user!.userId, id, displayName, '', user!.username, now),
      ]);
      if (results[0].meta.changes !== 1) {
        const slotTaken = await db.prepare('SELECT 1 AS found FROM teams WHERE edition_id = ? AND slot = ? LIMIT 1')
          .bind(EDITION_ID, slot).first();
        if (slotTaken) return json({ error: 'Questo badge è stato appena assegnato a un’altra squadra. Scegline un altro.' }, 409);
        return json({ error: 'Le cinque squadre sono già state formate. Puoi ancora unirti a una coppia con il suo codice invito.' }, 409);
      }
      return json({ ok: true, teamId: id }, 201);
    } catch {
      const joined = await db.prepare('SELECT 1 AS found FROM team_members WHERE user_id = ?')
        .bind(user!.userId).first();
      if (joined) return json({ error: 'Il tuo account risulta già associato a una squadra.' }, 409);
      const slotTaken = await db.prepare('SELECT 1 AS found FROM teams WHERE edition_id = ? AND slot = ? LIMIT 1')
        .bind(EDITION_ID, slot).first();
      if (slotTaken) return json({ error: 'Questo badge è stato appena assegnato a un’altra squadra. Scegline un altro.' }, 409);
      const count = await db.prepare('SELECT COUNT(*) AS total FROM teams WHERE edition_id = ?')
        .bind(EDITION_ID).first<{ total: number }>();
      if (Number(count?.total ?? 0) >= 5) {
        return json({ error: 'Le cinque squadre sono già state formate. Puoi ancora unirti a una coppia con il suo codice invito.' }, 409);
      }
      return json({ error: 'Non siamo riusciti a creare la squadra. Riprova tra poco.' }, 409);
    }
  }

  if (body.action === 'join') {
    const code = cleanText(body.inviteCode, 12).toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 6) return json({ error: 'Inserisci il codice invito ricevuto dal tuo compagno.' }, 400);

    const now = new Date().toISOString();
    try {
      const result = await db.prepare(`
        INSERT INTO team_members (user_id, team_id, display_name, email, username, joined_at)
        SELECT ?, t.id, ?, '', ?, ? FROM teams t
        WHERE t.invite_code = ?
          AND (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) < 2
        LIMIT 1
      `).bind(user!.userId, displayName, user!.username, now, code).run();
      if (result.meta.changes === 1) return json({ ok: true }, 201);

      const invitedTeam = await db.prepare(`
        SELECT (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS members
        FROM teams t WHERE t.invite_code = ? LIMIT 1
      `).bind(code).first<{ members: number }>();
      if (!invitedTeam) return json({ error: 'Codice invito non trovato. Controlla che sia corretto.' }, 404);
      return json({ error: 'Questa squadra ha già due componenti.' }, 409);
    } catch {
      return json({ error: 'Non è stato possibile unirti alla squadra. Verifica il codice o riprova.' }, 409);
    }
  }

  return json({ error: 'Azione non riconosciuta.' }, 400);
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Richiesta non valida.' }, 403);
  const user = await currentUser(request.headers);
  const unauthorized = requiredUser(user?.userId ?? null);
  if (unauthorized) return unauthorized;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: 'Richiesta non valida.' }, 400);
  }
  const name = cleanText(body.name, 48);
  if (name.length < 2) return json({ error: 'Il nome deve contenere almeno due caratteri.' }, 400);
  const db = database();
  if ((await readEditionProgress(db)).isFinal) return json({ error: 'La sfida è conclusa. Il nome della squadra è bloccato.' }, 409);
  const result = await db.prepare(GUARDED_TEAM_RENAME_SQL).bind(EDITION_ID, name, user!.userId).run();
  if (result.meta.changes === 0 && (await readEditionProgress(db)).isFinal) {
    return json({ error: 'La sfida è conclusa. Il nome della squadra è bloccato.' }, 409);
  }
  if (result.meta.changes !== 1) return json({ error: 'Non hai una squadra da modificare.' }, 404);
  return json({ ok: true });
}
