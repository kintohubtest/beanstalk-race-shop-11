import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp, signUp } from '../lib/testing.ts';
import { getStock, reserve } from './stock.ts';

describe('atomic reservations', () => {
  it('reserve nothing when one line is short', () => {
    const app = createTestApp();
    const a = addProduct(app.ctx, { stock: 5 });
    const b = addProduct(app.ctx, { stock: 5 });
    const c = addProduct(app.ctx, { stock: 1 });
    const lines = [a, b, c].map((p) => ({ productId: p.id, quantity: 2 }));
    assert.throws(() => reserve(app.ctx, lines), new RegExp(`not enough stock for ${c.id}`));
    assert.deepEqual([a, b, c].map((p) => getStock(app.ctx, p.id).reserved), [0, 0, 0]);
  });

  it('name the first short line', () => {
    const app = createTestApp();
    const ok = addProduct(app.ctx, { stock: 5 });
    const short1 = addProduct(app.ctx, { stock: 0 });
    const short2 = addProduct(app.ctx, { stock: 0 });
    const lines = [ok, short1, short2].map((p) => ({ productId: p.id, quantity: 1 }));
    assert.throws(() => reserve(app.ctx, lines), new RegExp(short1.id));
  });

  it('reserve every line when all are covered', () => {
    const app = createTestApp();
    const a = addProduct(app.ctx, { stock: 5 });
    const b = addProduct(app.ctx, { stock: 5 });
    reserve(app.ctx, [{ productId: a.id, quantity: 3 }, { productId: b.id, quantity: 5 }]);
    assert.deepEqual([a, b].map((p) => getStock(app.ctx, p.id).reserved), [3, 5]);
  });

  it('keep stock intact across a failed checkout', () => {
    const app = createTestApp();
    const { token } = signUp(app.ctx);
    const plenty = addProduct(app.ctx, { stock: 10 });
    const scarce = addProduct(app.ctx, { stock: 5 });
    app.call('POST', '/cart/items', { token, body: { productId: plenty.id, quantity: 2 } });
    app.call('POST', '/cart/items', { token, body: { productId: scarce.id, quantity: 2 } });
    app.ctx.store.stock.update(scarce.id, { onHand: 1 });
    assert.equal(app.call('POST', '/checkout', { token, body: { addressIndex: 0 } }).status, 409);
    assert.equal(getStock(app.ctx, plenty.id).reserved, 0);
  });
});
