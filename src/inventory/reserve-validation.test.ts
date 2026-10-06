import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from '../lib/errors.ts';
import { addProduct, createTestApp } from '../lib/testing.ts';
import { getStock, reserve } from './stock.ts';

describe('reserve validation', () => {
  it('rejects zero, negative and fractional quantities', () => {
    const app = createTestApp();
    const product = addProduct(app.ctx, { stock: 10 });
    for (const quantity of [0, -3, 1.5]) {
      assert.throws(
        () => reserve(app.ctx, [{ productId: product.id, quantity }]),
        (e: unknown) => e instanceof AppError && e.status === 400 && e.message === 'quantity must be a positive whole number',
        `quantity ${quantity}`,
      );
    }
    assert.equal(getStock(app.ctx, product.id).reserved, 0);
  });

  it('still reserves positive whole quantities', () => {
    const app = createTestApp();
    const product = addProduct(app.ctx, { stock: 10 });
    reserve(app.ctx, [{ productId: product.id, quantity: 4 }]);
    assert.equal(getStock(app.ctx, product.id).reserved, 4);
  });
});
