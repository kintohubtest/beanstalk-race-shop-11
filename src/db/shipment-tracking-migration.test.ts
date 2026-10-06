import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { runMigrations } from './migrate.ts';
import { migrations } from './migrations/index.ts';
import { Store } from './store.ts';

describe('migration 0006: shipment tracking', () => {
  it('copies existing tracking numbers onto shipments and drops the order column', () => {
    const store = new Store();
    runMigrations(store, migrations.filter((m) => m.version <= 5));
    store.orders.insert({ id: 'ord_1', trackingNumber: 'OLD-1' } as never);
    store.shipments.insert({ id: 'shp_1', orderId: 'ord_1' } as never);
    store.shipments.insert({ id: 'shp_2', orderId: 'ord_missing' } as never);
    runMigrations(store);
    assert.equal(store.shipments.require('shp_1').trackingNumber, 'OLD-1');
    assert.equal(store.shipments.require('shp_2').trackingNumber, null);
    assert.ok(!('trackingNumber' in store.orders.require('ord_1')));
  });
});
