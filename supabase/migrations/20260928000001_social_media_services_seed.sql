-- ==============================================================================
-- VyapaarPro - Social Media Services Catalog Schema & Idempotent Seeding
-- Migration: 20260928000001_social_media_services_seed.sql
-- ==============================================================================

-- 1. Extend store_products table with platform & service metadata
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS min_quantity INT DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_quantity INT DEFAULT 1000000,
  ADD COLUMN IF NOT EXISTS delivery_time_info TEXT DEFAULT 'Instant • 0-2 Hours',
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_store_products_platform ON public.store_products(platform);
CREATE INDEX IF NOT EXISTS idx_store_products_service_type ON public.store_products(service_type);

-- 2. Seed Social Media Categories (Idempotent)
INSERT INTO public.store_categories (name, slug, description, is_active, sort_order)
VALUES
  ('Instagram Growth', 'instagram', 'High-retention Instagram followers, likes, reels views, and engagement.', true, 10),
  ('YouTube Growth', 'youtube', 'Monetizable YouTube views, subscribers, likes, shorts push, and watch hours.', true, 20),
  ('Facebook Services', 'facebook', 'Facebook page followers, post reactions, video views, and shares.', true, 30),
  ('X / Twitter Boost', 'twitter', 'Twitter / X followers, impressions, retweets, and engagement.', true, 40),
  ('Telegram Growth', 'telegram', 'Telegram channel members, post views, reactions, and poll votes.', true, 50),
  ('TikTok Promotion', 'tiktok', 'TikTok viral views, followers, likes, and shares for FYP push.', true, 60),
  ('Threads Engagement', 'threads', 'Threads followers, likes, replies, and view reach.', true, 70),
  ('Snapchat Services', 'snapchat', 'Snapchat followers, spotlight views, and story views.', true, 80),
  ('Pinterest Marketing', 'pinterest', 'Pinterest followers, pin saves, and impressions.', true, 90),
  ('LinkedIn Professional', 'linkedin', 'LinkedIn business connections, page followers, and post endorsements.', true, 100),
  ('Discord Community', 'discord', 'Discord verified server members and server boost perks.', true, 110),
  ('Spotify Music Push', 'spotify', 'Spotify track plays, playlist followers, and monthly listeners.', true, 120),
  ('Digital Boilerplates', 'digital-products', 'Full-stack software templates, boilerplates, and developer resources.', true, 130)
ON CONFLICT (slug) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;
