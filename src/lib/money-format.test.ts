import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatMoney } from './money.ts';

describe('formatMoney digit grouping', () => {
  it('groups thousands with commas', () => {
    assert.equal(formatMoney(123456789), '$1,234,567.89');
    assert.equal(formatMoney(100000), '$1,000.00');
    assert.equal(formatMoney(1200000, 'EUR'), '€12,000.00');
  });

  it('keeps the sign in front and small amounts unchanged', () => {
    assert.equal(formatMoney(-123450), '-$1,234.50');
    assert.equal(formatMoney(99999), '$999.99');
    assert.equal(formatMoney(5), '$0.05');
    assert.equal(formatMoney(0, 'GBP'), '£0.00');
  });
});
