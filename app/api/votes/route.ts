import { currentUser, sameOrigin } from '../../session';
import { cleanText, database, json, requiredUser } from '../../server';
import { EDITION_ID } from '../../competition';
import { readEditionProgress } from '../../edition-progress';
import { GUARDED_VOTE_UPSERT_SQL } from '../../edition-progress-sql.mjs';
import { dinnerHasStarted } from '../../voting';

type ScoreName = 'pizzaScore' | 'frittiScore' | 'menuScore' | 'serviceScore' | 'ambienceScore';
const scoreNames: ScoreName[] = ['pizzaScore', 'frittiScore', 'menuScore', 'serviceScore', 'ambienceScore'];

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Richiesta non valida.' }, 403);
  const user = await currentUser(request.headers);
  const unauthorized = requiredUser(user?.userId ?? null);
  if (unauthorized) return unauthorized;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: 'Controlla il voto e riprova.' }, 400);
  }

  const teamId = cleanText(body.teamId, 64);
  const scores = Object.fromEntries(scoreNames.map((name) => [name, Number(body[name])])) as Record<ScoreName, number>;
  const limits: Record<ScoreName, number> = { pizzaScore: 20, frittiScore: 10, menuScore: 10, serviceScore: 10, ambienceScore: 10 };
  if (!teamId || scoreNames.some((name) => !Number.isInteger(scores[name]) || scores[name] < 1 || scores[name] > limits[name])) {
    return json({ error: 'Completa tutte le categorie rispettando i punteggi massimi.' }, 400);
  }

  const db = database();
  const progress = await readEditionProgress(db);
  if (progress.isFinal) return json({ error: 'La sfida è conclusa. Il verdetto finale è sigillato.' }, 409);

  const membership = await db.prepare(`
    SELECT m.team_id AS teamId
    FROM team_members m JOIN teams t ON t.id = m.team_id
    WHERE m.user_id = ? AND t.edition_id = ? LIMIT 1
  `).bind(user!.userId, EDITION_ID).first<{ teamId: string }>();
  if (!membership) return json({ error: 'Per votare devi far parte di una delle cinque squadre.' }, 409);

  const pizzeria = await db.prepare(`
    SELECT p.team_id AS teamId, p.dinner_date AS dinnerDate, p.dinner_time AS dinnerTime, t.created_by AS proposerId
    FROM pizzerias p JOIN teams t ON t.id = p.team_id
    WHERE p.team_id = ? AND t.edition_id = ?
    LIMIT 1
  `).bind(teamId, EDITION_ID).first<{ teamId: string; dinnerDate: string | null; dinnerTime: string | null }>();
  if (!pizzeria) return json({ error: 'Questa pizzeria non è disponibile per la sfida.' }, 404);
  const voterTeam = await db.prepare('SELECT team_id AS teamId FROM team_members WHERE user_id = ? LIMIT 1').bind(user!.userId).first<{ teamId: string }>();
  if (voterTeam?.teamId === teamId) return json({ error: 'La squadra che propone una pizzeria non può votare la propria proposta.' }, 403);
  if (!pizzeria.dinnerDate || !pizzeria.dinnerTime) return json({ error: 'Il voto si apre dopo la cena, quando saranno fissati giorno e orario.' }, 409);
  if (!dinnerHasStarted(pizzeria.dinnerDate, pizzeria.dinnerTime)) return json({ error: 'Potrai votare questa pizzeria solo dopo la cena.' }, 409);

  const now = new Date().toISOString();
  const result = await db.prepare(GUARDED_VOTE_UPSERT_SQL).bind(
    EDITION_ID,
    crypto.randomUUID(), teamId, user!.userId,
    scores.pizzaScore, scores.menuScore, scores.serviceScore, scores.ambienceScore,
    cleanText(body.notes, 800), now, now,
    user!.userId, teamId,
  ).run();
  if (result.meta.changes !== 1) {
    return json({ error: 'La sfida è conclusa. Il verdetto finale è sigillato.' }, 409);
  }
  await db.prepare('UPDATE votes SET fritti_score = ? WHERE pizzeria_team_id = ? AND user_id = ?').bind(scores.frittiScore, teamId, user!.userId).run();

  return json({ ok: true, updatedAt: now });
}
