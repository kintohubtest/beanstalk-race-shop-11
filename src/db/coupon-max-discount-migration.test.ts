import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp } from '../lib/testing.ts';
import { runMigrations } from './migrate.ts';
import { migrations } from './migrations/index.ts';
import { Store } from './store.ts';

describe('migration 0006: coupon max discount', () => {
  it('leaves seeded coupons uncapped', () => {
    const app = createTestApp();
    assert.equal(app.ctx.store.coupons.require('WELCOME10').maxDiscount, null);
    assert.ok((migrations.at(-1)?.version ?? 0) > 5, 'a new migration was added after the existing five');
  });

  it('backfills coupons that already exist', () => {
    const store = new Store();
    runMigrations(store, migrations.filter((m) => m.version <= 5));
    store.coupons.insert({ id: 'OLD', kind: 'percent', value: 5 } as never);
    runMigrations(store);
    assert.equal(store.coupons.require('OLD').maxDiscount, null);
  });
});
