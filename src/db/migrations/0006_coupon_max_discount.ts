import type { Migration } from '../migrate.ts';

export const migration0006: Migration = {
  version: 6,
  name: 'coupon_max_discount',
  up(store) {
    store.coupons.addColumn('maxDiscount', null);
  },
};
