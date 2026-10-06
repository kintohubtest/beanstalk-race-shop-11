import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultConfig, loadConfig } from '../config.ts';
import { createTestApp, placeOrder, signUp, US_ADDRESS } from '../lib/testing.ts';

function shipmentFor(price: number) {
  const app = createTestApp();
  const { order, token } = placeOrder(app, { price, address: US_ADDRESS });
  const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
  app.call('POST', `/orders/${order.id}/ship`, { token: admin.token, body: { trackingNumber: 'TRK-1' } });
  const res = app.call('GET', `/orders/${order.id}/shipment`, { token });
  return res.body as { signatureRequired: boolean };
}

describe('signature on delivery', () => {
  it('has a $250 default threshold that can be overridden', () => {
    assert.equal(defaultConfig.signatureThreshold, 25000);
    assert.equal(loadConfig({ SIGNATURE_THRESHOLD: '10000' }).signatureThreshold, 10000);
  });

  it('is not required just under the threshold', () => {
    assert.equal(shipmentFor(23400).signatureRequired, false);
  });

  it('is required for high-value orders', () => {
    assert.equal(shipmentFor(30000).signatureRequired, true);
  });
});
