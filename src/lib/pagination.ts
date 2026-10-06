const MAX_LIMIT = 100;

export interface Page<T> {
  items: T[];
  /** How many items there were before paging. */
  total: number;
}

/**
 * Slice `items` according to `?limit=` and `?offset=`. Bad values fall back to the
 * defaults rather than failing the request.
 */
export function paginate<T>(items: T[], query: Record<string, string>, defaultLimit = 20): Page<T> {
  const requested = Number.parseInt(query.limit ?? '', 10);
  const limit = Number.isNaN(requested) ? defaultLimit : Math.min(Math.max(requested, 1), MAX_LIMIT);
  const offset = Math.max(Number.parseInt(query.offset ?? '', 10) || 0, 0);
  return { items: items.slice(offset, offset + limit), total: items.length };
}
