import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, placeOrder, signUp } from '../lib/testing.ts';
import { markPaid, voidInvoice } from './service.ts';

const DAY = 24 * 60 * 60 * 1000;

describe('overdue invoices', () => {
  it('lists open invoices past their due date, longest overdue first', () => {
    const app = createTestApp();
    app.ctx.config.sessionTtlSeconds = 90 * 24 * 60 * 60;
    const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
    const early = placeOrder(app, { email: 'a@example.com' }).order.invoiceId;
    app.clock.advance(5 * DAY);
    const later = placeOrder(app, { email: 'b@example.com' }).order.invoiceId;
    const paid = placeOrder(app, { email: 'c@example.com' }).order.invoiceId!;
    const voided = placeOrder(app, { email: 'd@example.com' }).order.invoiceId!;
    markPaid(app.ctx, paid);
    voidInvoice(app.ctx, voided);
    app.clock.advance(24 * DAY);
    assert.deepEqual(app.call('GET', '/invoices/overdue', { token: admin.token }).body, []);
    app.clock.advance(7 * DAY + 60_000);
    const overdue = app.call('GET', '/invoices/overdue', { token: admin.token }).body as { id: string; daysOverdue: number }[];
    assert.deepEqual(overdue.map((i) => i.id), [early, later]);
    assert.deepEqual(overdue.map((i) => i.daysOverdue), [6, 1]);
  });

  it('is for admins only and is not mistaken for an invoice id', () => {
    const app = createTestApp();
    const customer = signUp(app.ctx, 'buyer@example.com');
    const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
    assert.equal(app.call('GET', '/invoices/overdue', { token: customer.token }).status, 403);
    assert.equal(app.call('GET', '/invoices/overdue', { token: admin.token }).status, 200);
  });
});
