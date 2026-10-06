import { badRequest } from '../lib/errors.ts';
import { paginate } from '../lib/pagination.ts';
import { asBody, optionalString, requireInt } from '../lib/validate.ts';
import { created, json, ok } from '../router.ts';
import type { Handler } from '../router.ts';
import type { ShippingMethod } from '../types.ts';
import { checkout as placeOrder } from './checkout.ts';
import { cancelOrder, getVisibleOrder, listOrders } from './service.ts';

export const checkout: Handler = (req, ctx) => {
  const body = asBody(req.body);
  const method = optionalString(body, 'method');
  if (method !== undefined && method !== 'standard' && method !== 'express') {
    throw badRequest('method must be standard or express');
  }
  const order = placeOrder(ctx, req.user!, {
    addressIndex: requireInt(body, 'addressIndex'),
    couponCode: optionalString(body, 'couponCode'),
    note: optionalString(body, 'note'),
    method: method as ShippingMethod | undefined,
  });
  return created(order);
};

export const list: Handler = (req, ctx) => {
  const page = paginate(listOrders(ctx, req.user!.id), req.query, ctx.config.pageSize);
  return json(200, page.items, { 'x-total-count': String(page.total) });
};

export const get: Handler = (req, ctx) => ok(getVisibleOrder(ctx, req.user!, req.params.id));

export const cancel: Handler = (req, ctx) => ok(cancelOrder(ctx, req.user!, req.params.id));
