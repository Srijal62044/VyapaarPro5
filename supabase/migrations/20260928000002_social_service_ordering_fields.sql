-- ==============================================================================
-- VyapaarPro - Dynamic Social Service Ordering Fields & Order Snapshots
-- Migration: 20260928000002_social_service_ordering_fields.sql
-- ==============================================================================

-- 1. Add ordering fields to store_products
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS ordering_fields JSONB DEFAULT '[]'::jsonb;

-- 2. Add submitted snapshot to store_orders & store_order_items
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS service_fields_snapshot JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_url TEXT,
  ADD COLUMN IF NOT EXISTS target_username TEXT;

ALTER TABLE public.store_order_items
  ADD COLUMN IF NOT EXISTS fields_snapshot JSONB DEFAULT '{}'::jsonb;

-- 3. Dedicated Social Service Fields Table for granular admin management
CREATE TABLE IF NOT EXISTS public.social_service_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.store_products(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'url' CHECK (field_type IN ('text', 'url', 'number', 'textarea', 'long_text', 'select', 'checkbox')),
  placeholder TEXT,
  help_text TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  min_length INT DEFAULT 0,
  max_length INT DEFAULT 1000,
  validation_rule TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_service_fields_service ON public.social_service_fields(service_id);
CREATE INDEX IF NOT EXISTS idx_social_service_fields_active ON public.social_service_fields(is_active);

-- Enable RLS
ALTER TABLE public.social_service_fields ENABLE ROW LEVEL SECURITY;

-- Policies:
DROP POLICY IF EXISTS "Public read active social service fields" ON public.social_service_fields;
CREATE POLICY "Public read active social service fields"
  ON public.social_service_fields FOR SELECT
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage social service fields" ON public.social_service_fields;
CREATE POLICY "Admin manage social service fields"
  ON public.social_service_fields FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
