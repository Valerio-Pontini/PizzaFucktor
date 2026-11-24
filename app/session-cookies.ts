export const SESSION_COOKIE = 'pizzafactor_session';
export const PARTITIONED_SESSION_COOKIE = 'pizzafactor_session_partitioned';
const SESSION_SECONDS = 60 * 60 * 24 * 30;

export function sessionTokens(sourceHeaders: Headers): string[] {
  const cookieParts = (sourceHeaders.get('cookie') ?? '').split(';').map((part) => part.trim());
  return [PARTITIONED_SESSION_COOKIE, SESSION_COOKIE]
    .flatMap((name) => cookieParts
      .filter((part) => part.startsWith(`${name}=`))
      .map((part) => part.slice(name.length + 1)))
    .filter((token) => /^[a-f0-9]{64}$/.test(token));
}

export function sessionCookie(token: string, maxAge = SESSION_SECONDS, secure = true): string[] {
  // Sites may run in a cross-site iframe: keep Lax for top-level use and add a partitioned cookie for the embed.
  const secureAttribute = secure ? '; Secure' : '';
  return [
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly${secureAttribute}; SameSite=Lax; Max-Age=${maxAge}`,
    `${PARTITIONED_SESSION_COOKIE}=${token}; Path=/; HttpOnly${secureAttribute}; SameSite=None; Partitioned; Max-Age=${maxAge}`,
  ];
}

export function clearSessionCookies(secure = true): string[] {
  const secureAttribute = secure ? '; Secure' : '';
  return [
    `${SESSION_COOKIE}=; Path=/; HttpOnly${secureAttribute}; SameSite=Lax; Max-Age=0`,
    `${PARTITIONED_SESSION_COOKIE}=; Path=/; HttpOnly${secureAttribute}; SameSite=None; Partitioned; Max-Age=0`,
  ];
}
