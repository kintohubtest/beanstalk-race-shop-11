import { formatMoney } from '../lib/money.ts';
import type { Invoice } from '../types.ts';

/** A plain-text invoice, suitable for email bodies and printing. */
export function renderInvoiceText(invoice: Invoice): string {
  const money = (cents: number) => formatMoney(cents, invoice.currency);
  const lines = [`Invoice ${invoice.number}`];
  for (const line of invoice.lines) {
    lines.push(`${line.quantity} x ${line.description} - ${money(line.net)}`);
  }
  lines.push(`Subtotal: ${money(invoice.subtotal)}`);
  if (invoice.discount > 0) lines.push(`Discount: -${money(invoice.discount)}`);
  lines.push(`Tax: ${money(invoice.tax)}`, `Total: ${money(invoice.total)}`);
  return lines.join('\n');
}
