import { formatMoney } from '../lib/money.ts';
import type { Currency, NotificationKind, Order } from '../types.ts';

export interface Rendered {
  subject: string;
  body: string;
}

type Template = (order: Order, currency: Currency) => Rendered;

/** One render function per notification kind. A new kind is a new entry here. */
export const templates: Record<NotificationKind, Template> = {
  order_confirmed(order, currency) {
    const lines = order.lines.map(
      (line) => `${line.quantity} x ${line.name} - ${formatMoney(line.unitPrice * line.quantity, currency)}`,
    );
    return {
      subject: `Order ${order.number} confirmed`,
      body: ['Thanks for your order!', ...lines, `Total: ${formatMoney(order.total, currency)}`].join('\n'),
    };
  },
  order_shipped(order) {
    return {
      subject: `Order ${order.number} has shipped`,
      body: `Your order ${order.number} is on its way.`,
    };
  },
  order_cancelled(order) {
    return {
      subject: `Order ${order.number} was cancelled`,
      body: `Your order ${order.number} was cancelled. Any payment will be refunded.`,
    };
  },
};

export function renderNotification(kind: NotificationKind, order: Order, currency: Currency): Rendered {
  switch (kind) {
    case 'order_confirmed': {
      const lines = order.lines.map(
        (line) => `${line.quantity} x ${line.name} - ${formatMoney(line.unitPrice * line.quantity, currency)}`,
      );
      return {
        subject: `Order ${order.number} confirmed`,
        body: ['Thanks for your order!', ...lines, `Total: ${formatMoney(order.total, currency)}`].join('\n'),
      };
    }
    case 'order_shipped':
      return {
        subject: `Order ${order.number} has shipped`,
        body: `Your order ${order.number} is on its way.\nTracking number: ${order.trackingNumber}`,
      };
    case 'order_cancelled':
      return {
        subject: `Order ${order.number} was cancelled`,
        body: `Your order ${order.number} was cancelled. Any payment will be refunded.`,
      };
    case 'payment_received':
      return {
        subject: `Payment received for order ${order.number}`,
        body: `We have received your payment for order ${order.number}. Thank you!`,
      };
  }
  return templates[kind](order, currency);
}
