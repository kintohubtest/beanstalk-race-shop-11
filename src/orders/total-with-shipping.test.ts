import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, ON_ADDRESS, placeOrder, US_ADDRESS } from '../lib/testing.ts';

describe('order total', () => {
  it('includes shipping on top of goods and tax', () => {
    const app = createTestApp();
    const { order } = placeOrder(app, { price: 10000, address: US_ADDRESS });
    assert.equal(order.shippingCost, 500);
    assert.equal(order.total, order.subtotal - order.discount + order.tax + order.shippingCost);
    assert.equal(order.total, 10000 + 650 + 500);
  });

  it('works with discounts and cross-border shipping', () => {
    const app = createTestApp();
    const { order } = placeOrder(app, { price: 10000, address: ON_ADDRESS, couponCode: 'WELCOME10' });
    assert.equal(order.shippingCost, 1200);
    assert.equal(order.total, 9000 + 1170 + 1200);
  });

  it('leaves the invoice without shipping', () => {
    const app = createTestApp();
    const { order } = placeOrder(app, { price: 10000, address: US_ADDRESS });
    assert.equal(app.ctx.store.invoices.require(order.invoiceId!).total, 10650);
  });

  it('shows the new total in the confirmation email', () => {
    const app = createTestApp();
    placeOrder(app, { price: 10000, address: US_ADDRESS });
    assert.match(app.mailer.sent[0].body, /Total: \$111\.50$/);
  });
});
