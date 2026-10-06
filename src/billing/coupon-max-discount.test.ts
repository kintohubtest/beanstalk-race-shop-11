import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addCoupon, createTestApp, placeOrder } from '../lib/testing.ts';
import { couponDiscount } from './discounts.ts';

const percent = { id: 'P20', kind: 'percent' as const, value: 20, minSubtotal: 0, expiresAt: null, maxRedemptions: null, redemptions: 0 };

describe('coupon max discount', () => {
  it('caps percentage discounts', () => {
    const capped = { ...percent, maxDiscount: 2500 };
    assert.equal(couponDiscount(capped, 20000), 2500);
    assert.equal(couponDiscount(capped, 5000), 1000);
  });

  it('ignores the cap for fixed coupons and treats missing or null as no cap', () => {
    assert.equal(couponDiscount({ ...percent, kind: 'fixed', value: 4000, maxDiscount: 100 }, 20000), 4000);
    assert.equal(couponDiscount({ ...percent, maxDiscount: null }, 20000), 4000);
    assert.equal(couponDiscount(percent, 20000), 4000);
  });

  it('applies at checkout', () => {
    const app = createTestApp();
    addCoupon(app.ctx, { ...percent, maxDiscount: 2500 });
    const { order } = placeOrder(app, { price: 20000, couponCode: 'P20' });
    assert.equal(order.discount, 2500);
  });
});
