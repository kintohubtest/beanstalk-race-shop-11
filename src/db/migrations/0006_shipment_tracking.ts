import type { Migration } from '../migrate.ts';

export const migration0006: Migration = {
  version: 6,
  name: 'shipment_tracking',
  up(store) {
    store.shipments.addColumn('trackingNumber', null);
    for (const shipment of store.shipments.all()) {
      const order = store.orders.get(shipment.orderId) as { trackingNumber?: string | null } | undefined;
      store.shipments.update(shipment.id, { trackingNumber: order?.trackingNumber ?? null });
    }
    store.orders.dropColumn('trackingNumber');
  },
};
