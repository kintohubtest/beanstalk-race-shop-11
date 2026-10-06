import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runMigrations } from './migrate.ts';
import { migrations } from './migrations/index.ts';
import { Store } from './store.ts';

describe('migration 0006: order note', () => {
  it('gives orders that already exist an empty note', () => {
    const store = new Store();
    runMigrations(store, migrations.filter((m) => m.version <= 5));
    store.orders.insert({ id: 'ord_old' } as never);
    runMigrations(store);
    assert.equal(store.orders.require('ord_old').note, '');
  });

  it('adds the migration at the end of the registry', () => {
    assert.equal(migrations.at(-1)?.name, 'order_note');
  });
});
