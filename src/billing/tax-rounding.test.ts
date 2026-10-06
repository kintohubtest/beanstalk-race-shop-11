import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, ON_ADDRESS } from '../lib/testing.ts';
import { applyRateToTotal, sumCents } from '../lib/money.ts';
import type { TaxClass } from '../types.ts';
import { buildInvoice } from './invoice.ts';

const item = (unitPrice: number, taxClass: TaxClass = 'standard') => ({
  productId: 'p', description: 'x', quantity: 1, unitPrice, taxClass,
});

function invoiceFor(...items: ReturnType<typeof item>[]) {
  const app = createTestApp();
  return buildInvoice(app.ctx, { orderId: 'o', userId: 'u', address: ON_ADDRESS, items });
}

describe('tax rounding', () => {
  it('rounds once over the total and spreads the cents over the amounts', () => {
    const shares = applyRateToTotal([333, 333, 333], 0.13);
    assert.equal(sumCents(shares), 130);
    assert.deepEqual([...shares].sort(), [43, 43, 44]);
    assert.deepEqual(applyRateToTotal([0, 0], 0.13), [0, 0]);
    assert.deepEqual(applyRateToTotal([1000], 0.13), [130]);
  });

  it('charges the tax authority\'s figure on a three-line invoice', () => {
    const invoice = invoiceFor(item(333), item(333), item(333));
    assert.equal(invoice.tax, 130);
    assert.deepEqual(invoice.lines.map((l) => l.tax).sort(), [43, 43, 44]);
    assert.equal(invoice.total, 999 + 130);
  });

  it('rounds each rate on its own', () => {
    const invoice = invoiceFor(item(333), item(333), item(333, 'reduced'));
    const taxes = invoice.lines.map((l) => l.tax);
    assert.equal(taxes[0] + taxes[1], 87, 'the two standard lines share one rounded figure');
    assert.equal(taxes[2], 22);
    assert.equal(invoice.tax, 109);
  });

  it('does not change single-line invoices', () => {
    assert.equal(invoiceFor(item(1999)).tax, 260);
    assert.equal(invoiceFor(item(10)).tax, 1);
  });
});
