import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp } from '../lib/testing.ts';
import type { User } from '../types.ts';

const body = { name: 'Ada', password: 'correct horse' };

describe('email case', () => {
  it('stores addresses in lower case', () => {
    const app = createTestApp();
    const res = app.call('POST', '/users', { body: { ...body, email: '  Ada@Example.COM ' } });
    assert.equal(res.status, 201);
    assert.equal((res.body as User).email, 'ada@example.com');
  });

  it('refuses a second account that differs only in case', () => {
    const app = createTestApp();
    app.call('POST', '/users', { body: { ...body, email: 'Ada@Example.com' } });
    assert.equal(app.call('POST', '/users', { body: { ...body, email: 'ada@example.com' } }).status, 409);
    assert.equal(app.ctx.store.users.all().length, 1);
  });

  it('lets customers log in with any capitalisation', () => {
    const app = createTestApp();
    app.call('POST', '/users', { body: { ...body, email: 'Ada@Example.com' } });
    for (const email of ['ada@example.com', 'ADA@EXAMPLE.COM', ' Ada@Example.com ']) {
      assert.equal(app.call('POST', '/auth/login', { body: { email, password: body.password } }).status, 200, email);
    }
  });
});
