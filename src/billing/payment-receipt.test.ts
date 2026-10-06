import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, placeOrder, signUp } from '../lib/testing.ts';
import type { Notification } from '../types.ts';
import { markPaid } from './service.ts';

describe('payment receipts', () => {
  it('emails the customer when an invoice is paid', () => {
    const app = createTestApp();
    const { order } = placeOrder(app, { email: 'carol@example.com' });
    const before = app.mailer.sent.length;
    markPaid(app.ctx, order.invoiceId!);
    assert.equal(app.mailer.sent.length, before + 1);
    assert.deepEqual(app.mailer.sent.at(-1), {
      to: 'carol@example.com',
      subject: `Payment received for order ${order.number}`,
      body: `We have received your payment for order ${order.number}. Thank you!`,
    });
  });

  it('is sent when an admin pays over HTTP, and only then', () => {
    const app = createTestApp();
    const { order, token } = placeOrder(app);
    const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
    const sentBefore = app.mailer.sent.length;
    app.call('POST', `/invoices/${order.invoiceId}/pay`, { token });
    assert.equal(app.mailer.sent.length, sentBefore, 'customers cannot pay for themselves');
    app.call('POST', `/invoices/${order.invoiceId}/pay`, { token: admin.token });
    app.call('POST', `/invoices/${order.invoiceId}/pay`, { token: admin.token });
    assert.equal(app.mailer.sent.length, sentBefore + 1, 'a second attempt fails and sends nothing');
  });

  it('shows up in the notification list as payment_received', () => {
    const app = createTestApp();
    const { order, token } = placeOrder(app);
    markPaid(app.ctx, order.invoiceId!);
    const list = app.call('GET', '/notifications', { token }).body as Notification[];
    assert.ok(list.some((n) => n.kind === 'payment_received'));
  });
});
