import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CA_ADDRESS, createTestApp, ON_ADDRESS, placeOrder } from '../lib/testing.ts';
import { taxRateFor } from './tax.ts';

describe('Quebec sales tax', () => {
  it('uses the combined 14.975% rate, halved for reduced goods', () => {
    assert.equal(taxRateFor(CA_ADDRESS, 'standard', 0.07), 0.14975);
    assert.equal(taxRateFor(CA_ADDRESS, 'reduced', 0.07), 0.14975 / 2);
    assert.equal(taxRateFor(CA_ADDRESS, 'exempt', 0.07), 0);
  });

  it('charges that rate on a Quebec order', () => {
    const { order } = placeOrder(createTestApp(), { price: 20000 });
    assert.equal(order.tax, 2995);
    assert.equal(order.shippingAddress.region, 'QC');
  });

  it('leaves Ontario alone', () => {
    const { order } = placeOrder(createTestApp(), { price: 20000, address: ON_ADDRESS });
    assert.equal(order.tax, 2600);
  });
});
