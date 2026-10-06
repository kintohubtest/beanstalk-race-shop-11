import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getCart } from '../cart/service.ts';
import { getStock } from '../inventory/stock.ts';
import { addProduct, createTestApp, signUp } from '../lib/testing.ts';

function cartWith(app: ReturnType<typeof createTestApp>, quantity: number, price = 1500, stock = 5) {
  const { user, token } = signUp(app.ctx);
  const product = addProduct(app.ctx, { price, stock });
  app.call('POST', '/cart/items', { token, body: { productId: product.id, quantity } });
  return { user, token, product };
}

describe('failed checkouts', () => {
  it('release the stock when the coupon code is unknown', () => {
    const app = createTestApp();
    const { token, product, user } = cartWith(app, 2);
    const res = app.call('POST', '/checkout', { token, body: { addressIndex: 0, couponCode: 'NOPE' } });
    assert.equal(res.status, 400);
    assert.equal(getStock(app.ctx, product.id).reserved, 0);
    assert.equal(getCart(app.ctx, user.id).lines.length, 1);
    assert.equal(app.ctx.store.invoices.all().length, 0);
  });

  it('release the stock when the cart is below the coupon minimum', () => {
    const app = createTestApp();
    const { token, product } = cartWith(app, 1, 1500);
    const res = app.call('POST', '/checkout', { token, body: { addressIndex: 0, couponCode: 'FIVEOFF' } });
    assert.equal(res.status, 400);
    assert.equal(getStock(app.ctx, product.id).reserved, 0);
  });

  it('let the customer buy the last unit afterwards', () => {
    const app = createTestApp();
    const { token, product } = cartWith(app, 1, 1500, 1);
    app.call('POST', '/checkout', { token, body: { addressIndex: 0, couponCode: 'NOPE' } });
    assert.equal(app.call('POST', '/checkout', { token, body: { addressIndex: 0 } }).status, 201);
    assert.equal(getStock(app.ctx, product.id).reserved, 1);
  });
});
