import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, placeOrder } from '../lib/testing.ts';
import { renderNotification } from './templates.ts';

describe('payment receipt template', () => {
  it('names the order', () => {
    const { order } = placeOrder(createTestApp());
    assert.deepEqual(renderNotification('payment_received', order, 'USD'), {
      subject: `Payment received for order ${order.number}`,
      body: `We have received your payment for order ${order.number}. Thank you!`,
    });
  });
});
