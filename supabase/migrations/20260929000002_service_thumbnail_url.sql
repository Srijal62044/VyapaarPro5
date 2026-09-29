-- ==============================================================================
-- VyapaarPro - Service Thumbnail URL Support (External URL Only, No File Storage)
-- Migration: 20260929000002_service_thumbnail_url.sql
-- ==============================================================================

-- 1. Ensure thumbnail_url column exists on store_products table for social media growth services
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 2. Backfill existing thumbnail_path to thumbnail_url if it contains an external URL
UPDATE public.store_products
SET thumbnail_url = thumbnail_path
WHERE thumbnail_path IS NOT NULL 
  AND thumbnail_path LIKE 'http%' 
  AND (thumbnail_url IS NULL OR thumbnail_url = '');

-- 3. Ensure thumbnail_url exists on services table as well
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 4. Clear documentation comment
COMMENT ON COLUMN public.store_products.thumbnail_url IS 'External image URL only for social media and store services. Zero binary/file upload, no Supabase Storage.';
COMMENT ON COLUMN public.services.thumbnail_url IS 'External image URL only for agency services. Zero binary/file upload, no Supabase Storage.';
