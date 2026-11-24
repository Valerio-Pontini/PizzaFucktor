import { env } from 'cloudflare:workers';

export function database(): D1Database {
  if (!env.DB) throw new Error('Database D1 non configurato.');
  return env.DB;
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}

export function requiredUser(userId: string | null): Response | null {
  return userId ? null : json({ error: 'Accedi per continuare.' }, 401);
}

export function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function optionalText(value: unknown, max: number): string | null {
  return cleanText(value, max) || null;
}

export function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
