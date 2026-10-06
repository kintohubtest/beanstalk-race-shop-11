import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, placeOrder } from '../lib/testing.ts';
import { renderNotification, templates } from './templates.ts';

describe('notification templates', () => {
  it('has one render function per kind', () => {
    assert.deepEqual(Object.keys(templates).sort(), ['order_cancelled', 'order_confirmed', 'order_shipped']);
    for (const render of Object.values(templates)) assert.equal(typeof render, 'function');
  });

  it('renders exactly what renderNotification does', () => {
    const { order } = placeOrder(createTestApp());
    for (const kind of ['order_confirmed', 'order_shipped', 'order_cancelled'] as const) {
      assert.deepEqual(templates[kind](order, 'USD'), renderNotification(kind, order, 'USD'));
    }
  });

  it('keeps the wording of the existing messages', () => {
    const { order } = placeOrder(createTestApp(), { price: 1500 });
    assert.equal(renderNotification('order_shipped', order, 'USD').subject, `Order ${order.number} has shipped`);
    assert.equal(renderNotification('order_cancelled', order, 'USD').body, `Your order ${order.number} was cancelled. Any payment will be refunded.`);
    assert.equal(renderNotification('order_confirmed', order, 'USD').body.split('\n')[0], 'Thanks for your order!');
  });
});
