import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, signUp } from '../lib/testing.ts';
import { runMigrations } from './migrate.ts';
import { migrations } from './migrations/index.ts';
import { Store } from './store.ts';

describe('migration 0006: user tax exempt', () => {
  it('defaults the flag to false for new users', () => {
    const app = createTestApp();
    assert.equal(signUp(app.ctx).user.taxExempt, false);
  });

  it('backfills accounts that already exist', () => {
    const store = new Store();
    runMigrations(store, migrations.filter((m) => m.version <= 5));
    store.users.insert({ id: 'usr_old', email: 'old@example.com' } as never);
    runMigrations(store);
    assert.equal(store.users.require('usr_old').taxExempt, false);
  });
});
