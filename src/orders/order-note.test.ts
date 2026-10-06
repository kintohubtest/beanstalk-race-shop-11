import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp, errorMessage, signUp } from '../lib/testing.ts';
import type { Order } from '../types.ts';

function checkout(note?: string) {
  const app = createTestApp();
  const { token } = signUp(app.ctx);
  const product = addProduct(app.ctx);
  app.call('POST', '/cart/items', { token, body: { productId: product.id, quantity: 1 } });
  const res = app.call('POST', '/checkout', { token, body: { addressIndex: 0, note } });
  return { app, token, res };
}

describe('order notes', () => {
  it('stores a trimmed note and returns it with the order', () => {
    const { app, token, res } = checkout('  leave with the concierge  ');
    assert.equal(res.status, 201);
    assert.equal((res.body as Order).note, 'leave with the concierge');
    const fetched = app.call('GET', `/orders/${(res.body as Order).id}`, { token }).body as Order;
    assert.equal(fetched.note, 'leave with the concierge');
  });

  it('defaults to an empty note', () => {
    assert.equal((checkout().res.body as Order).note, '');
    assert.equal((checkout('   ').res.body as Order).note, '');
  });

  it('rejects notes over 200 characters but accepts exactly 200', () => {
    assert.equal(checkout('x'.repeat(200)).res.status, 201);
    const tooLong = checkout('x'.repeat(201)).res;
    assert.equal(tooLong.status, 400);
    assert.equal(errorMessage(tooLong), 'note must be at most 200 characters');
  });
});
