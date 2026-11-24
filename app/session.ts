import { headers as nextHeaders } from 'next/headers';
import { database } from './server';
import { sessionTokens } from './session-cookies';
export { clearSessionCookies, PARTITIONED_SESSION_COOKIE, SESSION_COOKIE, sessionCookie, sessionTokens } from './session-cookies';

export const PBKDF2_ITERATIONS = 100_000;
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();

export type AppUser = { userId: string; username: string };

export function cleanUsername(value: unknown): { username: string; normalized: string } | null {
  if (typeof value !== 'string') return null;
  const username = value.trim();
  if (!/^[a-zA-Z0-9._-]{3,24}$/.test(username)) return null;
  return { username, normalized: username.toLowerCase() };
}

export function validPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128;
}

export function randomHex(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

export async function digestHex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string, saltHex: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2', salt: fromHex(saltHex), iterations, hash: 'SHA-256',
  }, key, 256);
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function equalHex(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export async function currentUser(sourceHeaders?: Headers): Promise<AppUser | null> {
  const requestHeaders = sourceHeaders ?? await nextHeaders();
  const now = Math.floor(Date.now() / 1000);
  for (const token of sessionTokens(requestHeaders)) {
    const user = await database().prepare(`
      SELECT a.id AS userId, a.username
      FROM auth_sessions s JOIN accounts a ON a.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1
    `).bind(await digestHex(token), now).first<AppUser>();
    if (user) return user;
  }
  return null;
}

export async function createSession(userId: string): Promise<string> {
  const token = randomHex(32);
  const tokenHash = await digestHex(token);
  const now = Math.floor(Date.now() / 1000);
  const db = database();
  await db.batch([
    db.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').bind(now),
    db.prepare('INSERT INTO auth_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(tokenHash, userId, now, now + SESSION_SECONDS),
  ]);
  return token;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function loginRateKeys(request: Request, normalizedUsername: string): Promise<string[]> {
  const clientIp = request.headers.get('cf-connecting-ip') ?? 'unknown-client';
  const [ipHash, accountHash] = await Promise.all([
    digestHex(`pizzafactor:ip:${clientIp}`), digestHex(`pizzafactor:account:${normalizedUsername}`),
  ]);
  return [`login-ip:${ipHash}`, `login-account:${accountHash}`];
}

export async function registrationRateKey(request: Request): Promise<string> {
  const clientIp = request.headers.get('cf-connecting-ip') ?? 'unknown-client';
  return `register:${await digestHex(`pizzafactor:register:${clientIp}`)}`;
}

export async function consumeRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const row = await database().prepare(`
    INSERT INTO auth_rate_limits (rate_key, attempts, window_started_at, locked_until)
    VALUES (?, 1, ?, 0)
    ON CONFLICT(rate_key) DO UPDATE SET
      attempts = CASE WHEN ? - auth_rate_limits.window_started_at >= ? THEN 1 ELSE auth_rate_limits.attempts + 1 END,
      window_started_at = CASE WHEN ? - auth_rate_limits.window_started_at >= ? THEN ? ELSE auth_rate_limits.window_started_at END,
      locked_until = CASE
        WHEN ? - auth_rate_limits.window_started_at >= ? THEN 0
        WHEN auth_rate_limits.attempts + 1 >= ? THEN ? + ?
        ELSE auth_rate_limits.locked_until
      END
    RETURNING attempts, locked_until
  `).bind(key, now, now, windowSeconds, now, windowSeconds, now, now, windowSeconds, limit, now, windowSeconds)
    .first<{ attempts: number; locked_until: number }>();
  return Boolean(row && row.attempts < limit && row.locked_until <= now);
}

export async function clearRateLimits(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const db = database();
  await db.batch(keys.map((key) => db.prepare('DELETE FROM auth_rate_limits WHERE rate_key = ?').bind(key)));
}

export function jsonAuth(data: unknown, status = 200, cookie?: string | string[]): Response {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0',
  });
  for (const value of cookie ? (Array.isArray(cookie) ? cookie : [cookie]) : []) {
    headers.append('Set-Cookie', value);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function fromHex(value: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(value.length / 2));
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}
