import { badRequest } from '../lib/errors.ts';
import { formatMoney, percentOf, sumCents } from '../lib/money.ts';
import type { Cents, Coupon, Currency } from '../types.ts';

/** Check that `coupon` may be used on a cart worth `subtotal`. Returns the coupon for chaining. */
export function validateCoupon(coupon: Coupon, subtotal: Cents, currency: Currency): Coupon {
  if (subtotal < coupon.minSubtotal) {
    throw badRequest(`coupon ${coupon.id} needs a subtotal of at least ${formatMoney(coupon.minSubtotal, currency)}`);
  }
  return coupon;
}

/** How much `coupon` takes off a cart worth `subtotal`. */
export function couponDiscount(coupon: Coupon, subtotal: Cents): Cents {
  if (coupon.kind === 'fixed') return coupon.value;
  const discount = percentOf(subtotal, coupon.value);
  return coupon.maxDiscount == null ? discount : Math.min(discount, coupon.maxDiscount);
}

/** Spread a cart-level discount over the lines in proportion to their value. */
export function allocateDiscount(nets: Cents[], discount: Cents): Cents[] {
  const subtotal = sumCents(nets);
  if (subtotal === 0) return nets.map(() => 0);
  return nets.map((net) => Math.floor((discount * net) / subtotal));
}
