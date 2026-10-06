import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp, placeOrder } from '../lib/testing.ts';
import type { Invoice } from '../types.ts';
import { markPaid } from './service.ts';

function customerWithInvoices(count: number) {
  const app = createTestApp();
  const first = placeOrder(app);
  for (let i = 1; i < count; i++) {
    app.clock.advance(60_000);
    const product = addProduct(app.ctx);
    app.call('POST', '/cart/items', { token: first.token, body: { productId: product.id, quantity: 1 } });
    app.call('POST', '/checkout', { token: first.token, body: { addressIndex: 0 } });
  }
  return { app, token: first.token };
}

describe('invoice list', () => {
  it('returns the caller\'s invoices as an array, newest first', () => {
    const { app, token } = customerWithInvoices(3);
    placeOrder(app, { email: 'someone-else@example.com' });
    const res = app.call('GET', '/invoices', { token });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    const invoices = res.body as Invoice[];
    assert.equal(invoices.length, 3);
    assert.deepEqual(invoices.map((i) => i.id), ['inv_0003', 'inv_0002', 'inv_0001']);
  });

  it('filters by status and rejects unknown ones', () => {
    const { app, token } = customerWithInvoices(3);
    markPaid(app.ctx, 'inv_0002');
    const paid = app.call('GET', '/invoices', { token, query: { status: 'paid' } }).body as Invoice[];
    assert.deepEqual(paid.map((i) => i.id), ['inv_0002']);
    assert.equal((app.call('GET', '/invoices', { token, query: { status: 'open' } }).body as Invoice[]).length, 2);
    assert.equal(app.call('GET', '/invoices', { token, query: { status: 'overdue' } }).status, 400);
  });

  it('pages with limit and offset', () => {
    const { app, token } = customerWithInvoices(3);
    const page = app.call('GET', '/invoices', { token, query: { limit: '2', offset: '1' } }).body as Invoice[];
    assert.deepEqual(page.map((i) => i.id), ['inv_0002', 'inv_0001']);
  });

  it('needs a signed-in user', () => {
    assert.equal(createTestApp().call('GET', '/invoices').status, 401);
  });
});
