import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addCoupon, createTestApp, placeOrder } from '../lib/testing.ts';
import { couponDiscount } from './discounts.ts';

describe('coupon cap', () => {
  const fifty = { id: 'FIFTY', kind: 'fixed' as const, value: 5000, minSubtotal: 0, expiresAt: null, maxRedemptions: null, redemptions: 0 };

  it('never discounts more than the subtotal', () => {
    assert.equal(couponDiscount(fifty, 3000), 3000);
    assert.equal(couponDiscount(fifty, 8000), 5000);
    assert.equal(couponDiscount({ ...fifty, kind: 'percent', value: 100 }, 3000), 3000);
  });

  it('produces a zero invoice instead of a negative one', () => {
    const app = createTestApp();
    addCoupon(app.ctx, fifty);
    const { order } = placeOrder(app, { price: 3000, couponCode: 'FIFTY' });
    const invoice = app.ctx.store.invoices.require(order.invoiceId!);
    assert.deepEqual([invoice.discount, invoice.tax, invoice.total], [3000, 0, 0]);
    assert.equal(invoice.lines[0].discount, 3000);
  });
});
