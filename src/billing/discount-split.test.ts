import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addCoupon, addProduct, CA_ADDRESS, createTestApp, signUp } from '../lib/testing.ts';
import { sumCents } from '../lib/money.ts';
import type { Invoice } from '../types.ts';
import { allocateDiscount } from './discounts.ts';

describe('discount split', () => {
  it('shares always add up to the discount and stay within a cent of fair', () => {
    for (const [nets, discount] of [[[333, 333, 334], 100], [[1, 1, 1, 1, 1, 1, 1], 100], [[999, 1, 500], 77]] as const) {
      const shares = allocateDiscount([...nets], discount);
      const total = sumCents([...nets]);
      assert.equal(sumCents(shares), discount);
      shares.forEach((share, i) => assert.ok(Math.abs(share - (discount * nets[i]) / total) < 1, `share ${i} of ${nets}`));
    }
    assert.deepEqual(allocateDiscount([0, 0], 100), [0, 0]);
    assert.deepEqual(allocateDiscount([500, 500], 0), [0, 0]);
  });

  it('keeps the invoice lines consistent with the header', () => {
    const app = createTestApp();
    addCoupon(app.ctx, { id: 'ONEBUCK', kind: 'fixed', value: 100 });
    const { token } = signUp(app.ctx, 'buyer@example.com', { address: CA_ADDRESS });
    for (const price of [333, 333, 334]) {
      const product = addProduct(app.ctx, { price });
      app.call('POST', '/cart/items', { token, body: { productId: product.id, quantity: 1 } });
    }
    const order = app.call('POST', '/checkout', { token, body: { addressIndex: 0, couponCode: 'ONEBUCK' } }).body as { invoiceId: string };
    const invoice = app.ctx.store.invoices.require(order.invoiceId) as Invoice;
    assert.equal(invoice.discount, 100);
    assert.equal(sumCents(invoice.lines.map((l) => l.discount)), 100);
  });
});
