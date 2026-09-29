-- ============================================================================
-- Migration: 20260929000001_ai_support_system.sql
-- Description: Complete AI Support System & Customer Support Ticket Architecture
-- ============================================================================

-- 1. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('General', 'Service', 'Store', 'Payment', 'Order', 'Delivery', 'Technical', 'Other')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed')),
  order_id TEXT,
  assigned_admin_id UUID,
  internal_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. SUPPORT TICKET MESSAGES TABLE
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin', 'system')),
  sender_id UUID,
  sender_name TEXT,
  message TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false, -- Internal admin notes never visible to customers
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. SUPPORT CONVERSATIONS TABLE (AI CHAT SESSIONS)
CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_session_id TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  requires_human BOOLEAN NOT NULL DEFAULT false,
  context_type TEXT DEFAULT 'general' CHECK (context_type IN ('general', 'product', 'service', 'order')),
  context_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. SUPPORT MESSAGES TABLE (AI CHAT MESSAGES)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'ai', 'admin', 'system')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. AI SUPPORT SETTINGS TABLE (ADMIN CONFIGURATION)
CREATE TABLE IF NOT EXISTS ai_support_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  welcome_message TEXT NOT NULL DEFAULT 'Hello! I am VyapaarPro AI Support. Ask me about our custom web development, mobile apps, social media growth services, store products, or your orders.',
  fallback_message TEXT NOT NULL DEFAULT 'I do not have enough verified information to answer that accurately. Would you like me to connect you with our team or create a support ticket?',
  system_instructions TEXT NOT NULL DEFAULT 'You are the official AI Support specialist for VyapaarPro (https://vyapaarpro.in). You provide friendly, concise, and 100% accurate responses in English or Hindi/Hinglish based on the customer query. Never invent prices or unavailable services. Never request passwords, OTPs, or private keys.',
  max_messages_per_conversation INTEGER NOT NULL DEFAULT 30,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 10,
  human_handoff_enabled BOOLEAN NOT NULL DEFAULT true,
  allowed_knowledge_sources JSONB NOT NULL DEFAULT '["services", "store_products", "faqs", "policies", "orders"]'::jsonb,
  support_email TEXT NOT NULL DEFAULT 'support@vyapaarpro.in',
  support_phone TEXT NOT NULL DEFAULT '+91 98765 43210',
  custom_knowledge TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default settings if not exists
INSERT INTO ai_support_settings (id, is_enabled)
VALUES ('default', true)
ON CONFLICT (id) DO NOTHING;

-- 6. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_guest_session ON support_conversations(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_requires_human ON support_conversations(requires_human);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_id ON support_messages(conversation_id);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_support_settings ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is authorized admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') = 'kumarsrijal732@gmail.com'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'),
    false
  );
$$;

-- RLS: support_tickets
DROP POLICY IF EXISTS "Public and guests can create tickets" ON support_tickets;
CREATE POLICY "Public and guests can create tickets"
ON support_tickets FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
CREATE POLICY "Users can view their own tickets"
ON support_tickets FOR SELECT
USING (
  auth.uid() = user_id
  OR is_admin_user()
);

DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
CREATE POLICY "Users can update their own tickets"
ON support_tickets FOR UPDATE
USING (
  auth.uid() = user_id
  OR is_admin_user()
);

DROP POLICY IF EXISTS "Admins can manage all tickets" ON support_tickets;
CREATE POLICY "Admins can manage all tickets"
ON support_tickets FOR ALL
USING (is_admin_user());

-- RLS: support_ticket_messages
DROP POLICY IF EXISTS "Users can view non-internal messages of own tickets" ON support_ticket_messages;
CREATE POLICY "Users can view non-internal messages of own tickets"
ON support_ticket_messages FOR SELECT
USING (
  (is_internal = false AND EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_ticket_messages.ticket_id
    AND support_tickets.user_id = auth.uid()
  ))
  OR is_admin_user()
);

DROP POLICY IF EXISTS "Users and guests can insert messages to own tickets" ON support_ticket_messages;
CREATE POLICY "Users and guests can insert messages to own tickets"
ON support_ticket_messages FOR INSERT
WITH CHECK (
  (is_internal = false AND EXISTS (
    SELECT 1 FROM support_tickets
    WHERE support_tickets.id = support_ticket_messages.ticket_id
    AND (support_tickets.user_id = auth.uid() OR auth.uid() IS NULL)
  ))
  OR is_admin_user()
);

-- RLS: support_conversations
DROP POLICY IF EXISTS "Users and guests can create conversations" ON support_conversations;
CREATE POLICY "Users and guests can create conversations"
ON support_conversations FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own conversations" ON support_conversations;
CREATE POLICY "Users can view own conversations"
ON support_conversations FOR SELECT
USING (
  auth.uid() = user_id
  OR is_admin_user()
  OR (user_id IS NULL AND guest_session_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Users can update own conversations" ON support_conversations;
CREATE POLICY "Users can update own conversations"
ON support_conversations FOR UPDATE
USING (
  auth.uid() = user_id
  OR is_admin_user()
);

-- RLS: support_messages
DROP POLICY IF EXISTS "Users and guests can insert chat messages" ON support_messages;
CREATE POLICY "Users and guests can insert chat messages"
ON support_messages FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON support_messages;
CREATE POLICY "Users can view messages in own conversations"
ON support_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM support_conversations
    WHERE support_conversations.id = support_messages.conversation_id
    AND (
      support_conversations.user_id = auth.uid()
      OR is_admin_user()
      OR support_conversations.user_id IS NULL
    )
  )
);

-- RLS: ai_support_settings
DROP POLICY IF EXISTS "Anyone can read AI support settings" ON ai_support_settings;
CREATE POLICY "Anyone can read AI support settings"
ON ai_support_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only admins can modify AI settings" ON ai_support_settings;
CREATE POLICY "Only admins can modify AI settings"
ON ai_support_settings FOR ALL
USING (is_admin_user());
