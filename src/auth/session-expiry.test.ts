import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, signUp } from '../lib/testing.ts';
import { createSession, sessionExpiry } from './sessions.ts';

describe('sessionExpiry', () => {
  it('is one lifetime after now by default', () => {
    const app = createTestApp();
    assert.equal(sessionExpiry(app.ctx), '2026-09-15T13:00:00.000Z');
    app.clock.advance(60_000);
    assert.equal(sessionExpiry(app.ctx), '2026-09-15T13:01:00.000Z');
  });

  it('can start from any moment and follows the configured lifetime', () => {
    const app = createTestApp();
    app.ctx.config.sessionTtlSeconds = 90;
    assert.equal(sessionExpiry(app.ctx, new Date('2026-01-01T00:00:00.000Z')), '2026-01-01T00:01:30.000Z');
  });

  it('is what new sessions expire at', () => {
    const app = createTestApp();
    const { user } = signUp(app.ctx);
    app.clock.advance(5_000);
    assert.equal(createSession(app.ctx, user.id).expiresAt, sessionExpiry(app.ctx));
  });
});
