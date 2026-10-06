import type { Migration } from '../migrate.ts';

export const migration0006: Migration = {
  version: 6,
  name: 'order_note',
  up(store) {
    store.orders.addColumn('note', '');
  },
};
