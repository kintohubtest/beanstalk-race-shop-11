import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, signUp } from '../lib/testing.ts';

const MINUTE = 60_000;

function setup() {
  const app = createTestApp();
  app.ctx.config.sessionTtlSeconds = 3600;
  const { token } = signUp(app.ctx);
  const me = () => app.call('GET', '/users/me', { token }).status;
  return { app, token, me };
}

describe('sliding sessions', () => {
  it('stay alive while the customer keeps using them', () => {
    const { app, me } = setup();
    app.clock.advance(50 * MINUTE);
    assert.equal(me(), 200);
    app.clock.advance(50 * MINUTE);
    assert.equal(me(), 200, 'the first request moved the expiry out');
    app.clock.advance(61 * MINUTE);
    assert.equal(me(), 401, 'but an idle hour still expires it');
  });

  it('record the new expiry', () => {
    const { app, token, me } = setup();
    app.clock.advance(10 * MINUTE);
    me();
    assert.equal(app.ctx.store.sessions.require(token).expiresAt, '2026-09-15T13:10:00.000Z');
  });

  it('do not revive an expired session', () => {
    const { app, token, me } = setup();
    app.clock.advance(61 * MINUTE);
    assert.equal(me(), 401);
    assert.equal(app.ctx.store.sessions.require(token).expiresAt, '2026-09-15T13:00:00.000Z', 'rejected request left the expiry alone');
    assert.equal(me(), 401);
  });
});
