import { conflict, notFound } from '../lib/errors.ts';
import type { AppContext, Cents, InvoiceLine, Refund } from '../types.ts';
import { getInvoice } from './service.ts';

/** What a customer gets back for one line: its net, less its share of the discount, plus its tax. */
export function lineRefundAmount(line: InvoiceLine): Cents {
  return line.net - line.discount + line.tax;
}

/** Refund the whole line for `productId` on a paid invoice. */
export function refundLine(ctx: AppContext, invoiceId: string, productId: string): Refund {
  const invoice = getInvoice(ctx, invoiceId);
  if (invoice.status !== 'paid') {
    throw conflict(`invoice ${invoice.number} is ${invoice.status} and cannot be refunded`);
  }
  const line = invoice.lines.find((l) => l.productId === productId);
  if (!line) throw notFound('invoice line');
  const refunds = invoice.refunds ?? [];
  if (refunds.some((r) => r.productId === productId)) throw conflict('that line has already been refunded');
  const refund: Refund = {
    productId,
    amount: lineRefundAmount(line),
    createdAt: ctx.clock.now().toISOString(),
  };
  ctx.store.invoices.update(invoiceId, { refunds: [...refunds, refund] });
  return refund;
}
