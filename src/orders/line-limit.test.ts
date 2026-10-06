import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultConfig, loadConfig } from '../config.ts';
import { getStock } from '../inventory/stock.ts';
import { addProduct, createTestApp, errorMessage, signUp } from '../lib/testing.ts';

function checkoutWith(app: ReturnType<typeof createTestApp>, quantity: number) {
  const { token } = signUp(app.ctx);
  const product = addProduct(app.ctx, { name: 'Cheap widget', price: 100, stock: 1000 });
  app.call('POST', '/cart/items', { token, body: { productId: product.id, quantity } });
  return { product, res: app.call('POST', '/checkout', { token, body: { addressIndex: 0 } }) };
}

describe('order line limit', () => {
  it('defaults to ten and can be set from the environment', () => {
    assert.equal(defaultConfig.maxLineQuantity, 10);
    assert.equal(loadConfig({ MAX_LINE_QUANTITY: '3' }).maxLineQuantity, 3);
  });

  it('accepts a line at the limit', () => {
    assert.equal(checkoutWith(createTestApp(), 10).res.status, 201);
  });

  it('rejects a line over the limit without touching stock or invoices', () => {
    const app = createTestApp();
    const { product, res } = checkoutWith(app, 11);
    assert.equal(res.status, 400);
    assert.equal(errorMessage(res), 'at most 10 units of Cheap widget per order');
    assert.equal(getStock(app.ctx, product.id).reserved, 0);
    assert.equal(app.ctx.store.invoices.all().length, 0);
  });

  it('follows the configured limit', () => {
    const app = createTestApp();
    app.ctx.config.maxLineQuantity = 2;
    assert.equal(checkoutWith(app, 3).res.status, 400);
  });
});
