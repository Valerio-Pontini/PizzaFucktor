import test from 'node:test';
import assert from 'node:assert/strict';
import { clearSessionCookies, PARTITIONED_SESSION_COOKIE, SESSION_COOKIE, sessionCookie, sessionTokens } from '../app/session-cookies.ts';

test('a login sets both top-level and partitioned iframe cookies', () => {
  const token = 'a'.repeat(64);
  const cookies = sessionCookie(token, 120);
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], new RegExp(`${SESSION_COOKIE}=${token}`));
  assert.match(cookies[0], /SameSite=Lax/);
  assert.match(cookies[1], new RegExp(`${PARTITIONED_SESSION_COOKIE}=${token}`));
  assert.match(cookies[1], /SameSite=None; Partitioned/);
  assert.ok(cookies.every((cookie) => cookie.includes('HttpOnly; Secure;')));
});

test('session lookup tries the partitioned cookie before the legacy cookie', () => {
  const embedded = 'b'.repeat(64);
  const legacy = 'c'.repeat(64);
  const headers = new Headers({
    cookie: `${SESSION_COOKIE}=bad; ${SESSION_COOKIE}=${legacy}; ${PARTITIONED_SESSION_COOKIE}=${embedded}`,
  });
  assert.deepEqual(sessionTokens(headers), [embedded, legacy]);
});

test('sign out expires both cookie variants', () => {
  const cookies = clearSessionCookies();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.every((cookie) => cookie.includes('Max-Age=0')));
  assert.ok(cookies.some((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`)));
  assert.ok(cookies.some((cookie) => cookie.startsWith(`${PARTITIONED_SESSION_COOKIE}=`)));
});
