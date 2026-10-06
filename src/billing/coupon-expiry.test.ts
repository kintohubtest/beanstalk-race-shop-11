import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addCoupon, createTestApp, errorMessage, tryCheckout } from '../lib/testing.ts';

describe('coupon expiry', () => {
  it('rejects a coupon whose expiry has passed', () => {
    const app = createTestApp();
    addCoupon(app.ctx, { id: 'OLDIE', expiresAt: '2026-09-01T00:00:00.000Z' });
    const { res } = tryCheckout(app, { couponCode: 'OLDIE' });
    assert.equal(res.status, 400);
    assert.equal(errorMessage(res), 'coupon has expired');
    assert.equal(app.ctx.store.coupons.require('OLDIE').redemptions, 0);
  });

  it('rejects it exactly at the expiry time', () => {
    const app = createTestApp();
    addCoupon(app.ctx, { id: 'NOW', expiresAt: '2026-09-15T12:00:00.000Z' });
    assert.equal(tryCheckout(app, { couponCode: 'NOW' }).res.status, 400);
  });

  it('accepts coupons that expire later or never', () => {
    const app = createTestApp();
    addCoupon(app.ctx, { id: 'SOON', expiresAt: '2026-09-15T12:00:01.000Z' });
    assert.equal(tryCheckout(app, { couponCode: 'SOON' }).res.status, 201);
    assert.equal(tryCheckout(app, { email: 'b@example.com', couponCode: 'WELCOME10' }).res.status, 201);
  });
});
