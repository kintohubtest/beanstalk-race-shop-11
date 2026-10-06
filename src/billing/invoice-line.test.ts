import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, ON_ADDRESS, US_ADDRESS } from '../lib/testing.ts';
import type { InvoiceItem } from './invoice.ts';
import { buildInvoice, buildInvoiceLine } from './invoice.ts';

const item: InvoiceItem = { productId: 'prd_1', description: 'Teapot', quantity: 2, unitPrice: 5000, taxClass: 'standard' };

describe('buildInvoiceLine', () => {
  it('works out net, discount, rate and tax for one item', () => {
    const app = createTestApp();
    assert.deepEqual(buildInvoiceLine(app.ctx, ON_ADDRESS, item, 1000), {
      productId: 'prd_1',
      description: 'Teapot',
      quantity: 2,
      unitPrice: 5000,
      net: 10000,
      discount: 1000,
      taxRate: 0.13,
      tax: 1170,
    });
  });

  it('uses the tax class and the destination', () => {
    const app = createTestApp();
    assert.equal(buildInvoiceLine(app.ctx, US_ADDRESS, { ...item, taxClass: 'reduced' }, 0).taxRate, 0.0325);
    assert.equal(buildInvoiceLine(app.ctx, ON_ADDRESS, { ...item, taxClass: 'exempt' }, 0).tax, 0);
  });

  it('is what buildInvoice builds its lines from', () => {
    const app = createTestApp();
    const other: InvoiceItem = { ...item, productId: 'prd_2', quantity: 1, unitPrice: 999 };
    const invoice = buildInvoice(app.ctx, { orderId: 'o', userId: 'u', address: ON_ADDRESS, items: [item, other] });
    assert.deepEqual(invoice.lines[0], buildInvoiceLine(app.ctx, ON_ADDRESS, item, 0));
    assert.deepEqual(invoice.lines[1], buildInvoiceLine(app.ctx, ON_ADDRESS, other, 0));
  });
});
