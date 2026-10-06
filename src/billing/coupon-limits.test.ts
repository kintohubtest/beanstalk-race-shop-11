import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addCoupon, createTestApp, errorMessage, tryCheckout } from '../lib/testing.ts';

describe('coupon redemption limits', () => {
  it('stops accepting a coupon once its limit is reached', () => {
    const app = createTestApp();
    addCoupon(app.ctx, { id: 'FIRST2', maxRedemptions: 2 });
    assert.equal(tryCheckout(app, { email: 'a@example.com', couponCode: 'FIRST2' }).res.status, 201);
    assert.equal(tryCheckout(app, { email: 'b@example.com', couponCode: 'FIRST2' }).res.status, 201);
    const third = tryCheckout(app, { email: 'c@example.com', couponCode: 'FIRST2' }).res;
    assert.equal(third.status, 409);
    assert.equal(errorMessage(third), 'coupon has been fully redeemed');
    assert.equal(app.ctx.store.coupons.require('FIRST2').redemptions, 2);
  });

  it('does not limit coupons without a maximum', () => {
    const app = createTestApp();
    addCoupon(app.ctx, { id: 'FOREVER', redemptions: 5000 });
    assert.equal(tryCheckout(app, { couponCode: 'FOREVER' }).res.status, 201);
  });
});
