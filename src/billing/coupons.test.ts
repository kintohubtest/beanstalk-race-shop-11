import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as discounts from './discounts.ts';
import { couponDiscount, validateCoupon } from './coupons.ts';
import type { Coupon } from '../types.ts';

const coupon: Coupon = { id: 'C', kind: 'percent', value: 25, minSubtotal: 1000, expiresAt: null, maxRedemptions: null, redemptions: 0 };

describe('coupon rules module', () => {
  it('takes a percentage or a fixed amount off', () => {
    assert.equal(couponDiscount(coupon, 2000), 500);
    assert.equal(couponDiscount({ ...coupon, kind: 'fixed', value: 300 }, 2000), 300);
  });

  it('checks the minimum subtotal', () => {
    assert.equal(validateCoupon(coupon, 1000, 'USD'), coupon);
    assert.throws(() => validateCoupon(coupon, 999, 'USD'), /at least \$10\.00/);
  });

  it('keeps the old import path working', () => {
    assert.equal(discounts.couponDiscount, couponDiscount);
    assert.equal(discounts.validateCoupon, validateCoupon);
    assert.deepEqual(discounts.allocateDiscount([1000, 3000], 400), [100, 300]);
  });
});
