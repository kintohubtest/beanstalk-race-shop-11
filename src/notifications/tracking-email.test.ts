import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, placeOrder, signUp } from '../lib/testing.ts';

describe('shipped email', () => {
  it('includes the tracking number', () => {
    const app = createTestApp();
    const { order } = placeOrder(app);
    const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
    app.call('POST', `/orders/${order.id}/ship`, { token: admin.token, body: { trackingNumber: 'TRK-9981' } });
    const mail = app.mailer.sent.at(-1)!;
    assert.match(mail.subject, /has shipped/);
    assert.equal(mail.body, `Your order ${order.number} is on its way.\nTracking number: TRK-9981`);
  });

  it('is what the customer sees in their notification list', () => {
    const app = createTestApp();
    const { order, token } = placeOrder(app);
    const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
    app.call('POST', `/orders/${order.id}/ship`, { token: admin.token, body: { trackingNumber: 'ZZ-42' } });
    const list = app.call('GET', '/notifications', { token }).body as { kind: string; body: string }[];
    assert.match(list[0].body, /Tracking number: ZZ-42$/);
  });
});
