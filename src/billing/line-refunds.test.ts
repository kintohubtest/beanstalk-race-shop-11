import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp, ON_ADDRESS, signUp } from '../lib/testing.ts';
import type { Invoice, Order } from '../types.ts';
import { markPaid } from './service.ts';

function threeLineOrder() {
  const app = createTestApp();
  const customer = signUp(app.ctx, 'buyer@example.com', { address: ON_ADDRESS });
  const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
  const products = [333, 333, 333].map((price) => addProduct(app.ctx, { price }));
  for (const p of products) {
    app.call('POST', '/cart/items', { token: customer.token, body: { productId: p.id, quantity: 1 } });
  }
  const order = app.call('POST', '/checkout', { token: customer.token, body: { addressIndex: 0 } }).body as Order;
  return { app, customer, admin, products, order };
}

const refund = (t: ReturnType<typeof threeLineOrder>, productId: string, token = t.admin.token) =>
  t.app.call('POST', `/invoices/${t.order.invoiceId}/refunds`, { token, body: { productId } });

describe('line refunds', () => {
  it('refunds a line\'s net plus the tax charged on it', () => {
    const t = threeLineOrder();
    markPaid(t.app.ctx, t.order.invoiceId!);
    const res = refund(t, t.products[0].id);
    assert.equal(res.status, 201);
    assert.equal((res.body as { productId: string }).productId, t.products[0].id);
    assert.equal((res.body as { createdAt: string }).createdAt, '2026-09-15T12:00:00.000Z');
    const invoice = t.app.ctx.store.invoices.require(t.order.invoiceId!) as Invoice;
    assert.equal(invoice.refunds?.length, 1);
    assert.equal(invoice.refunds?.[0].amount, (res.body as { amount: number }).amount);
  });

  it('refunds identical lines identically: $3.33 plus 43 cents of tax each', () => {
    const t = threeLineOrder();
    markPaid(t.app.ctx, t.order.invoiceId!);
    const amounts = t.products.map((p) => (refund(t, p.id).body as { amount: number }).amount);
    assert.deepEqual(amounts, [376, 376, 376]);
  });

  it('refunding every line returns the whole invoice total', () => {
    const t = threeLineOrder();
    markPaid(t.app.ctx, t.order.invoiceId!);
    const amounts = t.products.map((p) => (refund(t, p.id).body as { amount: number }).amount);
    assert.equal(amounts.reduce((a, b) => a + b, 0), t.app.ctx.store.invoices.require(t.order.invoiceId!).total);
  });

  it('refuses double refunds, unknown products and unpaid invoices', () => {
    const t = threeLineOrder();
    assert.equal(refund(t, t.products[0].id).status, 409, 'invoice is still open');
    markPaid(t.app.ctx, t.order.invoiceId!);
    assert.equal(refund(t, 'prd_nope').status, 404);
    assert.equal(refund(t, t.products[1].id).status, 201);
    assert.equal(refund(t, t.products[1].id).status, 409);
  });

  it('is for admins only', () => {
    const t = threeLineOrder();
    markPaid(t.app.ctx, t.order.invoiceId!);
    assert.equal(refund(t, t.products[0].id, t.customer.token).status, 403);
  });
});
