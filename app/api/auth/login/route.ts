import { clearRateLimits, cleanUsername, consumeRateLimit, createSession, equalHex, hashPassword, jsonAuth, loginRateKeys, PBKDF2_ITERATIONS, sameOrigin, sessionCookie, validPassword } from '../../../session';
import { database } from '../../../server';

const DUMMY_SALT = '66a3bb9e03cf76218d2765b79265342d';
type AccountRow = {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
};

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonAuth({ error: 'Richiesta non valida.' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return jsonAuth({ error: 'Username o password non corretti.' }, 400);
  }

  const username = cleanUsername(body.username);
  const password = body.password;
  if (!username || !validPassword(password)) return jsonAuth({ error: 'Username o password non corretti.' }, 400);

  const rateKeys = await loginRateKeys(request, username.normalized);
  const ipAllowed = await consumeRateLimit(rateKeys[0], 16, 900);
  if (!ipAllowed) return jsonAuth({ error: 'Troppi tentativi. Riprova tra qualche minuto.' }, 429);
  const accountAllowed = await consumeRateLimit(rateKeys[1], 9, 900);
  if (!accountAllowed) return jsonAuth({ error: 'Troppi tentativi. Riprova tra qualche minuto.' }, 429);

  const account = await database().prepare(`
    SELECT id, username, password_hash AS passwordHash, password_salt AS passwordSalt,
      password_iterations AS passwordIterations
    FROM accounts WHERE username_norm = ? LIMIT 1
  `).bind(username.normalized).first<AccountRow>();

  const candidate = await hashPassword(password, account?.passwordSalt ?? DUMMY_SALT, account?.passwordIterations ?? PBKDF2_ITERATIONS);
  if (!account || !equalHex(candidate, account.passwordHash)) {
    return jsonAuth({ error: 'Username o password non corretti.' }, 401);
  }

  await clearRateLimits(rateKeys);
  const token = await createSession(account.id);
  return jsonAuth({ ok: true, username: account.username }, 200, sessionCookie(token, undefined, new URL(request.url).protocol === 'https:'));
}
