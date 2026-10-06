import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp, errorMessage, signUp } from '../lib/testing.ts';

describe('empty cart checkout', () => {
  it('is rejected up front', () => {
    const app = createTestApp();
    const { token } = signUp(app.ctx);
    const res = app.call('POST', '/checkout', { token, body: { addressIndex: 0 } });
    assert.equal(res.status, 400);
    assert.equal(errorMessage(res), 'cart is empty');
    assert.equal(app.ctx.store.invoices.all().length, 0);
    assert.equal(app.ctx.store.orders.all().length, 0);
  });

  it('does not use up an invoice number', () => {
    const app = createTestApp();
    const { token } = signUp(app.ctx);
    app.call('POST', '/checkout', { token, body: { addressIndex: 0 } });
    const product = addProduct(app.ctx);
    app.call('POST', '/cart/items', { token, body: { productId: product.id, quantity: 1 } });
    const order = app.call('POST', '/checkout', { token, body: { addressIndex: 0 } }).body as { invoiceId: string };
    assert.equal(order.invoiceId, 'inv_0001');
  });
});
