import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp, placeOrder } from '../lib/testing.ts';
import type { Order, Product } from '../types.ts';

describe('x-total-count header', () => {
  it('reports the number of products before paging', () => {
    const app = createTestApp();
    for (let i = 0; i < 25; i++) addProduct(app.ctx);
    const res = app.call('GET', '/products', { query: { limit: '5' } });
    assert.equal((res.body as Product[]).length, 5);
    assert.equal(res.headers['x-total-count'], '25');
  });

  it('counts only the products matching the filters', () => {
    const app = createTestApp();
    addProduct(app.ctx, { category: 'coffee' });
    addProduct(app.ctx, { category: 'coffee' });
    addProduct(app.ctx, { category: 'tea' });
    const res = app.call('GET', '/products', { query: { category: 'coffee', limit: '1' } });
    assert.equal(res.headers['x-total-count'], '2');
  });

  it('reports the number of orders and keeps the body an array', () => {
    const app = createTestApp();
    const { token, product } = placeOrder(app);
    for (let i = 0; i < 2; i++) {
      app.clock.advance(1000);
      app.call('POST', '/cart/items', { token, body: { productId: product.id, quantity: 1 } });
      app.call('POST', '/checkout', { token, body: { addressIndex: 0 } });
    }
    const res = app.call('GET', '/orders', { token, query: { limit: '2' } });
    assert.ok(Array.isArray(res.body));
    assert.equal((res.body as Order[]).length, 2);
    assert.equal(res.headers['x-total-count'], '3');
  });
});
