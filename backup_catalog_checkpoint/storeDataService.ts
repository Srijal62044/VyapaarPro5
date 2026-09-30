// Backup of storeDataService.ts before category separation
import {
  StoreCategory,
  StoreProduct,
  StoreOrder,
  StoreOrderItem,
  StorePayment,
  StoreDownload,
  StoreDashboardStats,
  StoreProductStatus,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { generateReferenceCode } from './store';
import { INITIAL_STORE_CATEGORIES, INITIAL_STORE_PRODUCTS } from './storeSeedData';
import { calculateServicePrice } from './socialServiceFields';

// Storage keys for offline / preview mode fallback (Contains ZERO fake records by default)
const STORE_STORAGE_KEYS = {
  CATEGORIES: 'vp_store_categories_v2',
  PRODUCTS: 'vp_store_products_v2',
  ORDERS: 'vp_store_orders_v1',
  ORDER_ITEMS: 'vp_store_order_items_v1',
  PAYMENTS: 'vp_store_payments_v1',
  DOWNLOADS: 'vp_store_downloads_v1',
};

const memoryStore = new Map<string, string>();

function safeStoreGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    // Fallback for restricted WebViews
  }
  return memoryStore.get(key) || null;
}

function safeStoreSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (e) {
    // Fallback
  }
  memoryStore.set(key, value);
}

// Generate human-readable order number: e.g. VP-ORD-7A9B2C4D
export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VP-ORD-${random}`;
}

export const storeDataService = {
  async getCategories(onlyActive = true): Promise<StoreCategory[]> {
    let list: StoreCategory[] = [];
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('store_categories')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });
        if (onlyActive) query = query.eq('is_active', true);
        const { data, error } = await query;
        if (!error && data) list = data as StoreCategory[];
      } catch (err) {
        console.warn('Supabase getCategories error:', err);
      }
    }
    const raw = safeStoreGet(STORE_STORAGE_KEYS.CATEGORIES);
    const localList: StoreCategory[] = raw ? JSON.parse(raw) : [];
    const now = new Date().toISOString();
    const missingToSeed: Array<Omit<StoreCategory, 'created_at' | 'updated_at'>> = [];
    for (const initCat of INITIAL_STORE_CATEGORIES) {
      const existsInList = list.some((c) => c.slug === initCat.slug || c.id === initCat.id);
      if (!existsInList) {
        const localMatch = localList.find((c) => c.slug === initCat.slug || c.id === initCat.id);
        const catToAdd: StoreCategory = localMatch || { ...initCat, created_at: now, updated_at: now };
        list.push(catToAdd);
        missingToSeed.push(initCat);
      }
    }
    safeStoreSet(STORE_STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
    return onlyActive ? list.filter((c) => c.is_active) : list;
  },
  async getProducts(params?: any): Promise<StoreProduct[]> {
    return [];
  }
};
