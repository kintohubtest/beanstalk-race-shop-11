import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { paginate } from './pagination.ts';

const items = Array.from({ length: 150 }, (_, i) => i);

describe('paginate', () => {
  it('returns the first page by default, with the total', () => {
    const page = paginate(items, {});
    assert.equal(page.items.length, 20);
    assert.equal(page.items[0], 0);
    assert.equal(page.total, 150);
  });

  it('honours limit and offset and still reports the full total', () => {
    const page = paginate(items, { limit: '3', offset: '10' });
    assert.deepEqual(page.items, [10, 11, 12]);
    assert.equal(page.total, 150);
  });

  it('clamps the limit and ignores garbage', () => {
    assert.equal(paginate(items, { limit: '1000' }).items.length, 100);
    assert.equal(paginate(items, { limit: 'abc', offset: '-4' }).items.length, 20);
    assert.deepEqual(paginate([], {}), { items: [], total: 0 });
  });
});
