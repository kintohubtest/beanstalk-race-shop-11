import { badRequest, notFound } from '../lib/errors.ts';
import { paginate } from '../lib/pagination.ts';
import { ok } from '../router.ts';
import type { Handler } from '../router.ts';
import type { Invoice, InvoiceStatus, User } from '../types.ts';
import {
  getInvoice as loadInvoice,
  invoiceForOrder as loadInvoiceForOrder,
  listInvoices,
  markPaid,
} from './service.ts';

/** Customers only see their own invoices; admins see all. Anything else looks like a 404. */
function visibleTo(user: User, invoice: Invoice): Invoice {
  if (invoice.userId !== user.id && user.role !== 'admin') throw notFound('invoice');
  return invoice;
}

export const getInvoice: Handler = (req, ctx) => ok(visibleTo(req.user!, loadInvoice(ctx, req.params.id)));

export const invoiceForOrder: Handler = (req, ctx) =>
  ok(visibleTo(req.user!, loadInvoiceForOrder(ctx, req.params.id)));

export const payInvoice: Handler = (req, ctx) => ok(markPaid(ctx, req.params.id));

const STATUSES = ['open', 'paid', 'void'];

export const list: Handler = (req, ctx) => {
  const status = req.query.status;
  if (status !== undefined && !STATUSES.includes(status)) throw badRequest('status must be open, paid or void');
  const invoices = listInvoices(ctx, req.user!.id, status as InvoiceStatus | undefined);
  return ok(paginate(invoices, req.query, ctx.config.pageSize));
};
