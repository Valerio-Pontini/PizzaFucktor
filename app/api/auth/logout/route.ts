import { clearSessionCookies, digestHex, jsonAuth, sameOrigin, sessionTokens } from '../../../session';
import { database } from '../../../server';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonAuth({ error: 'Richiesta non valida.' }, 403);
  const tokens = sessionTokens(request.headers);
  for (const token of new Set(tokens)) {
    await database().prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await digestHex(token)).run();
  }
  return jsonAuth({ ok: true }, 200, clearSessionCookies(new URL(request.url).protocol === 'https:'));
}
