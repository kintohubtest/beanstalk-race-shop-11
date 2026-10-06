import { enqueueNotification } from '../notifications/queue.ts';
import { badRequest, conflict } from '../lib/errors.ts';
import { sumCents } from '../lib/money.ts';
import type { AppContext, Order, Shipment, ShippingMethod, ShippingQuote } from '../types.ts';
import { quoteShipping } from './rates.ts';

/** Standard shipping is free once the goods in an order come to this many cents. */
export const FREE_SHIPPING_THRESHOLD = 7500;

/** Weight of an order's lines, from current catalog data. */
export function orderWeight(ctx: AppContext, order: Pick<Order, 'lines'>): number {
  return order.lines.reduce((kg, line) => {
    const product = ctx.store.products.get(line.productId);
    return kg + (product?.weightKg ?? 0.5) * line.quantity;
  }, 0);
}

export function quoteForOrder(
  ctx: AppContext,
  order: Pick<Order, 'lines' | 'shippingAddress'>,
  method: ShippingMethod = 'standard',
): ShippingQuote {
  const quote = quoteShipping(order.shippingAddress, orderWeight(ctx, order), method, ctx.config.defaultCountry);
  const goods = sumCents(order.lines.map((line) => line.unitPrice * line.quantity));
  return method === 'standard' && goods >= FREE_SHIPPING_THRESHOLD ? { ...quote, cost: 0 } : quote;
}

export function getShipment(ctx: AppContext, orderId: string): Shipment | undefined {
  return ctx.store.shipments.findOne((s) => s.orderId === orderId);
}

/** Record the shipment for an order and mark the order as shipped. */
export function markShipped(ctx: AppContext, orderId: string, trackingNumber: string, method: ShippingMethod = 'standard'): Order {
  const order = ctx.store.orders.require(orderId);
  if (order.status !== 'confirmed') throw conflict(`order ${order.number} is ${order.status}, not confirmed`);
  if (!trackingNumber) throw badRequest('tracking number is required');
  const now = ctx.clock.now().toISOString();
  ctx.store.shipments.insert({
    id: ctx.store.nextId('shp'),
    orderId,
    method,
    cost: order.shippingCost,
    status: 'shipped',
    signatureRequired: order.total >= ctx.config.signatureThreshold,
    shippedAt: now,
  });
  const updated = ctx.store.orders.update(orderId, { status: 'shipped', trackingNumber, updatedAt: now });
  enqueueNotification(ctx, 'order_shipped', updated);
  return updated;
}
