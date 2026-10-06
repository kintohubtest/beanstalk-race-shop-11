import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addItem, getCart } from '../cart/service.ts';
import { createTestApp, placeOrder, signUp } from '../lib/testing.ts';

describe('reorder', () => {
  it('puts the order\'s lines back into the cart', () => {
    const app = createTestApp();
    const { order, token, user, product } = placeOrder(app, { quantity: 3 });
    const res = app.call('POST', `/orders/${order.id}/reorder`, { token });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { added: [{ productId: product.id, quantity: 3 }], skipped: [] });
    assert.deepEqual(getCart(app.ctx, user.id).lines, [{ productId: product.id, quantity: 3 }]);
  });

  it('adds to what is already in the cart', () => {
    const app = createTestApp();
    const { order, token, user, product } = placeOrder(app, { quantity: 2 });
    addItem(app.ctx, user.id, product.id, 1);
    app.call('POST', `/orders/${order.id}/reorder`, { token });
    assert.equal(getCart(app.ctx, user.id).lines[0].quantity, 3);
  });

  it('skips products that are no longer sold', () => {
    const app = createTestApp();
    const { order, token, user, product } = placeOrder(app);
    app.ctx.store.products.update(product.id, { active: false });
    const res = app.call('POST', `/orders/${order.id}/reorder`, { token });
    assert.deepEqual(res.body, { added: [], skipped: [product.id] });
    assert.equal(getCart(app.ctx, user.id).lines.length, 0);
  });

  it('treats other people\'s orders as missing, admins included', () => {
    const app = createTestApp();
    const { order } = placeOrder(app);
    const stranger = signUp(app.ctx, 'stranger@example.com');
    const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
    assert.equal(app.call('POST', `/orders/${order.id}/reorder`, { token: stranger.token }).status, 404);
    assert.equal(app.call('POST', `/orders/${order.id}/reorder`, { token: admin.token }).status, 404);
    assert.equal(app.call('POST', '/orders/ord_9999/reorder', { token: stranger.token }).status, 404);
  });
});
