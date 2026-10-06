import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { reserve } from '../inventory/stock.ts';
import { addProduct, createTestApp, errorMessage, signUp } from '../lib/testing.ts';
import { getCart } from './service.ts';

function setup(stock: number) {
  const app = createTestApp();
  const { user, token } = signUp(app.ctx);
  const product = addProduct(app.ctx, { stock });
  const add = (quantity: number) => app.call('POST', '/cart/items', { token, body: { productId: product.id, quantity } });
  const set = (quantity: number) => app.call('PATCH', `/cart/items/${product.id}`, { token, body: { quantity } });
  return { app, user, product, add, set };
}

describe('cart stock check', () => {
  it('accepts quantities up to the stock on hand', () => {
    const { add, app, user } = setup(3);
    assert.equal(add(3).status, 201);
    assert.equal(getCart(app.ctx, user.id).lines[0].quantity, 3);
  });

  it('refuses to add more than is available, counting what is already in the cart', () => {
    const { add, app, user } = setup(3);
    assert.equal(add(2).status, 201);
    const res = add(2);
    assert.equal(res.status, 409);
    assert.equal(errorMessage(res), 'only 3 left in stock');
    assert.equal(getCart(app.ctx, user.id).lines[0].quantity, 2);
  });

  it('refuses to raise a line past the stock but lets it go down', () => {
    const { add, set } = setup(4);
    add(2);
    assert.equal(set(5).status, 409);
    assert.equal(set(4).status, 200);
    assert.equal(set(1).status, 200);
  });

  it('does not count stock reserved for other orders as available', () => {
    const { add, app, product } = setup(5);
    reserve(app.ctx, [{ productId: product.id, quantity: 4 }]);
    const res = add(2);
    assert.equal(res.status, 409);
    assert.equal(errorMessage(res), 'only 1 left in stock');
  });

  it('says zero when everything is reserved or sold', () => {
    const { add } = setup(0);
    assert.equal(errorMessage(add(1)), 'only 0 left in stock');
  });
});
