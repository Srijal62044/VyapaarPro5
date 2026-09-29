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
  // ============================================================================
  // 1. CATEGORIES
  // ============================================================================
  async getCategories(onlyActive = true): Promise<StoreCategory[]> {
    let list: StoreCategory[] = [];

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
          list = data as StoreCategory[];
        }
      } catch (err) {
        console.warn('Supabase getCategories error:', err);
      }
    }

    // Merge with Local Storage / Initial Seed Categories (ensure all platforms are available)
    const raw = safeStoreGet(STORE_STORAGE_KEYS.CATEGORIES);
    const localList: StoreCategory[] = raw ? JSON.parse(raw) : [];

    // Ensure all INITIAL_STORE_CATEGORIES are present in list
    const now = new Date().toISOString();
    const missingToSeed: Array<Omit<StoreCategory, 'created_at' | 'updated_at'>> = [];

    for (const initCat of INITIAL_STORE_CATEGORIES) {
      const existsInList = list.some((c) => c.slug === initCat.slug || c.id === initCat.id);
      if (!existsInList) {
        const localMatch = localList.find((c) => c.slug === initCat.slug || c.id === initCat.id);
        const catToAdd: StoreCategory = localMatch || {
          ...initCat,
          created_at: now,
          updated_at: now,
        };
        list.push(catToAdd);
        missingToSeed.push(initCat);
      }
    }

    // Save to local cache
    safeStoreSet(STORE_STORAGE_KEYS.CATEGORIES, JSON.stringify(list));

    // Asynchronously insert missing categories into Supabase if configured
    if (isSupabaseConfigured && supabase && missingToSeed.length > 0) {
      try {
        await supabase.from('store_categories').upsert(
          missingToSeed.map((c) => ({
            name: c.name,
            slug: c.slug,
            description: c.description,
            is_active: c.is_active,
            sort_order: c.sort_order,
          })),
          { onConflict: 'slug' }
        );
      } catch (e) {
        // Non-blocking
      }
    }

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
    return categories.find((c) => c.id === id || c.slug === id) || null;
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
    const idx = categories.findIndex((c) => c.id === id || c.slug === id);
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
    const filtered = categories.filter((c) => c.id !== id && c.slug !== id);
    safeStoreSet(STORE_STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
  },

  // ============================================================================
  // 2. PRODUCTS & SOCIAL MEDIA SERVICES
  // ============================================================================
  async getProducts(params?: {
    categoryId?: string;
    platform?: string;
    status?: StoreProductStatus;
    featured?: boolean;
    search?: string;
    includeAllStatuses?: boolean;
  }): Promise<StoreProduct[]> {
    let list: StoreProduct[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_products')
          .select('*, store_categories(name)')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data) {
          list = data.map((item: any) => ({
            ...item,
            category_name: item.store_categories?.name || undefined,
            thumbnail_url: item.thumbnail_url || (item.thumbnail_path
              ? item.thumbnail_path.startsWith('http')
                ? item.thumbnail_path
                : supabase?.storage.from('store-thumbnails').getPublicUrl(item.thumbnail_path).data.publicUrl
              : null),
          })) as StoreProduct[];
        }
      } catch (err) {
        console.warn('Supabase getProducts error:', err);
      }
    }

    // Merge with Local Storage / Seed Fallback to ensure all social media services exist
    const raw = safeStoreGet(STORE_STORAGE_KEYS.PRODUCTS);
    const localList: StoreProduct[] = raw ? JSON.parse(raw) : [];

    const now = new Date().toISOString();
    const missingToSeed: Array<Omit<StoreProduct, 'id' | 'created_at' | 'updated_at'>> = [];

    for (let i = 0; i < INITIAL_STORE_PRODUCTS.length; i++) {
      const initProd = INITIAL_STORE_PRODUCTS[i];
      const existingIdx = list.findIndex((p) => p.slug === initProd.slug);

      if (existingIdx === -1) {
        const localMatch = localList.find((p) => p.slug === initProd.slug);
        const prodToAdd: StoreProduct = localMatch || {
          id: `sp-${initProd.slug}-${i + 1}`,
          ...initProd,
          status: 'PUBLISHED',
          created_at: now,
          updated_at: now,
        };
        list.push(prodToAdd);
        missingToSeed.push(initProd);
      } else {
        // Hydrate missing properties on existing items (e.g. platform, min_quantity, ordering_fields, status)
        const current = list[existingIdx];
        list[existingIdx] = {
          ...initProd,
          ...current,
          platform: current.platform || initProd.platform,
          service_type: current.service_type || initProd.service_type,
          min_quantity: current.min_quantity || initProd.min_quantity,
          max_quantity: current.max_quantity || initProd.max_quantity,
          status: current.status || 'PUBLISHED',
        };
      }
    }

    // Update local store
    safeStoreSet(STORE_STORAGE_KEYS.PRODUCTS, JSON.stringify(list));

    // Asynchronously insert missing services into Supabase if configured
    if (isSupabaseConfigured && supabase && missingToSeed.length > 0) {
      try {
        await supabase.from('store_products').upsert(
          missingToSeed.map((p) => ({
            name: p.name,
            slug: p.slug,
            short_description: p.short_description,
            description: p.description,
            price_paise: p.price_paise,
            compare_at_price_paise: p.compare_at_price_paise || null,
            platform: p.platform || null,
            service_type: p.service_type || null,
            min_quantity: p.min_quantity || null,
            max_quantity: p.max_quantity || null,
            delivery_time_info: p.delivery_time_info || null,
            instructions: p.instructions || null,
            access_info: p.access_info || null,
            delivery_notes: p.delivery_notes || null,
            status: p.status || 'PUBLISHED',
            featured: p.featured || false,
            sort_order: p.sort_order || 0,
          })),
          { onConflict: 'slug' }
        );
      } catch (e) {
        // Non-blocking
      }
    }

    // Apply filtering on the complete guaranteed product catalog
    if (!params?.includeAllStatuses) {
      list = list.filter((p) => (p.status || 'PUBLISHED') === (params?.status || 'PUBLISHED'));
    } else if (params?.status) {
      list = list.filter((p) => (p.status || 'PUBLISHED') === params.status);
    }

    if (params?.platform && params.platform !== 'all') {
      const targetPlat = params.platform.toLowerCase().replace(/^cat-/, '');
      list = list.filter((p) => {
        const plat = (p.platform || '').toLowerCase();
        const cat = (p.category_id || '').toLowerCase().replace(/^cat-/, '');
        const catName = (p.category_name || '').toLowerCase();
        const slug = (p.slug || '').toLowerCase();

        return (
          plat === targetPlat ||
          (targetPlat === 'twitter' && (plat === 'x' || plat === 'twitter')) ||
          (targetPlat === 'x' && (plat === 'x' || plat === 'twitter')) ||
          (targetPlat === 'digital' && (!p.platform || plat === 'digital' || plat === 'boilerplate')) ||
          cat === targetPlat ||
          catName.includes(targetPlat) ||
          slug.startsWith(targetPlat) ||
          slug.includes(targetPlat)
        );
      });
    }

    if (params?.categoryId && params.categoryId !== 'all') {
      const targetCat = params.categoryId.toLowerCase().replace(/^cat-/, '');
      list = list.filter((p) => {
        const cat = (p.category_id || '').toLowerCase().replace(/^cat-/, '');
        const plat = (p.platform || '').toLowerCase();
        return cat === targetCat || plat === targetCat || p.category_id === params.categoryId;
      });
    }

    if (params?.featured !== undefined) {
      list = list.filter((p) => p.featured === params.featured);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.platform && p.platform.toLowerCase().includes(q)) ||
          (p.service_type && p.service_type.toLowerCase().includes(q))
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
            thumbnail_url: data.thumbnail_url || (data.thumbnail_path
              ? data.thumbnail_path.startsWith('http')
                ? data.thumbnail_path
                : supabase?.storage.from('store-thumbnails').getPublicUrl(data.thumbnail_path).data.publicUrl
              : null),
          } as StoreProduct;
        }
      } catch (err) {
        console.warn('Supabase getProductBySlug error:', err);
      }
    }

    const products = await this.getProducts({ includeAllStatuses: true });
    return products.find((p) => p.slug === slug || p.id === slug) || null;
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
            thumbnail_url: data.thumbnail_url || (data.thumbnail_path
              ? data.thumbnail_path.startsWith('http')
                ? data.thumbnail_path
                : supabase?.storage.from('store-thumbnails').getPublicUrl(data.thumbnail_path).data.publicUrl
              : null),
          } as StoreProduct;
        }
      } catch (err) {
        console.warn('Supabase getProductById error:', err);
      }
    }

    const products = await this.getProducts({ includeAllStatuses: true });
    return products.find((p) => p.id === id || p.slug === id) || null;
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
          thumbnail_url: productData.thumbnail_url?.trim() || null,
          thumbnail_path: productData.thumbnail_url?.trim() || productData.thumbnail_path || null,
          product_file_path: productData.product_file_path || null,
          file_name: productData.file_name || null,
          file_size_bytes: productData.file_size_bytes || null,
          mime_type: productData.mime_type || null,
          access_link: productData.access_link?.trim() || null,
          instructions: productData.instructions?.trim() || null,
          access_info: productData.access_info?.trim() || null,
          license_key: productData.license_key?.trim() || null,
          delivery_notes: productData.delivery_notes?.trim() || null,
          platform: productData.platform?.trim() || null,
          service_type: productData.service_type?.trim() || null,
          min_quantity: productData.min_quantity || null,
          max_quantity: productData.max_quantity || null,
          delivery_time_info: productData.delivery_time_info?.trim() || null,
          sort_order: productData.sort_order || 0,
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
          thumbnail_url: updates.thumbnail_url !== undefined ? (updates.thumbnail_url?.trim() || null) : undefined,
          thumbnail_path: updates.thumbnail_url !== undefined ? (updates.thumbnail_url?.trim() || null) : updates.thumbnail_path,
          access_link: updates.access_link !== undefined ? (updates.access_link?.trim() || null) : undefined,
          instructions: updates.instructions !== undefined ? (updates.instructions?.trim() || null) : undefined,
          access_info: updates.access_info !== undefined ? (updates.access_info?.trim() || null) : undefined,
          license_key: updates.license_key !== undefined ? (updates.license_key?.trim() || null) : undefined,
          delivery_notes: updates.delivery_notes !== undefined ? (updates.delivery_notes?.trim() || null) : undefined,
          platform: updates.platform !== undefined ? (updates.platform?.trim() || null) : undefined,
          service_type: updates.service_type !== undefined ? (updates.service_type?.trim() || null) : undefined,
          min_quantity: updates.min_quantity !== undefined ? updates.min_quantity : undefined,
          max_quantity: updates.max_quantity !== undefined ? updates.max_quantity : undefined,
          delivery_time_info: updates.delivery_time_info !== undefined ? (updates.delivery_time_info?.trim() || null) : undefined,
          sort_order: updates.sort_order !== undefined ? updates.sort_order : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as StoreProduct;
    }

    const products = await this.getProducts({ includeAllStatuses: true });
    const idx = products.findIndex((p) => p.id === id || p.slug === id);
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
  async createOrder(params: {
    productId: string;
    quantity: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    serviceFields?: Record<string, any>;
    userId?: string | null;
  }): Promise<{ success: boolean; order: StoreOrder }> {
    const { productId, quantity, customerName, customerEmail, customerPhone, serviceFields, userId } = params;

    if (!customerPhone || customerPhone.replace(/[^0-9]/g, '').length < 10) {
      throw new Error('WhatsApp / mobile phone number is compulsory to place an order.');
    }

    const products = await this.getProducts({ includeAllStatuses: true });
    let product = products.find((p) => p.id === productId || p.slug === productId);
    if (!product) {
      const initMatch = INITIAL_STORE_PRODUCTS.find((p) => p.slug === productId || (p as any).id === productId);
      if (initMatch) {
        product = {
          id: `sp-${initMatch.slug}`,
          ...initMatch,
          status: 'PUBLISHED',
        } as StoreProduct;
      }
    }

    if (!product) {
      throw new Error('Product not found or unavailable for purchase.');
    }

    const parsedQty = Math.max(1, Math.round(Number(quantity) || Number(product.min_quantity) || 1));
    const totalPaise = calculateServicePrice(product, parsedQty);
    const unitPricePaise = Math.round(totalPaise / parsedQty);

    const now = new Date().toISOString();
    const orderNumber = generateOrderNumber();
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newOrder: StoreOrder = {
      id: orderId,
      order_number: orderNumber,
      user_id: userId || null,
      customer_email: customerEmail.trim().toLowerCase(),
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      subtotal_paise: totalPaise,
      discount_paise: 0,
      total_paise: totalPaise,
      currency: 'INR',
      status: 'PAYMENT_PENDING',
      fulfillment_status: 'UNFULFILLED',
      service_fields_snapshot: serviceFields || {},
      created_at: now,
      updated_at: now,
      items: [
        {
          id: `item-${Date.now()}`,
          order_id: orderId,
          product_id: product.id,
          product_name_snapshot: product.name,
          unit_price_paise: unitPricePaise,
          quantity: parsedQty,
          total_paise: totalPaise,
          fields_snapshot: serviceFields || {},
          created_at: now,
          product,
        },
      ],
      payments: [],
    };

    // Save to Local Storage Cache
    const rawOrders = safeStoreGet(STORE_STORAGE_KEYS.ORDERS);
    const orders: StoreOrder[] = rawOrders ? JSON.parse(rawOrders) : [];
    orders.unshift(newOrder);
    safeStoreSet(STORE_STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Also attempt Supabase insert if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbOrder, error: orderErr } = await supabase
          .from('store_orders')
          .insert({
            order_number: orderNumber,
            user_id: userId || null,
            customer_email: customerEmail.trim().toLowerCase(),
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            total_paise: totalPaise,
            currency: 'INR',
            status: 'PAYMENT_PENDING',
            fulfillment_status: 'UNFULFILLED',
          })
          .select()
          .single();

        if (!orderErr && dbOrder) {
          await supabase.from('store_order_items').insert({
            order_id: dbOrder.id,
            product_id: product.id,
            product_name_snapshot: product.name,
            unit_price_paise: unitPricePaise,
            quantity: parsedQty,
            total_paise: totalPaise,
            fields_snapshot: serviceFields || {},
          });
          newOrder.id = dbOrder.id;
        }
      } catch (err) {
        console.warn('Supabase createOrder insert notice:', err);
      }
    }

    return { success: true, order: newOrder };
  },
  async getCustomerOrders(userId: string): Promise<StoreOrder[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_orders')
          .select('*, store_order_items(*, store_products(*)), store_payments(*)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((o: any) => ({
            ...o,
            items: (o.store_order_items || []).map((item: any) => ({
              ...item,
              product: item.store_products || undefined,
            })),
            payments: o.store_payments || [],
          })) as StoreOrder[];
        }
      } catch (err) {
        console.warn('Supabase getCustomerOrders error:', err);
      }
    }

    const raw = safeStoreGet(STORE_STORAGE_KEYS.ORDERS);
    const orders: StoreOrder[] = raw ? JSON.parse(raw) : [];
    const products = await this.getProducts({ includeAllStatuses: true });

    return orders
      .filter((o) => o.user_id === userId)
      .map((o) => ({
        ...o,
        items: (o.items || []).map((item) => ({
          ...item,
          product: item.product || products.find((p) => p.id === item.product_id),
        })),
      }));
  },

  async getOrderById(id: string, userId?: string): Promise<StoreOrder | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('store_orders')
          .select('*, store_order_items(*, store_products(*)), store_payments(*)')
          .eq('id', id);

        if (userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query.single();
        if (!error && data) {
          return {
            ...data,
            items: (data.store_order_items || []).map((item: any) => ({
              ...item,
              product: item.store_products || undefined,
            })),
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

    const products = await this.getProducts({ includeAllStatuses: true });
    return {
      ...order,
      items: (order.items || []).map((item) => ({
        ...item,
        product: item.product || products.find((p) => p.id === item.product_id),
      })),
    };
  },

  async getAdminOrders(params?: {
    status?: string;
    search?: string;
  }): Promise<StoreOrder[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('store_orders')
          .select('*, store_order_items(*, store_products(*)), store_payments(*)')
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
            items: (o.store_order_items || []).map((item: any) => ({
              ...item,
              product: item.store_products || undefined,
            })),
            payments: o.store_payments || [],
          })) as StoreOrder[];
        }
      } catch (err) {
        console.warn('Supabase getAdminOrders error:', err);
      }
    }

    const raw = safeStoreGet(STORE_STORAGE_KEYS.ORDERS);
    let orders: StoreOrder[] = raw ? JSON.parse(raw) : [];
    const products = await this.getProducts({ includeAllStatuses: true });

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

    return orders.map((o) => ({
      ...o,
      items: (o.items || []).map((item) => ({
        ...item,
        product: item.product || products.find((p) => p.id === item.product_id),
      })),
    }));
  },

  async getAdminPaymentReviews(): Promise<StoreOrder[]> {
    return this.getAdminOrders({ status: 'PAYMENT_REVIEW' });
  },

  async getOrderAuditLogs(orderId: string): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_order_audit_logs')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false });

        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getOrderAuditLogs notice:', err);
      }
    }
    return [];
  },

  async reviewOrder(params: {
    orderId: string;
    action: 'APPROVE_PAYMENT' | 'REJECT_PAYMENT' | 'MARK_DELIVERED' | 'LOG_WHATSAPP_SENT' | 'ADD_NOTE';
    reason?: string;
    deliveryNotes?: string;
    adminNotes?: string;
  }): Promise<{ success: boolean; message?: string; error?: string; order?: StoreOrder }> {
    try {
      const session = (await supabase?.auth.getSession())?.data.session;
      const token = session?.access_token || '';

      const res = await fetch('/api/store/admin/review-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Review action failed.');
      }
      return data;
    } catch (err: any) {
      console.error('storeDataService reviewOrder error:', err);
      return { success: false, error: err.message || 'Error processing review action.' };
    }
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
          return data
            .filter((d: any) => d.store_orders?.status === 'PAID' || d.store_orders?.status === 'DELIVERED')
            .map((d: any) => ({
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
      paid_orders: orders.filter((o) => o.status === 'PAID' || o.status === 'DELIVERED').length,
      pending_payments: orders.filter((o) => o.status === 'PAYMENT_PENDING' || o.status === 'CREATED').length,
      pending_reviews: orders.filter((o) => o.status === 'PAYMENT_REVIEW').length,
      total_delivered: orders.filter((o) => o.fulfillment_status === 'DELIVERED' || o.status === 'DELIVERED').length,
      total_revenue_paise: orders
        .filter((o) => o.status === 'PAID' || o.status === 'DELIVERED')
        .reduce((sum, o) => sum + (o.total_paise || 0), 0),
    };
  },
};
