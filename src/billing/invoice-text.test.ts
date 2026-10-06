import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createTestApp, placeOrder, signUp, US_ADDRESS } from '../lib/testing.ts';

describe('plain-text invoices', () => {
  it('renders items, subtotal, tax and total', () => {
    const app = createTestApp();
    const { order, token, product } = placeOrder(app, { price: 100000, address: US_ADDRESS });
    const invoice = app.ctx.store.invoices.require(order.invoiceId!);
    const res = app.call('GET', `/invoices/${invoice.id}/text`, { token });
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'], 'text/plain; charset=utf-8');
    assert.equal(
      res.body,
      [`Invoice ${invoice.number}`, `1 x ${product.name} - $1000.00`, 'Subtotal: $1000.00', 'Tax: $65.00', 'Total: $1065.00'].join('\n'),
    );
  });

  it('shows the discount as a negative amount', () => {
    const app = createTestApp();
    const { order, token } = placeOrder(app, { price: 5000, address: US_ADDRESS, couponCode: 'WELCOME10' });
    const text = app.call('GET', `/invoices/${order.invoiceId}/text`, { token }).body as string;
    assert.match(text, /^Discount: -\$5\.00$/m);
    assert.match(text, /^Total: \$47\.93$/m);
  });

  it('is only visible to the owner and admins', () => {
    const app = createTestApp();
    const { order, token } = placeOrder(app);
    const stranger = signUp(app.ctx, 'stranger@example.com');
    const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
    const path = `/invoices/${order.invoiceId}/text`;
    assert.equal(app.call('GET', path).status, 401);
    assert.equal(app.call('GET', path, { token: stranger.token }).status, 404);
    assert.equal(app.call('GET', path, { token: admin.token }).status, 200);
    assert.equal(app.call('GET', path, { token }).status, 200);
  });
});
