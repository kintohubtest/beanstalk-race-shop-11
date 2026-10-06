import { sumCents } from '../lib/money.ts';
import type { Cents } from '../types.ts';

export { couponDiscount, validateCoupon } from './coupons.ts';

/** Spread a cart-level discount over the lines in proportion to their value. */
export function allocateDiscount(nets: Cents[], discount: Cents): Cents[] {
  const subtotal = sumCents(nets);
  if (subtotal === 0) return nets.map(() => 0);
  return nets.map((net) => Math.floor((discount * net) / subtotal));
}
