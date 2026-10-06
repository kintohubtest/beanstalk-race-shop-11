import { badRequest, conflict } from '../lib/errors.ts';
import type { AppContext, CartLine, StockLevel } from '../types.ts';

export function getStock(ctx: AppContext, productId: string): StockLevel {
  return ctx.store.stock.get(productId) ?? { id: productId, onHand: 0, reserved: 0 };
}

export function availableQuantity(level: StockLevel): number {
  return level.onHand - level.reserved;
}

/** Fail with a 409 unless `quantity` units of the product could be reserved right now. */
export function assertAvailable(ctx: AppContext, productId: string, quantity: number): void {
  const available = availableQuantity(getStock(ctx, productId));
  if (quantity > available) throw conflict(`only ${Math.max(available, 0)} left in stock`);
}

export function setStock(ctx: AppContext, productId: string, onHand: number): StockLevel {
  if (!Number.isInteger(onHand) || onHand < 0) throw badRequest('onHand must be a non-negative integer');
  const existing = ctx.store.stock.get(productId);
  if (existing) return ctx.store.stock.update(productId, { onHand });
  return ctx.store.stock.insert({ id: productId, onHand, reserved: 0 });
}

/** Hold stock for an order. Fails with 409 if any line cannot be covered. */
export function reserve(ctx: AppContext, lines: CartLine[]): void {
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw badRequest('quantity must be a positive whole number');
    }
    const level = getStock(ctx, line.productId);
    if (availableQuantity(level) < line.quantity) {
      throw conflict(`not enough stock for ${line.productId}`);
    }
    setReserved(ctx, level, level.reserved + line.quantity);
  }
}

/** Give held stock back, e.g. when an order is cancelled. */
export function release(ctx: AppContext, lines: CartLine[]): void {
  for (const line of lines) {
    const level = getStock(ctx, line.productId);
    setReserved(ctx, level, Math.max(level.reserved - line.quantity, 0));
  }
}

/** Products whose available quantity is at or below the configured threshold. */
export function lowStock(ctx: AppContext): StockLevel[] {
  return ctx.store.stock
    .find((level) => availableQuantity(level) <= ctx.config.lowStockThreshold)
    .sort((a, b) => availableQuantity(a) - availableQuantity(b));
}

function setReserved(ctx: AppContext, level: StockLevel, reserved: number): void {
  if (ctx.store.stock.get(level.id)) ctx.store.stock.update(level.id, { reserved });
  else ctx.store.stock.insert({ ...level, reserved });
}
