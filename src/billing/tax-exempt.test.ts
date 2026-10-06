import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp, ON_ADDRESS, signUp } from '../lib/testing.ts';
import type { Order } from '../types.ts';

function checkoutAs(app: ReturnType<typeof createTestApp>, email: string, taxExempt: boolean) {
  const { user, token } = signUp(app.ctx, email, { address: ON_ADDRESS });
  if (taxExempt) app.ctx.store.users.update(user.id, { taxExempt: true });
  const product = addProduct(app.ctx, { price: 10000 });
  app.call('POST', '/cart/items', { token, body: { productId: product.id, quantity: 2 } });
  const order = app.call('POST', '/checkout', { token, body: { addressIndex: 0 } }).body as Order;
  return { user, order, invoice: app.ctx.store.invoices.require(order.invoiceId!) };
}

describe('tax-exempt customers', () => {
  it('charges no tax on any line of an exempt customer\'s invoice', () => {
    const app = createTestApp();
    const { order, invoice } = checkoutAs(app, 'wholesale@example.com', true);
    assert.equal(order.tax, 0);
    assert.deepEqual(invoice.lines.map((l) => l.taxRate), [0]);
    assert.equal(invoice.total, 20000);
  });

  it('still taxes everyone else', () => {
    const app = createTestApp();
    assert.equal(checkoutAs(app, 'retail@example.com', false).order.tax, 2600);
  });
});
