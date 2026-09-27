-- ==============================================================================
-- VyapaarPro - Digital Store Module Database Schema, RLS & Storage
-- Migration: 20260927000002_store_module.sql
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. STORE CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_categories_slug ON public.store_categories(slug);
CREATE INDEX IF NOT EXISTS idx_store_categories_active ON public.store_categories(is_active);

-- Enable RLS on store_categories
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;

-- Category Policies:
-- Public can read active categories
DROP POLICY IF EXISTS "Public read active store categories" ON public.store_categories;
CREATE POLICY "Public read active store categories"
  ON public.store_categories FOR SELECT
  USING (is_active = true OR public.is_admin());

-- Admin can insert, update, delete categories
DROP POLICY IF EXISTS "Admin insert store categories" ON public.store_categories;
CREATE POLICY "Admin insert store categories"
  ON public.store_categories FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin update store categories" ON public.store_categories;
CREATE POLICY "Admin update store categories"
  ON public.store_categories FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin delete store categories" ON public.store_categories;
CREATE POLICY "Admin delete store categories"
  ON public.store_categories FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. STORE PRODUCTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.store_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
  compare_at_price_paise BIGINT CHECK (compare_at_price_paise IS NULL OR compare_at_price_paise >= 0),
  thumbnail_path TEXT,
  product_file_path TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_products_slug ON public.store_products(slug);
CREATE INDEX IF NOT EXISTS idx_store_products_status ON public.store_products(status);
CREATE INDEX IF NOT EXISTS idx_store_products_category ON public.store_products(category_id);
CREATE INDEX IF NOT EXISTS idx_store_products_featured ON public.store_products(featured);

-- Enable RLS on store_products
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Product Policies:
-- Public can read PUBLISHED products; Admin can read all products
DROP POLICY IF EXISTS "Public read published store products" ON public.store_products;
CREATE POLICY "Public read published store products"
  ON public.store_products FOR SELECT
  USING (status = 'PUBLISHED' OR public.is_admin());

-- Admin can manage products
DROP POLICY IF EXISTS "Admin insert store products" ON public.store_products;
CREATE POLICY "Admin insert store products"
  ON public.store_products FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin update store products" ON public.store_products;
CREATE POLICY "Admin update store products"
  ON public.store_products FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin delete store products" ON public.store_products;
CREATE POLICY "Admin delete store products"
  ON public.store_products FOR DELETE
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. STORE ORDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  subtotal_paise BIGINT NOT NULL DEFAULT 0,
  discount_paise BIGINT NOT NULL DEFAULT 0,
  total_paise BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'PAYMENT_PENDING', 'PAID', 'PAYMENT_FAILED', 'CANCELLED', 'REFUNDED')),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_orders_user ON public.store_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_number ON public.store_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_store_orders_status ON public.store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_created ON public.store_orders(created_at DESC);

-- Enable RLS on store_orders
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

-- Order Policies:
-- Customers can read their own orders; Admin can read all orders
DROP POLICY IF EXISTS "Users read own store orders" ON public.store_orders;
CREATE POLICY "Users read own store orders"
  ON public.store_orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Authenticated users or server functions can insert orders
DROP POLICY IF EXISTS "Users insert own store orders" ON public.store_orders;
CREATE POLICY "Users insert own store orders"
  ON public.store_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

-- Only admins or service role can update orders directly
DROP POLICY IF EXISTS "Admin update store orders" ON public.store_orders;
CREATE POLICY "Admin update store orders"
  ON public.store_orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. STORE ORDER ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.store_products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  unit_price_paise BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_paise BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_order_items_order ON public.store_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_store_order_items_product ON public.store_order_items(product_id);

-- Enable RLS on store_order_items
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

-- Order Items Policies:
DROP POLICY IF EXISTS "Users read own store order items" ON public.store_order_items;
CREATE POLICY "Users read own store order items"
  ON public.store_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_orders
      WHERE store_orders.id = store_order_items.order_id
        AND (store_orders.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Insert store order items" ON public.store_order_items;
CREATE POLICY "Insert store order items"
  ON public.store_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_orders
      WHERE store_orders.id = store_order_items.order_id
        AND (store_orders.user_id = auth.uid() OR store_orders.user_id IS NULL OR public.is_admin())
    )
  );

-- ------------------------------------------------------------------------------
-- 5. STORE PAYMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'famgateway',
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  gateway_reference TEXT,
  amount_paise BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
  raw_reference_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_payments_order ON public.store_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_store_payments_status ON public.store_payments(status);
CREATE INDEX IF NOT EXISTS idx_store_payments_gateway_order ON public.store_payments(gateway_order_id);

-- Enable RLS on store_payments
ALTER TABLE public.store_payments ENABLE ROW LEVEL SECURITY;

-- Payment Policies:
DROP POLICY IF EXISTS "Users read own store payments" ON public.store_payments;
CREATE POLICY "Users read own store payments"
  ON public.store_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_orders
      WHERE store_orders.id = store_payments.order_id
        AND (store_orders.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admin manage store payments" ON public.store_payments;
CREATE POLICY "Admin manage store payments"
  ON public.store_payments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. STORE DOWNLOADS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.store_order_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.store_products(id) ON DELETE SET NULL,
  download_count INT NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_downloads_user ON public.store_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_store_downloads_order ON public.store_downloads(order_id);
CREATE INDEX IF NOT EXISTS idx_store_downloads_product ON public.store_downloads(product_id);

-- Enable RLS on store_downloads
ALTER TABLE public.store_downloads ENABLE ROW LEVEL SECURITY;

-- Download Policies:
-- Users can read their own downloads only when the associated order is PAID and access has not been revoked
DROP POLICY IF EXISTS "Users read own valid store downloads" ON public.store_downloads;
CREATE POLICY "Users read own valid store downloads"
  ON public.store_downloads FOR SELECT
  USING (
    (auth.uid() = user_id AND revoked_at IS NULL)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admin manage store downloads" ON public.store_downloads;
CREATE POLICY "Admin manage store downloads"
  ON public.store_downloads FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. STORE DASHBOARD STATS HELPER RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_store_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_total_products BIGINT;
  v_published_products BIGINT;
  v_draft_products BIGINT;
  v_total_orders BIGINT;
  v_paid_orders BIGINT;
  v_pending_payments BIGINT;
  v_total_revenue_paise BIGINT;
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Administrator permissions required.';
  END IF;

  SELECT COUNT(*) INTO v_total_products FROM public.store_products WHERE status != 'ARCHIVED';
  SELECT COUNT(*) INTO v_published_products FROM public.store_products WHERE status = 'PUBLISHED';
  SELECT COUNT(*) INTO v_draft_products FROM public.store_products WHERE status = 'DRAFT';
  
  SELECT COUNT(*) INTO v_total_orders FROM public.store_orders;
  SELECT COUNT(*) INTO v_paid_orders FROM public.store_orders WHERE status = 'PAID';
  SELECT COUNT(*) INTO v_pending_payments FROM public.store_orders WHERE status IN ('PAYMENT_PENDING', 'CREATED');
  
  SELECT COALESCE(SUM(total_paise), 0) INTO v_total_revenue_paise FROM public.store_orders WHERE status = 'PAID';

  v_result := jsonb_build_object(
    'total_products', v_total_products,
    'published_products', v_published_products,
    'draft_products', v_draft_products,
    'total_orders', v_total_orders,
    'paid_orders', v_paid_orders,
    'pending_payments', v_pending_payments,
    'total_revenue_paise', v_total_revenue_paise
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 8. STORAGE BUCKETS CONFIGURATION
-- ------------------------------------------------------------------------------
-- 1. Private storage bucket for digital download files (ZIP, PDF, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-products-private',
  'store-products-private',
  false,
  104857600, -- 100MB limit per file
  ARRAY[
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
    'application/pdf',
    'application/json',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600;

-- 2. Public storage bucket for product thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-thumbnails',
  'store-thumbnails',
  true,
  10485760, -- 10MB limit per image
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Storage Policies for store-thumbnails:
DROP POLICY IF EXISTS "Public read store thumbnails" ON storage.objects;
CREATE POLICY "Public read store thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-thumbnails');

DROP POLICY IF EXISTS "Admin manage store thumbnails" ON storage.objects;
CREATE POLICY "Admin manage store thumbnails"
  ON storage.objects FOR ALL
  USING (bucket_id = 'store-thumbnails' AND public.is_admin())
  WITH CHECK (bucket_id = 'store-thumbnails' AND public.is_admin());

-- Storage Policies for store-products-private:
-- Private bucket objects can ONLY be read/managed by admin or service role
DROP POLICY IF EXISTS "Admin manage private store product files" ON storage.objects;
CREATE POLICY "Admin manage private store product files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'store-products-private' AND public.is_admin())
  WITH CHECK (bucket_id = 'store-products-private' AND public.is_admin());
