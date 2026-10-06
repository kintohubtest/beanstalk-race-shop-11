import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp, placeOrder, signUp, US_ADDRESS } from '../lib/testing.ts';
import type { ShippingQuote } from '../types.ts';
import { FREE_SHIPPING_THRESHOLD } from './service.ts';

function quoteFor(price: number, quantity: number, method: 'standard' | 'express' = 'standard') {
  const app = createTestApp();
  const { token } = signUp(app.ctx, 'a@example.com', { address: US_ADDRESS });
  const product = addProduct(app.ctx, { price });
  app.call('POST', '/cart/items', { token, body: { productId: product.id, quantity } });
  return app.call('POST', '/shipping/quote', { token, body: { addressIndex: 0, method } }).body as ShippingQuote;
}

describe('free shipping', () => {
  it('has a $75 threshold', () => {
    assert.equal(FREE_SHIPPING_THRESHOLD, 7500);
  });

  it('makes standard shipping free at the threshold', () => {
    assert.equal(quoteFor(2500, 3).cost, 0);
    assert.equal(quoteFor(7499, 1).cost, 500);
    assert.equal(quoteFor(7500, 1).cost, 0);
  });

  it('never makes express shipping free', () => {
    assert.deepEqual(quoteFor(10000, 1, 'express'), { method: 'express', cost: 1000, etaDays: 2 });
  });

  it('applies to the shipping charged at checkout', () => {
    const app = createTestApp();
    assert.equal(placeOrder(app, { price: 8000, address: US_ADDRESS }).order.shippingCost, 0);
    assert.equal(placeOrder(app, { email: 'b@example.com', price: 7000, address: US_ADDRESS }).order.shippingCost, 500);
  });
});
