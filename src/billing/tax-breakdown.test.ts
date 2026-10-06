import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, ON_ADDRESS, placeOrder, US_ADDRESS } from '../lib/testing.ts';
import { buildInvoice } from './invoice.ts';
import { taxComponentsFor, taxRateFor } from './tax.ts';

describe('tax breakdown', () => {
  it('splits Ontario HST into 5% federal and 8% regional', () => {
    const app = createTestApp();
    const { order } = placeOrder(app, { price: 10000, address: ON_ADDRESS });
    const invoice = app.ctx.store.invoices.require(order.invoiceId!);
    assert.deepEqual(invoice.taxBreakdown, { federal: 500, regional: 800 });
    assert.equal(invoice.tax, 1300);
  });

  it('counts all US state tax as regional', () => {
    const app = createTestApp();
    const { order } = placeOrder(app, { price: 10000, address: US_ADDRESS });
    const invoice = app.ctx.store.invoices.require(order.invoiceId!);
    assert.deepEqual(invoice.taxBreakdown, { federal: 0, regional: 650 });
  });

  it('has no tax in either part for exempt goods', () => {
    const app = createTestApp();
    const { order } = placeOrder(app, { price: 10000, address: ON_ADDRESS, taxClass: 'exempt' });
    assert.deepEqual(app.ctx.store.invoices.require(order.invoiceId!).taxBreakdown, { federal: 0, regional: 0 });
  });

  it('always adds up to the invoice tax, even with awkward amounts', () => {
    const app = createTestApp();
    const item = (unitPrice: number) => ({ productId: 'p', description: 'x', quantity: 1, unitPrice, taxClass: 'standard' as const });
    const invoice = buildInvoice(app.ctx, { orderId: 'o', userId: 'u', address: ON_ADDRESS, items: [item(333), item(333), item(334)] });
    assert.equal(invoice.taxBreakdown.federal + invoice.taxBreakdown.regional, invoice.tax);
    assert.ok(invoice.taxBreakdown.federal > 0 && invoice.taxBreakdown.regional > 0);
  });

  it('keeps the combined rate and exposes the components', () => {
    assert.equal(taxRateFor(ON_ADDRESS, 'standard', 0.07), 0.13);
    assert.deepEqual(taxComponentsFor(ON_ADDRESS, 'standard', 0.07), { federal: 0.05, regional: 0.08 });
    assert.deepEqual(taxComponentsFor({ ...ON_ADDRESS, country: 'JP' }, 'standard', 0.1), { federal: 0, regional: 0.1 });
  });
});
