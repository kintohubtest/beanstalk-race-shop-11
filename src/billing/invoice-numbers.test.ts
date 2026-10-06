import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, placeOrder } from '../lib/testing.ts';

describe('invoice numbers', () => {
  it('count up within a year and restart on January 1st', () => {
    const app = createTestApp();
    const numberOf = (email: string) => {
      const { order } = placeOrder(app, { email });
      return app.ctx.store.invoices.require(order.invoiceId!).number;
    };
    assert.equal(numberOf('a@example.com'), 'INV-2026-0001');
    assert.equal(numberOf('b@example.com'), 'INV-2026-0002');
    app.clock.advance(Date.parse('2027-01-01T00:00:00Z') - app.clock.now().getTime());
    assert.equal(numberOf('c@example.com'), 'INV-2027-0001');
    assert.equal(numberOf('d@example.com'), 'INV-2027-0002');
  });

  it('keeps invoice ids sequential across years', () => {
    const app = createTestApp();
    const first = placeOrder(app, { email: 'a@example.com' }).order.invoiceId;
    app.clock.advance(Date.parse('2027-03-01T00:00:00Z') - app.clock.now().getTime());
    const second = placeOrder(app, { email: 'b@example.com' }).order.invoiceId;
    assert.deepEqual([first, second], ['inv_0001', 'inv_0002']);
  });
});
