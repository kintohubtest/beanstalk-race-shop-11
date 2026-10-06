import type { Migration } from '../migrate.ts';

export const migration0006: Migration = {
  version: 6,
  name: 'user_tax_exempt',
  up(store) {
    store.users.addColumn('taxExempt', false);
  },
};
