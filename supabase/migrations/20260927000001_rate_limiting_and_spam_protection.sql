-- ==============================================================================
-- VyapaarPro - Rate Limiting & Spam Protection Migration
-- ==============================================================================

-- 1. Create Rate Limits Table for Distributed Serverless Enforcement
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON public.rate_limits(expires_at);

-- Enable RLS (Strict: public cannot read or write directly to avoid tampering)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 2. Atomic Rate Limit Check and Increment Function
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_key TEXT,
  p_max_requests INT,
  p_window_seconds INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_expires_at TIMESTAMPTZ;
  v_count INT;
  v_window_start TIMESTAMPTZ;
  v_retry_after INT := 0;
  v_allowed BOOLEAN := true;
BEGIN
  -- Lazy cleanup of old expired records (1 in 10 chance or expired records past 1 day)
  IF (random() < 0.1) THEN
    DELETE FROM public.rate_limits WHERE expires_at < (v_now - INTERVAL '1 hour');
  END IF;

  -- Lock and fetch existing rate limit record
  SELECT count, window_start, expires_at
  INTO v_count, v_window_start, v_expires_at
  FROM public.rate_limits
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    -- First request in this window
    v_expires_at := v_now + (p_window_seconds || ' seconds')::interval;
    INSERT INTO public.rate_limits (key, count, window_start, expires_at)
    VALUES (p_key, 1, v_now, v_expires_at);

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'retry_after', 0,
      'reset_at', v_expires_at
    );
  END IF;

  -- Check if current window has expired
  IF v_now >= v_expires_at THEN
    -- Window expired, reset counter and new window
    v_expires_at := v_now + (p_window_seconds || ' seconds')::interval;
    UPDATE public.rate_limits
    SET count = 1, window_start = v_now, expires_at = v_expires_at
    WHERE key = p_key;

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_requests - 1,
      'retry_after', 0,
      'reset_at', v_expires_at
    );
  END IF;

  -- Window is still active: check if limit exceeded
  IF v_count >= p_max_requests THEN
    v_allowed := false;
    v_retry_after := GREATEST(1, EXTRACT(EPOCH FROM (v_expires_at - v_now))::INT);

    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retry_after', v_retry_after,
      'reset_at', v_expires_at
    );
  ELSE
    -- Increment counter
    UPDATE public.rate_limits
    SET count = count + 1
    WHERE key = p_key;

    RETURN jsonb_build_object(
      'allowed', true,
      'remaining', p_max_requests - (v_count + 1),
      'retry_after', 0,
      'reset_at', v_expires_at
    );
  END IF;
END;
$$;

-- Allow anon and authenticated users to execute the rate limiter check RPC
GRANT EXECUTE ON FUNCTION public.check_and_increment_rate_limit(TEXT, INT, INT) TO anon, authenticated, service_role;

-- 3. Database-Level Trigger for Contact Form Spam & Input Validation
CREATE OR REPLACE FUNCTION public.validate_contact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Trim whitespace
  NEW.name := trim(NEW.name);
  NEW.email := lower(trim(NEW.email));
  NEW.subject := trim(NEW.subject);
  NEW.message := trim(NEW.message);

  -- Input Length Validation
  IF length(NEW.name) < 2 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;

  IF length(NEW.email) < 5 OR NEW.email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Invalid email address format';
  END IF;

  IF length(NEW.subject) < 2 OR length(NEW.subject) > 250 THEN
    RAISE EXCEPTION 'Subject must be between 2 and 250 characters';
  END IF;

  IF length(NEW.message) < 5 OR length(NEW.message) > 5000 THEN
    RAISE EXCEPTION 'Message must be between 5 and 5000 characters';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_contact_message ON public.contact_messages;
CREATE TRIGGER trg_validate_contact_message
  BEFORE INSERT OR UPDATE ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_contact_message();

-- 4. Database-Level Trigger for Service Requests Input Validation
CREATE OR REPLACE FUNCTION public.validate_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.client_name := trim(NEW.client_name);
  NEW.client_email := lower(trim(NEW.client_email));
  NEW.client_phone := trim(NEW.client_phone);
  NEW.requirements := trim(NEW.requirements);

  IF length(NEW.client_name) < 2 OR length(NEW.client_name) > 100 THEN
    RAISE EXCEPTION 'Client name must be between 2 and 100 characters';
  END IF;

  IF length(NEW.client_email) < 5 OR NEW.client_email NOT LIKE '%@%.%' THEN
    RAISE EXCEPTION 'Invalid client email address format';
  END IF;

  IF length(NEW.client_phone) < 6 OR length(NEW.client_phone) > 30 THEN
    RAISE EXCEPTION 'Client phone number must be between 6 and 30 characters';
  END IF;

  IF length(NEW.requirements) < 5 OR length(NEW.requirements) > 5000 THEN
    RAISE EXCEPTION 'Requirements description must be between 5 and 5000 characters';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_service_request ON public.service_requests;
CREATE TRIGGER trg_validate_service_request
  BEFORE INSERT OR UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_service_request();
