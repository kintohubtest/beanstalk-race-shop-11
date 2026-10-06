import { applyRateToTotal, sumCents } from '../lib/money.ts';
import type { Address, AppContext, Cents, Coupon, Invoice, InvoiceLine, TaxClass } from '../types.ts';
import { allocateDiscount, couponDiscount, validateCoupon } from './discounts.ts';
import { taxComponentsFor, taxRateFor } from './tax.ts';

export interface InvoiceItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: Cents;
  taxClass: TaxClass;
}

export interface InvoiceInput {
  orderId: string;
  userId: string;
  address: Address;
  items: InvoiceItem[];
  coupon?: Coupon;
}

export type InvoiceDraft = Omit<Invoice, 'id' | 'number'>;

const DAY_MS = 24 * 60 * 60 * 1000;

/** One invoice line: what the item costs, its share of the discount, and the tax on what is left. */
export function buildInvoiceLine(ctx: AppContext, address: Address, item: InvoiceItem, discount: Cents): InvoiceLine {
  const net = item.quantity * item.unitPrice;
  const taxRate = taxRateFor(address, item.taxClass, ctx.config.fallbackTaxRate);
  return {
    productId: item.productId,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    net,
    discount,
    taxRate,
    tax: applyRate(net - discount, taxRate),
  };
/** Tax per line, rounded once for each distinct rate over the lines that share it. */
function taxByRate(taxable: Cents[], rates: number[]): Cents[] {
  const taxes = taxable.map(() => 0);
  for (const rate of new Set(rates)) {
    const indexes = rates.flatMap((r, i) => (r === rate ? [i] : []));
    const shares = applyRateToTotal(indexes.map((i) => taxable[i]), rate);
    indexes.forEach((lineIndex, k) => {
      taxes[lineIndex] = shares[k];
    });
  }
  return taxes;
}

/** Price an order: line nets, the coupon, tax per line, and the due date. Pure apart from the clock. */
export function buildInvoice(ctx: AppContext, input: InvoiceInput): InvoiceDraft {
  const nets = input.items.map((item) => item.quantity * item.unitPrice);
  const subtotal = sumCents(nets);
  const coupon = input.coupon ? validateCoupon(input.coupon, subtotal, ctx.config.currency) : undefined;
  const discount = coupon ? couponDiscount(coupon, subtotal) : 0;
  const lineDiscounts = allocateDiscount(nets, discount);

  const lines = input.items.map((item, i) => buildInvoiceLine(ctx, input.address, item, lineDiscounts[i]));
  const rates = input.items.map((item) => taxRateFor(input.address, item.taxClass, ctx.config.fallbackTaxRate));
  const lineTaxes = taxByRate(nets.map((net, i) => net - lineDiscounts[i]), rates);
  const lines: InvoiceLine[] = input.items.map((item, i) => ({
    productId: item.productId,
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    net: nets[i],
    discount: lineDiscounts[i],
    taxRate: rates[i],
    tax: lineTaxes[i],
  }));

  const tax = sumCents(lines.map((line) => line.tax));
  const federal = sumCents(
    input.items.map((item, i) => {
      const { federal: rate } = taxComponentsFor(input.address, item.taxClass, ctx.config.fallbackTaxRate);
      return applyRate(nets[i] - lineDiscounts[i], rate);
    }),
  );
  const issuedAt = ctx.clock.now();
  return {
    orderId: input.orderId,
    userId: input.userId,
    currency: ctx.config.currency,
    lines,
    subtotal,
    discount,
    couponCode: coupon?.id ?? null,
    tax,
    taxBreakdown: { federal, regional: tax - federal },
    total: subtotal - discount + tax,
    status: 'open',
    issuedAt: issuedAt.toISOString(),
    dueAt: new Date(issuedAt.getTime() + ctx.config.paymentTermsDays * DAY_MS).toISOString(),
    paidAt: null,
  };
}
