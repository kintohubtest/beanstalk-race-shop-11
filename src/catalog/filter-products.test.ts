import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addProduct, createTestApp } from '../lib/testing.ts';
import type { Product } from '../types.ts';
import { filterProducts, listProducts } from './service.ts';

const product = (id: string, overrides: Partial<Product> = {}): Product => ({
  id, sku: `SKU-${id}`, name: `Item ${id}`, description: '', price: 1000, category: 'general',
  taxClass: 'standard', weightKg: 0.5, active: true, createdAt: '2026-09-01T00:00:00.000Z', ...overrides,
});

describe('filterProducts', () => {
  const items = [
    product('c', { category: 'tea', name: 'Green tea' }),
    product('a', { category: 'coffee', name: 'Dark roast', description: 'Strong coffee' }),
    product('b', { category: 'coffee', name: 'Decaf', active: false }),
  ];

  it('hides retired products unless asked', () => {
    assert.deepEqual(filterProducts(items).map((p) => p.id), ['c', 'a']);
    assert.deepEqual(filterProducts(items, { includeInactive: true }).map((p) => p.id), ['c', 'a', 'b']);
  });

  it('filters by category and by search words, keeping the input order', () => {
    assert.deepEqual(filterProducts(items, { category: 'coffee' }).map((p) => p.id), ['a']);
    assert.deepEqual(filterProducts(items, { q: 'STRONG coffee' }).map((p) => p.id), ['a']);
    assert.deepEqual(filterProducts(items, { category: 'tea', q: 'roast' }), []);
  });

  it('does not modify its input', () => {
    const copy = structuredClone(items);
    filterProducts(items, { category: 'tea' });
    assert.deepEqual(items, copy);
  });
});

describe('listProducts', () => {
  it('still sorts by name', () => {
    const app = createTestApp();
    addProduct(app.ctx, { name: 'Zinc' });
    addProduct(app.ctx, { name: 'Alloy' });
    assert.deepEqual(listProducts(app.ctx).map((p) => p.name), ['Alloy', 'Zinc']);
  });
});
