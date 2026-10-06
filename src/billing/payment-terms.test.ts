import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultConfig, loadConfig } from '../config.ts';
import { createTestApp, ON_ADDRESS } from '../lib/testing.ts';
import { buildInvoice } from './invoice.ts';

const item = { productId: 'p', description: 'x', quantity: 1, unitPrice: 1000, taxClass: 'standard' as const };

describe('payment terms', () => {
  it('defaults to 30 days and can be overridden from the environment', () => {
    assert.equal(defaultConfig.paymentTermsDays, 30);
    assert.equal(loadConfig({}).paymentTermsDays, 30);
    assert.equal(loadConfig({ PAYMENT_TERMS_DAYS: '14' }).paymentTermsDays, 14);
    assert.throws(() => loadConfig({ PAYMENT_TERMS_DAYS: 'soon' }), /invalid integer/);
  });

  it('sets the due date from the configured terms', () => {
    const app = createTestApp();
    const issue = () => buildInvoice(app.ctx, { orderId: 'o', userId: 'u', address: ON_ADDRESS, items: [item] });
    assert.equal(issue().dueAt, '2026-10-15T12:00:00.000Z');
    app.ctx.config.paymentTermsDays = 14;
    assert.equal(issue().dueAt, '2026-09-29T12:00:00.000Z');
  });
});
