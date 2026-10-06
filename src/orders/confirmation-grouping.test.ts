import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, placeOrder, US_ADDRESS } from '../lib/testing.ts';

describe('order confirmation with digit grouping', () => {
  it('groups thousands in line items and the total', () => {
    const app = createTestApp();
    placeOrder(app, { price: 150000, quantity: 2, address: US_ADDRESS, stock: 5 });
    const body = app.mailer.sent[0].body;
    assert.match(body, /2 x Product \d+ - \$3,000\.00/);
    assert.match(body, /Total: \$3,195\.00$/);
  });

  it('leaves small orders unchanged', () => {
    const app = createTestApp();
    placeOrder(app, { price: 4000, address: US_ADDRESS });
    assert.match(app.mailer.sent[0].body, /Total: \$42\.60$/);
  });
});
