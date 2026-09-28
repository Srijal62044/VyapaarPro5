-- ==============================================================================
-- VyapaarPro - Digital Store Manual Payment Review & Delivery System
-- Migration: 20260927000003_store_manual_review.sql
-- ==============================================================================

-- 1. Add Manual Review & Delivery columns to store_orders if not exists
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'UNFULFILLED',
  ADD COLUMN IF NOT EXISTS payment_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Update check constraints on status if needed
ALTER TABLE public.store_orders DROP CONSTRAINT IF EXISTS store_orders_status_check;
ALTER TABLE public.store_orders
  ADD CONSTRAINT store_orders_status_check
  CHECK (status IN ('CREATED', 'PAYMENT_PENDING', 'PAYMENT_REVIEW', 'PAID', 'REJECTED', 'DELIVERED', 'CANCELLED'));

ALTER TABLE public.store_orders DROP CONSTRAINT IF EXISTS store_orders_fulfillment_check;
ALTER TABLE public.store_orders
  ADD CONSTRAINT store_orders_fulfillment_check
  CHECK (fulfillment_status IN ('UNFULFILLED', 'READY_FOR_DELIVERY', 'DELIVERED'));

CREATE INDEX IF NOT EXISTS idx_store_orders_review_status ON public.store_orders(status) WHERE status = 'PAYMENT_REVIEW';
CREATE INDEX IF NOT EXISTS idx_store_orders_fulfillment ON public.store_orders(fulfillment_status);

-- 2. Update store_payments check constraint
ALTER TABLE public.store_payments DROP CONSTRAINT IF EXISTS store_payments_status_check;
ALTER TABLE public.store_payments
  ADD CONSTRAINT store_payments_status_check
  CHECK (status IN ('CREATED', 'PENDING', 'REVIEW', 'SUCCESS', 'FAILED', 'REJECTED', 'REFUNDED'));

-- 3. Create Immutable Audit Logs table for Manual Reviews
CREATE TABLE IF NOT EXISTS public.store_order_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_audit_order ON public.store_order_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_store_audit_created ON public.store_order_audit_logs(created_at DESC);

-- Enable RLS on audit logs
ALTER TABLE public.store_order_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin view store audit logs" ON public.store_order_audit_logs;
CREATE POLICY "Admin view store audit logs"
  ON public.store_order_audit_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin insert store audit logs" ON public.store_order_audit_logs;
CREATE POLICY "Admin insert store audit logs"
  ON public.store_order_audit_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- 4. Update Download Policies (Only accessible when order is PAID or DELIVERED)
DROP POLICY IF EXISTS "Users read own valid store downloads" ON public.store_downloads;
CREATE POLICY "Users read own valid store downloads"
  ON public.store_downloads FOR SELECT
  USING (
    (
      auth.uid() = user_id
      AND revoked_at IS NULL
      AND EXISTS (
        SELECT 1 FROM public.store_orders
        WHERE store_orders.id = store_downloads.order_id
          AND store_orders.status IN ('PAID', 'DELIVERED')
      )
    )
    OR public.is_admin()
  );

-- 5. Updated Store Dashboard Stats RPC Helper
CREATE OR REPLACE FUNCTION public.get_store_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
  v_total_products BIGINT;
  v_published_products BIGINT;
  v_draft_products BIGINT;
  v_total_orders BIGINT;
  v_paid_orders BIGINT;
  v_pending_payments BIGINT;
  v_pending_reviews BIGINT;
  v_total_delivered BIGINT;
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
  SELECT COUNT(*) INTO v_paid_orders FROM public.store_orders WHERE status IN ('PAID', 'DELIVERED');
  SELECT COUNT(*) INTO v_pending_payments FROM public.store_orders WHERE status IN ('PAYMENT_PENDING', 'CREATED');
  SELECT COUNT(*) INTO v_pending_reviews FROM public.store_orders WHERE status = 'PAYMENT_REVIEW';
  SELECT COUNT(*) INTO v_total_delivered FROM public.store_orders WHERE fulfillment_status = 'DELIVERED' OR status = 'DELIVERED';
  
  SELECT COALESCE(SUM(total_paise), 0) INTO v_total_revenue_paise FROM public.store_orders WHERE status IN ('PAID', 'DELIVERED');

  v_result := jsonb_build_object(
    'total_products', v_total_products,
    'published_products', v_published_products,
    'draft_products', v_draft_products,
    'total_orders', v_total_orders,
    'paid_orders', v_paid_orders,
    'pending_payments', v_pending_payments,
    'pending_reviews', v_pending_reviews,
    'total_delivered', v_total_delivered,
    'total_revenue_paise', v_total_revenue_paise
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
