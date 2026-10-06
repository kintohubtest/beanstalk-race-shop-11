import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, placeOrder, signUp } from '../lib/testing.ts';
import type { Order } from '../types.ts';

describe('tracking numbers on shipments', () => {
  it('stores the tracking number on the shipment and not on the order', () => {
    const app = createTestApp();
    const { order, token } = placeOrder(app);
    const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
    const shipped = app.call('POST', `/orders/${order.id}/ship`, { token: admin.token, body: { trackingNumber: 'TRK-5' } });
    assert.equal(shipped.status, 200);
    assert.equal((shipped.body as Order).status, 'shipped');
    assert.ok(!('trackingNumber' in (shipped.body as object)));
    assert.ok(!('trackingNumber' in app.ctx.store.orders.require(order.id)));
    const shipment = app.call('GET', `/orders/${order.id}/shipment`, { token }).body as { trackingNumber: string };
    assert.equal(shipment.trackingNumber, 'TRK-5');
    assert.equal(app.ctx.store.shipments.all()[0].trackingNumber, 'TRK-5');
  });

  it('new orders do not carry a tracking number either', () => {
    const { order } = placeOrder(createTestApp());
    assert.ok(!('trackingNumber' in order));
  });

});
