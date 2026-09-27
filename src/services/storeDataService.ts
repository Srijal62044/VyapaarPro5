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

// Storage keys for offline / preview mode fallback (Contains ZERO fake records by default)
const STORE_STORAGE_KEYS = {
  CATEGORIES: 'vp_store_categories_v1',
  PRODUCTS: 'vp_store_products_v1',
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
  // ============================================================================
  // 1. CATEGORIES
  // ============================================================================
  async getCategories(onlyActive = true): Promise<StoreCategory[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('store_categories')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true });

        if (onlyActive) {
          query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data as StoreCategory[];
        }
      } catch (err) {
        console.warn('Supabase getCategories error:', err);
      }
    }

    // Local Storage Fallback (starts empty)
    const raw = safeStoreGet(STORE_STORAGE_KEYS.CATEGORIES);
    const list: StoreCategory[] = raw ? JSON.parse(raw) : [];
    return onlyActive ? list.filter((c) => c.is_active) : list;
  },

  async getCategoryById(id: string): Promise<StoreCategory | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_categories')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) return data as StoreCategory;
      } catch (err) {
        console.warn('Supabase getCategoryById error:', err);
      }
    }

    const categories = await this.getCategories(false);
    return categories.find((c) => c.id === id) || null;
  },

  async createCategory(category: Omit<StoreCategory, 'id' | 'created_at' | 'updated_at'>): Promise<StoreCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('store_categories')
        .insert({
          name: category.name.trim(),
          slug: category.slug.toLowerCase().trim(),
          description: category.description?.trim() || null,
          is_active: category.is_active,
          sort_order: category.sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as StoreCategory;
    }

    // Local Storage Fallback
    const categories = await this.getCategories(false);
    const newCategory: StoreCategory = {
      id: `sc-${Date.now()}`,
      ...category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    categories.push(newCategory);
    safeStoreSet(STORE_STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return newCategory;
  },

  async updateCategory(id: string, updates: Partial<StoreCategory>): Promise<StoreCategory> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('store_categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as StoreCategory;
    }

    const categories = await this.getCategories(false);
    const idx = categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Category not found');

    const updated = {
      ...categories[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    categories[idx] = updated;
    safeStoreSet(STORE_STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return updated;
  },

  async deleteCategory(id: string): Promise<void> {
    // Check if products exist in category
    const products = await this.getProducts({ categoryId: id });
    if (products.length > 0) {
      throw new Error(`Cannot delete category with ${products.length} assigned product(s). Reassign or archive the products first.`);
    }

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('store_categories').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const categories = await this.getCategories(false);
    const filtered = categories.filter((c) => c.id !== id);
    safeStoreSet(STORE_STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
  },

  // ============================================================================
  // 2. PRODUCTS
  // ============================================================================
  async getProducts(params?: {
    categoryId?: string;
    status?: StoreProductStatus;
    featured?: boolean;
    search?: string;
    includeAllStatuses?: boolean;
  }): Promise<StoreProduct[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('store_products')
          .select('*, store_categories(name)')
          .order('created_at', { ascending: false });

        if (!params?.includeAllStatuses) {
          query = query.eq('status', params?.status || 'PUBLISHED');
        } else if (params?.status) {
          query = query.eq('status', params.status);
        }

        if (params?.categoryId && params.categoryId !== 'all') {
          query = query.eq('category_id', params.categoryId);
        }

        if (params?.featured !== undefined) {
          query = query.eq('featured', params.featured);
        }

        if (params?.search && params.search.trim()) {
          const s = `%${params.search.trim()}%`;
          query = query.or(`name.ilike.${s},short_description.ilike.${s},description.ilike.${s}`);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((item: any) => ({
            ...item,
            category_name: item.store_categories?.name || undefined,
            thumbnail_url: item.thumbnail_path
              ? item.thumbnail_path.startsWith('http')
                ? item.thumbnail_path
                : supabase?.storage.from('store-thumbnails').getPublicUrl(item.thumbnail_path).data.publicUrl
              : null,
          })) as StoreProduct[];
        }
      } catch (err) {
        console.warn('Supabase getProducts error:', err);
      }
    }

    // Local Storage Fallback
    const raw = safeStoreGet(STORE_STORAGE_KEYS.PRODUCTS);
    let list: StoreProduct[] = raw ? JSON.parse(raw) : [];

    if (!params?.includeAllStatuses) {
      list = list.filter((p) => p.status === (params?.status || 'PUBLISHED'));
    } else if (params?.status) {
      list = list.filter((p) => p.status === params.status);
    }

    if (params?.categoryId && params.categoryId !== 'all') {
      list = list.filter((p) => p.category_id === params.categoryId);
    }

    if (params?.featured !== undefined) {
      list = list.filter((p) => p.featured === params.featured);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getProductBySlug(slug: string): Promise<StoreProduct | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_products')
          .select('*, store_categories(name)')
          .eq('slug', slug)
          .single();

        if (!error && data) {
          return {
            ...data,
            category_name: data.store_categories?.name || undefined,
            thumbnail_url: data.thumbnail_path
              ? data.thumbnail_path.startsWith('http')
                ? data.thumbnail_path
                : supabase?.storage.from('store-thumbnails').getPublicUrl(data.thumbnail_path).data.publicUrl
              : null,
          } as StoreProduct;
        }
      } catch (err) {
        console.warn('Supabase getProductBySlug error:', err);
      }
    }

    const products = await this.getProducts({ includeAllStatuses: true });
    return products.find((p) => p.slug === slug) || null;
  },

  async getProductById(id: string): Promise<StoreProduct | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_products')
          .select('*, store_categories(name)')
          .eq('id', id)
          .single();

        if (!error && data) {
          return {
            ...data,
            category_name: data.store_categories?.name || undefined,
            thumbnail_url: data.thumbnail_path
              ? data.thumbnail_path.startsWith('http')
                ? data.thumbnail_path
                : supabase?.storage.from('store-thumbnails').getPublicUrl(data.thumbnail_path).data.publicUrl
              : null,
          } as StoreProduct;
        }
      } catch (err) {
        console.warn('Supabase getProductById error:', err);
      }
    }

    const products = await this.getProducts({ includeAllStatuses: true });
    return products.find((p) => p.id === id) || null;
  },

  async createProduct(productData: Omit<StoreProduct, 'id' | 'created_at' | 'updated_at'>): Promise<StoreProduct> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('store_products')
        .insert({
          category_id: productData.category_id || null,
          name: productData.name.trim(),
          slug: productData.slug.toLowerCase().trim(),
          short_description: productData.short_description.trim(),
          description: productData.description.trim(),
          price_paise: productData.price_paise,
          compare_at_price_paise: productData.compare_at_price_paise || null,
          thumbnail_path: productData.thumbnail_path || null,
          product_file_path: productData.product_file_path || null,
          file_name: productData.file_name || null,
          file_size_bytes: productData.file_size_bytes || null,
          mime_type: productData.mime_type || null,
          status: productData.status,
          featured: productData.featured || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as StoreProduct;
    }

    const products = await this.getProducts({ includeAllStatuses: true });
    const newProduct: StoreProduct = {
      id: `sp-${Date.now()}`,
      ...productData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    products.unshift(newProduct);
    safeStoreSet(STORE_STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<StoreProduct>): Promise<StoreProduct> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('store_products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as StoreProduct;
    }

    const products = await this.getProducts({ includeAllStatuses: true });
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const updated = {
      ...products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    products[idx] = updated;
    safeStoreSet(STORE_STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('store_products').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const products = await this.getProducts({ includeAllStatuses: true });
    const filtered = products.filter((p) => p.id !== id);
    safeStoreSet(STORE_STORAGE_KEYS.PRODUCTS, JSON.stringify(filtered));
  },

  // Upload Thumbnail to Public Bucket
  async uploadThumbnail(file: File): Promise<{ path: string; url: string }> {
    const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!ALLOWED_MIME.includes(file.type)) {
      throw new Error('Unsupported image format. Allowed: PNG, JPG, JPEG, WEBP, SVG.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Thumbnail image exceeds maximum size of 10MB.');
    }

    const ext = file.name.split('.').pop() || 'png';
    const filePath = `thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.storage.from('store-thumbnails').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;
      const { data: publicData } = supabase.storage.from('store-thumbnails').getPublicUrl(filePath);
      return { path: filePath, url: publicData.publicUrl };
    }

    // Local fallback: create object URL
    return { path: filePath, url: URL.createObjectURL(file) };
  },

  // Upload Digital Product File to Private Bucket
  async uploadProductFile(file: File): Promise<{
    path: string;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }> {
    const ALLOWED_MIME = [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
      'application/pdf',
      'application/json',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (file.size > 100 * 1024 * 1024) {
      throw new Error('Product file exceeds maximum allowed size of 100MB.');
    }

    const ext = file.name.split('.').pop() || 'bin';
    const cleanBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `digital-files/${Date.now()}-${cleanBaseName}`;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.storage.from('store-products-private').upload(storagePath, file, {
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });
      if (error) throw error;
    }

    return {
      path: storagePath,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
    };
  },

  // ============================================================================
  // 3. ORDERS & ORDER ITEMS
  // ============================================================================
  async getCustomerOrders(userId: string): Promise<StoreOrder[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_orders')
          .select('*, store_order_items(*), store_payments(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((o: any) => ({
            ...o,
            items: o.store_order_items || [],
            payments: o.store_payments || [],
          })) as StoreOrder[];
        }
      } catch (err) {
        console.warn('Supabase getCustomerOrders error:', err);
      }
    }

    const raw = safeStoreGet(STORE_STORAGE_KEYS.ORDERS);
    const orders: StoreOrder[] = raw ? JSON.parse(raw) : [];
    return orders.filter((o) => o.user_id === userId);
  },

  async getOrderById(id: string, userId?: string): Promise<StoreOrder | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('store_orders')
          .select('*, store_order_items(*), store_payments(*)')
          .eq('id', id);

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query.single();
        if (!error && data) {
          return {
            ...data,
            items: data.store_order_items || [],
            payments: data.store_payments || [],
          } as StoreOrder;
        }
      } catch (err) {
        console.warn('Supabase getOrderById error:', err);
      }
    }

    const raw = safeStoreGet(STORE_STORAGE_KEYS.ORDERS);
    const orders: StoreOrder[] = raw ? JSON.parse(raw) : [];
    const order = orders.find((o) => o.id === id || o.order_number === id);
    if (!order) return null;
    if (userId && order.user_id !== userId) return null;
    return order;
  },

  async getAdminOrders(params?: {
    status?: string;
    search?: string;
  }): Promise<StoreOrder[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('store_orders')
          .select('*, store_order_items(*), store_payments(*)')
          .order('created_at', { ascending: false });

        if (params?.status && params.status !== 'all') {
          query = query.eq('status', params.status);
        }

        if (params?.search && params.search.trim()) {
          const s = `%${params.search.trim()}%`;
          query = query.or(`order_number.ilike.${s},customer_email.ilike.${s},customer_name.ilike.${s}`);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((o: any) => ({
            ...o,
            items: o.store_order_items || [],
            payments: o.store_payments || [],
          })) as StoreOrder[];
        }
      } catch (err) {
        console.warn('Supabase getAdminOrders error:', err);
      }
    }

    const raw = safeStoreGet(STORE_STORAGE_KEYS.ORDERS);
    let orders: StoreOrder[] = raw ? JSON.parse(raw) : [];

    if (params?.status && params.status !== 'all') {
      orders = orders.filter((o) => o.status === params.status);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      orders = orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
          (o.customer_name && o.customer_name.toLowerCase().includes(q))
      );
    }

    return orders;
  },

  // ============================================================================
  // 4. DOWNLOADS
  // ============================================================================
  async getCustomerDownloads(userId: string): Promise<StoreDownload[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_downloads')
          .select('*, store_products(*), store_orders(*)')
          .eq('user_id', userId)
          .is('revoked_at', null)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((d: any) => ({
            ...d,
            product_name: d.store_products?.name || 'Digital Product',
            file_name: d.store_products?.file_name || null,
            file_size_bytes: d.store_products?.file_size_bytes || null,
            product: d.store_products || undefined,
            order: d.store_orders || undefined,
          })) as StoreDownload[];
        }
      } catch (err) {
        console.warn('Supabase getCustomerDownloads error:', err);
      }
    }

    const raw = safeStoreGet(STORE_STORAGE_KEYS.DOWNLOADS);
    const list: StoreDownload[] = raw ? JSON.parse(raw) : [];
    return list.filter((d) => d.user_id === userId && !d.revoked_at);
  },

  // ============================================================================
  // 5. DASHBOARD STATS
  // ============================================================================
  async getStoreDashboardStats(): Promise<StoreDashboardStats> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_store_dashboard_stats');
        if (!error && data) {
          return data as StoreDashboardStats;
        }
      } catch (err) {
        console.warn('Supabase getStoreDashboardStats RPC notice:', err);
      }
    }

    // Direct computation fallback
    const products = await this.getProducts({ includeAllStatuses: true });
    const orders = await this.getAdminOrders();

    return {
      total_products: products.filter((p) => p.status !== 'ARCHIVED').length,
      published_products: products.filter((p) => p.status === 'PUBLISHED').length,
      draft_products: products.filter((p) => p.status === 'DRAFT').length,
      total_orders: orders.length,
      paid_orders: orders.filter((o) => o.status === 'PAID').length,
      pending_payments: orders.filter((o) => o.status === 'PAYMENT_PENDING' || o.status === 'CREATED').length,
      total_revenue_paise: orders
        .filter((o) => o.status === 'PAID')
        .reduce((sum, o) => sum + (o.total_paise || 0), 0),
    };
  },
};
