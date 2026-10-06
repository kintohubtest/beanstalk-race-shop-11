import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp, signUp } from '../lib/testing.ts';
import { getProduct, updateProduct } from './service.ts';

describe('retired products', () => {
  it('answer 404 on the public endpoint', () => {
    const app = createTestApp();
    const product = addProduct(app.ctx);
    assert.equal(app.call('GET', `/products/${product.id}`).status, 200);
    updateProduct(app.ctx, product.id, { active: false });
    const res = app.call('GET', `/products/${product.id}`);
    assert.equal(res.status, 404);
  });

  it('can be brought back by an admin', () => {
    const app = createTestApp();
    const admin = signUp(app.ctx, 'admin@example.com', { admin: true });
    const product = addProduct(app.ctx);
    app.call('PATCH', `/products/${product.id}`, { token: admin.token, body: { active: false } });
    assert.equal(app.call('GET', `/products/${product.id}`).status, 404);
    app.call('PATCH', `/products/${product.id}`, { token: admin.token, body: { active: true } });
    assert.equal(app.call('GET', `/products/${product.id}`).status, 200);
  });

  it('are still readable through the service layer', () => {
    const app = createTestApp();
    const product = addProduct(app.ctx);
    updateProduct(app.ctx, product.id, { active: false });
    assert.equal(getProduct(app.ctx, product.id).active, false);
  });
});
