import { cleanUsername, consumeRateLimit, createSession, hashPassword, jsonAuth, PBKDF2_ITERATIONS, randomHex, registrationRateKey, sameOrigin, sessionCookie, validPassword } from '../../../session';
import { database } from '../../../server';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonAuth({ error: 'Richiesta non valida.' }, 403);
  const rateKey = await registrationRateKey(request);
  if (!await consumeRateLimit(rateKey, 15, 3600)) {
    return jsonAuth({ error: 'Troppi tentativi di registrazione. Riprova più tardi.' }, 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return jsonAuth({ error: 'Controlla username e password.' }, 400);
  }

  const username = cleanUsername(body.username);
  const password = body.password;
  if (!username) return jsonAuth({ error: 'Lo username deve avere 3–24 caratteri: lettere, numeri, punto, trattino o underscore.' }, 400);
  if (!validPassword(password)) return jsonAuth({ error: 'La password deve contenere almeno 8 caratteri.' }, 400);
  if (body.passwordConfirmation !== password) return jsonAuth({ error: 'Le due password non coincidono.' }, 400);

  const legacyIdentity = request.headers.get('oai-authenticated-user-id');
  const legacyMember = legacyIdentity
    ? await database().prepare('SELECT 1 AS found FROM team_members WHERE user_id = ? LIMIT 1')
      .bind(legacyIdentity).first()
    : null;
  const id = legacyMember && legacyIdentity ? legacyIdentity : crypto.randomUUID();
  const salt = randomHex(16);
  const passwordHash = await hashPassword(password, salt, PBKDF2_ITERATIONS);
  const createdAt = Math.floor(Date.now() / 1000);
  try {
    await database().prepare(`
      INSERT INTO accounts (id, username, username_norm, password_hash, password_salt, password_iterations, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, username.username, username.normalized, passwordHash, salt, PBKDF2_ITERATIONS, createdAt).run();
  } catch {
    return jsonAuth({ error: 'Questo username è già in uso.' }, 409);
  }

  try {
    const token = await createSession(id);
    return jsonAuth({ ok: true, username: username.username }, 201, sessionCookie(token, undefined, new URL(request.url).protocol === 'https:'));
  } catch {
    return jsonAuth({ error: 'Account creato, ma non è stato possibile avviare la sessione. Accedi con username e password.' }, 500);
  }
}
