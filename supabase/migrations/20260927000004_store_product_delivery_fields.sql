-- ==============================================================================
-- VyapaarPro - Store Product Delivery Configuration & Customer Delivery Details
-- Migration: 20260927000004_store_product_delivery_fields.sql
-- ==============================================================================

-- 1. Add delivery configuration fields to store_products
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS access_link TEXT,
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS access_info TEXT,
  ADD COLUMN IF NOT EXISTS license_key TEXT,
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_store_products_access_link ON public.store_products(access_link) WHERE access_link IS NOT NULL;
