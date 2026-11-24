import { currentUser, sameOrigin } from '../../session';
import { cleanText, database, json, optionalText, requiredUser, validHttpUrl } from '../../server';
import { readEditionProgress } from '../../edition-progress';
import { EDITION_ID } from '../../competition';
import { GUARDED_PIZZERIA_UPSERT_SQL } from '../../edition-progress-sql.mjs';

export async function PUT(request: Request) {
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

  const name = cleanText(body.name, 100);
  const address = cleanText(body.address, 180);
  if (name.length < 2 || address.length < 4) {
    return json({ error: 'Inserisci il nome della pizzeria e il suo indirizzo.' }, 400);
  }

  const city = optionalText(body.city, 80);
  const phone = optionalText(body.phone, 40);
  const website = optionalText(body.website, 240);
  const mapsUrl = optionalText(body.mapsUrl, 500);
  if (website && !validHttpUrl(website)) return json({ error: 'Il sito web deve iniziare con http:// o https://.' }, 400);
  if (mapsUrl && !validHttpUrl(mapsUrl)) return json({ error: 'Il link alla mappa deve iniziare con http:// o https://.' }, 400);

  if ((body.menuText !== undefined && (typeof body.menuText !== 'string' || body.menuText.length > 3000)) ||
      (body.menuUrl !== undefined && (typeof body.menuUrl !== 'string' || body.menuUrl.length > 500))) {
    return json({ error: 'Controlla la lunghezza del testo o del link al menu.' }, 400);
  }
  const menuText = typeof body.menuText === 'string' ? body.menuText.trim() : null;
  const menuUrl = typeof body.menuUrl === 'string' ? body.menuUrl.trim() : null;
  if (menuUrl && !validHttpUrl(menuUrl)) return json({ error: 'Inserisci un link al menu con http:// o https://.' }, 400);

  const dinnerDate = optionalText(body.dinnerDate, 10);
  const dinnerTime = optionalText(body.dinnerTime, 5);
  if (dinnerDate && !/^\d{4}-\d{2}-\d{2}$/.test(dinnerDate)) return json({ error: 'Controlla la data della cena.' }, 400);
  if (dinnerTime && !/^\d{2}:\d{2}$/.test(dinnerTime)) return json({ error: 'Controlla l’orario della cena.' }, 400);

  const allowedStatuses = new Set(['da_prenotare', 'da_confermare', 'prenotato']);
  const status = cleanText(body.bookingStatus, 24);
  const bookingStatus = allowedStatuses.has(status) ? status : 'da_prenotare';
  const bookedUnder = optionalText(body.bookedUnder, 80);
  const confirmationCode = optionalText(body.confirmationCode, 80);
  const notes = optionalText(body.notes, 800);
  const db = database();
  const progress = await readEditionProgress(db);
  if (progress.isFinal) return json({ error: 'La sfida è conclusa. Le tappe non si possono più modificare.' }, 409);

  const membership = await db.prepare('SELECT team_id AS teamId FROM team_members WHERE user_id = ? LIMIT 1')
    .bind(user!.userId).first<{ teamId: string }>();
  if (!membership) return json({ error: 'Prima crea una squadra o unisciti a una coppia.' }, 409);

  const now = new Date().toISOString();
  const result = await db.prepare(GUARDED_PIZZERIA_UPSERT_SQL).bind(
    EDITION_ID, membership.teamId, name, address, city, phone, website, mapsUrl,
    dinnerDate, dinnerTime, bookingStatus, bookedUnder, confirmationCode, notes,
    user!.userId, now, menuText, menuUrl,
  ).run();

  if (result.meta.changes !== 1) return json({ error: 'La sfida è conclusa. Le tappe non si possono più modificare.' }, 409);

  return json({ ok: true, updatedAt: now });
}
