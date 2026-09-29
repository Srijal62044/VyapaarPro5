import { StoreOrder } from '../../../src/types';

// In-memory global fallback cache for orders to guarantee zero checkout interruption
const globalOrderCache = new Map<string, any>();

export function cacheOrder(order: any): void {
  if (order?.id) {
    globalOrderCache.set(order.id, order);
  }
  if (order?.order_number) {
    globalOrderCache.set(order.order_number, order);
  }
}

export function getCachedOrder(orderIdOrNumber: string): any | null {
  return globalOrderCache.get(orderIdOrNumber) || null;
}
