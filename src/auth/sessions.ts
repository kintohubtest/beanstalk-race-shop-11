import { randomBytes } from 'node:crypto';
import type { AppContext, Session } from '../types.ts';

/** When a session that starts at `from` expires. */
export function sessionExpiry(ctx: AppContext, from: Date = ctx.clock.now()): string {
  return new Date(from.getTime() + ctx.config.sessionTtlSeconds * 1000).toISOString();
}

export function createSession(ctx: AppContext, userId: string): Session {
  const now = ctx.clock.now();
  return ctx.store.sessions.insert({
    id: randomBytes(24).toString('hex'),
    userId,
    createdAt: now.toISOString(),
    expiresAt: sessionExpiry(ctx, now),
  });
}

/** The session for `token`, or undefined when it is unknown or has expired. */
export function findSession(ctx: AppContext, token: string): Session | undefined {
  const session = ctx.store.sessions.get(token);
  if (!session) return undefined;
  if (new Date(session.expiresAt).getTime() <= ctx.clock.now().getTime()) return undefined;
  return session;
}

export function destroySession(ctx: AppContext, token: string): void {
  ctx.store.sessions.delete(token);
}

/** Drop every expired session. Returns how many were removed. */
export function purgeExpiredSessions(ctx: AppContext): number {
  const now = ctx.clock.now().getTime();
  const expired = ctx.store.sessions.find((s) => new Date(s.expiresAt).getTime() <= now);
  for (const session of expired) ctx.store.sessions.delete(session.id);
  return expired.length;
}
