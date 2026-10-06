import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, errorMessage } from '../lib/testing.ts';

const register = (app: ReturnType<typeof createTestApp>, password: string, email = 'ada@example.com') =>
  app.call('POST', '/users', { body: { email, name: 'Ada', password } });

describe('password policy', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const app = createTestApp();
    const res = register(app, 'short12');
    assert.equal(res.status, 400);
    assert.equal(errorMessage(res), 'password must be at least 8 characters');
    assert.equal(app.ctx.store.users.all().length, 0);
  });

  it('accepts exactly 8 characters', () => {
    assert.equal(register(createTestApp(), 'abcd1234').status, 201);
  });

  it('rejects the email address as a password, ignoring case', () => {
    const app = createTestApp();
    const res = register(app, 'ADA@example.com');
    assert.equal(res.status, 400);
    assert.equal(errorMessage(res), 'password must not be your email address');
  });
});
