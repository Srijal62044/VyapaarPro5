-- ==============================================================================
-- VyapaarPro - Seed Data (Categories, Services, Features, FAQs, Portfolio, Settings)
-- Migration: 20260926000002_seed_data.sql
-- (Idempotent seed data with 100% RFC-compliant hexadecimal UUIDs)
-- ==============================================================================

-- 1. Agency Settings
INSERT INTO public.settings (key, value)
VALUES (
  'agency_profile',
  '{
    "name": "VyapaarPro",
    "tagline": "High-Performance Digital Engineering for Modern Businesses",
    "email": "kumarsrijal732@gmail.com",
    "phone": "+91 98765 43210",
    "whatsapp": "+91 98765 43210",
    "address": "Indiranagar 100ft Road, Bangalore, Karnataka 560038",
    "description": "VyapaarPro provides digital solutions and services for individuals, creators, startups, shops, businesses, and organizations. We build bespoke business websites, custom web applications, mobile apps, e-commerce systems, and full-spectrum digital branding to help enterprises scale sustainably.",
    "footer_text": "© 2026 VyapaarPro. All rights reserved. Every client solution is custom-engineered and deployed independently.",
    "social": {
      "twitter": "",
      "linkedin": "",
      "github": "",
      "instagram": ""
    },
    "developer": {
      "name": "SRIJAL KUMAR",
      "role": "Founder & Developer, VyapaarPro",
      "location": "BIHAR, INDIA",
      "bio": "Founder and software developer behind VyapaarPro. Dedicated to building practical, accessible, and high-performance digital solutions for clients ranging from creators and local shops to growing startups and businesses. Focused on direct collaboration, clean architecture, and transparent milestone delivery.",
      "focus": [
        "Web Development",
        "Android / App Development",
        "UI/UX Design",
        "Digital Products",
        "Custom Software Solutions"
      ],
      "avatar_url": "",
      "github": "",
      "instagram": "",
      "linkedin": "",
      "twitter": ""
    },
    "legal": {
      "governing_jurisdiction": "[Jurisdiction of Bihar / India]",
      "effective_date": "January 1, 2026",
      "last_updated": "September 2026",
      "legal_notice": "Notice: This legal text is an operational policy template. Please review and customize according to your specific registered entity and local regulations before public enforcement."
    }
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Categories (Valid hex UUID prefix c0000000-...)
INSERT INTO public.service_categories (id, name, slug, description, display_order)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Websites', 'websites', 'High-converting, responsive and ultra-fast business and brand websites.', 1),
  ('c0000000-0000-0000-0000-000000000002', 'Apps & Web Apps', 'apps', 'Modern scalable progressive web apps, Android apps and SaaS platforms.', 2),
  ('c0000000-0000-0000-0000-000000000003', 'E-Commerce', 'e-commerce', 'Online shopping stores, payment-ready architectures and digital catalogues.', 3),
  ('c0000000-0000-0000-0000-000000000004', 'Design & Branding', 'design-branding', 'Bespoke UI/UX interface design, vector identity, logos and creative assets.', 4),
  ('c0000000-0000-0000-0000-000000000005', 'Marketing & Growth', 'marketing-growth', 'Strategic SEO, Google Business Profiles, social creatives and performance marketing.', 5),
  ('c0000000-0000-0000-0000-000000000006', 'Business Solutions', 'business-solutions', 'Interactive QR menus, digital catalogs, CRM setups and workflow automation.', 6),
  ('c0000000-0000-0000-0000-000000000007', 'Technical Services', 'technical-services', 'Domain/cloud deployment, database engineering, bug fixing and API integrations.', 7),
  ('c0000000-0000-0000-0000-000000000008', 'Custom Solutions', 'custom-solutions', 'End-to-end proprietary software, microservices and enterprise digital transformation.', 8)
ON CONFLICT (slug) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- 3. Core Services (Valid hex UUID prefix a0000000-...)
INSERT INTO public.services (
  id, category_id, name, slug, short_description, description,
  pricing_model, price, currency, timeline, thumbnail_url, featured, published, demo_url, deliverables
) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Custom Business Website',
    'business-website',
    'Modern, mobile-first responsive corporate website designed to convert visitors into loyal clients.',
    'We engineer fast, secure, search-engine-optimized business websites tailored to your exact industry. Includes responsive mobile design, custom typography, inquiry capture, analytics integration, and blazingly fast load speeds.',
    'STARTING_FROM',
    14999.00,
    'INR',
    '7 - 14 Days',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["5 to 10 Custom Web Pages", "Mobile & Tablet Fully Responsive", "Contact & Lead Generation Form", "On-page SEO Optimization", "Fast CDN & SSL Setup Assistance", "1 Month Free Post-Launch Support"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000003',
    'Full-Featured E-Commerce Website',
    'ecommerce-website',
    'Scalable online store with product catalog, cart flows, inventory tracking, and discount engine.',
    'Turn your inventory into an automated 24/7 revenue driver. Complete storefront with product categories, customer accounts, order management, promo codes, and streamlined checkout experience.',
    'STARTING_FROM',
    29999.00,
    'INR',
    '14 - 25 Days',
    'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Product & Category Management", "Shopping Cart & Wishlist", "Admin Order & Inventory Dashboard", "Customer Accounts & Order History", "Coupon & Discount Management", "Shipping & Tax Rule Setup"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'Custom Web Application / SaaS MVP',
    'custom-web-application',
    'High-performance full-stack web application with role-based auth, dashboards, and custom database.',
    'Bring your software idea or proprietary business workflow to life with modern React/TypeScript frontend and scalable PostgreSQL backend. Includes authentication, user management, and custom APIs.',
    'STARTING_FROM',
    49999.00,
    'INR',
    '3 - 6 Weeks',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Role-Based Authentication", "Interactive Dashboards & Data Tables", "Custom Database Schema & Migrations", "RESTful / Graph API Integrations", "Security & Access Controls", "Full Source Code & Deployment Guide"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'Android & PWA Mobile Application',
    'android-pwa-application',
    'Native-feel Android app or installable Progressive Web App with offline support and push alerts.',
    'Reach your users directly on their home screens without high maintenance friction. We build lightweight, snappy Android applications and PWAs customized for your business service.',
    'STARTING_FROM',
    34999.00,
    'INR',
    '2 - 4 Weeks',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    false,
    true,
    NULL,
    '["Android APK & Bundle Ready", "Offline Caching & Fast Loading", "Push Notification Architecture", "Responsive Mobile-First UI", "Play Store Submission Guidance"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000004',
    'UI/UX Design & Interactive Prototypes',
    'ui-ux-design',
    'Pixel-perfect Figma designs, user journeys, design systems, and clickable high-fidelity prototypes.',
    'Validate your concept before writing code. We create modern visual identities, clean UI component libraries, wireframes, and interactive prototypes tailored for desktop and mobile.',
    'FIXED',
    12499.00,
    'INR',
    '5 - 10 Days',
    'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Complete Figma Source Files", "Responsive Mobile & Desktop Frames", "Design System & Color Tokens", "Interactive Prototype", "Developer Handoff Specs"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000004',
    'Logo, Identity & Brand Kit',
    'logo-branding',
    'Distinctive logo marks, typography pairings, brand guidelines, and social media media kits.',
    'Make your company unforgettable. We develop coherent brand identities that communicate credibility, innovation, and trust across print, digital, and promotional media.',
    'FIXED',
    7999.00,
    'INR',
    '3 - 5 Days',
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
    false,
    true,
    NULL,
    '["3 Original Logo Concepts", "Vector Formats (SVG, AI, EPS, PNG)", "Brand Style Guide & Font Rules", "Social Media Display Avatars", "Business Card & Letterhead Mockups"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000007',
    'c0000000-0000-0000-0000-000000000005',
    'Local SEO & Google Business Setup',
    'seo-google-business',
    'Dominate local Google searches, Google Maps ranking, keyword optimization, and review funnels.',
    'Get discovered by nearby customers ready to buy. We optimize your Google Business Profile, implement structured schema markup, and establish local search visibility.',
    'FIXED',
    9999.00,
    'INR',
    '5 - 7 Days',
    'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?auto=format&fit=crop&w=1200&q=80',
    false,
    true,
    NULL,
    '["Google Business Profile Verification & Optimization", "Geo-targeted Keyword Research", "Local Citation Building", "Google Maps Pin & Category Optimization", "Review Generation Strategy Guide"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000008',
    'c0000000-0000-0000-0000-000000000006',
    'Digital Menu & QR Business Catalog',
    'digital-menu-qr-solutions',
    'Instant contactless digital menus, product showcases, and dynamic QR table ordering systems.',
    'Perfect for restaurants, retail showrooms, manufacturers, and trade booths. Update items, prices, and photos instantly without reprinting physical brochures.',
    'STARTING_FROM',
    6499.00,
    'INR',
    '3 - 5 Days',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Mobile Web Digital Menu / Catalog", "Print-Ready Branded QR Code Placards", "Self-service Category & Pricing Admin", "Instant WhatsApp Order Trigger", "Fast Cloud Hosting Included"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000009',
    'c0000000-0000-0000-0000-000000000007',
    'Website Maintenance & Bug Fixing',
    'website-maintenance-bug-fixing',
    'Professional troubleshooting, speed optimization, malware removal, and continuous updates.',
    'Keep your mission-critical website operational, secure, and blazing fast. We diagnose errors, repair broken integrations, optimize database queries, and manage backups.',
    'STARTING_FROM',
    4999.00,
    'INR',
    '1 - 3 Days',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
    false,
    true,
    NULL,
    '["Root Cause Diagnostic Report", "Code & Script Error Resolution", "Performance & Core Web Vitals Boost", "Automated Daily Backups Setup", "SSL Certificate & Domain Health Audit"]'::jsonb
  ),
  (
    'a0000000-0000-0000-0000-000000000010',
    'c0000000-0000-0000-0000-000000000008',
    'Enterprise Custom Digital Transformation',
    'enterprise-custom-solutions',
    'Proprietary ERPs, inventory portals, multi-system API bridges, and high-load architectures.',
    'For complex business models requiring tailored software infrastructure. We work directly with your stakeholders to plan, architect, engineer, and deploy proprietary systems.',
    'CUSTOM_QUOTE',
    0.00,
    'INR',
    'Consultation Based',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    NULL,
    '["Dedicated Architecture Consultation", "Technical Specification & Scope Doc", "Enterprise Scalable Cloud Stack", "Milestone-Driven Phased Delivery", "SLA & Dedicated Engineering Team"]'::jsonb
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  short_description = EXCLUDED.short_description,
  description = EXCLUDED.description,
  pricing_model = EXCLUDED.pricing_model,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  timeline = EXCLUDED.timeline,
  thumbnail_url = EXCLUDED.thumbnail_url,
  featured = EXCLUDED.featured,
  published = EXCLUDED.published,
  demo_url = EXCLUDED.demo_url,
  deliverables = EXCLUDED.deliverables,
  updated_at = now();

-- 4. Service Features (Valid hex UUID prefix f0000000-...)
INSERT INTO public.service_features (id, service_id, title, description, display_order)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'High-Converting Layout', 'Strategic landing sections crafted to guide leads directly to phone and WhatsApp consultations.', 1),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Lightning Fast Performance', 'Optimized assets, WebP images, clean HTML5 and 90+ Google PageSpeed score.', 2),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Mobile-First Responsiveness', 'Pristine layout on smartphones, tablets, laptops, and ultra-wide screens.', 3),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Enterprise Security & SSL', 'Hardened headers, HTTPS encryption, spam-protected inquiry forms.', 4),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'Product Variations & SKUs', 'Manage colors, sizes, inventory levels, and custom product fields easily.', 1),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'Cart & Order Tracking', 'Seamless cart flows with real-time order updates and customer receipt notifications.', 2),
  ('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000002', 'Discounts & Coupon Codes', 'Create percentage or flat discounts, promo banners, and scheduled sales.', 3),
  ('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'Secure Role-Based Access', 'Granular client, staff, and admin security permissions backed by PostgreSQL.', 1),
  ('f0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003', 'Real-time Dashboards', 'Interactive charts, metrics, activity logs, and exportable CSV/PDF reports.', 2),
  ('f0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000003', 'Third-Party API Connections', 'Connect WhatsApp Business, SMS gateways, CRMs, and email providers smoothly.', 3)
ON CONFLICT (id) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- 5. Service FAQs (Valid hex UUID prefix e0000000-...)
INSERT INTO public.service_faqs (id, service_id, question, answer, display_order)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'How does the service request and payment process work?', 'After you click "Get Started" and submit your requirements, VyapaarPro contacts you via WhatsApp or phone within 4-12 hours. We review your scope, agree on deliverables, and handle invoice payments directly outside the website. No online checkout is needed.', 1),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Will I own the source code and domain name?', 'Yes, 100%. Once project milestones are completed and delivered, all custom source code, assets, and design files belong entirely to you.', 2),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Can I request additional custom features later?', 'Absolutely. VyapaarPro provides ongoing maintenance and iterative feature sprints as your business evolves.', 3),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'Do you integrate offline or manual payments into the e-commerce store?', 'Yes, we can configure cash-on-delivery, bank transfer instructions, WhatsApp ordering, or your chosen payment provider during the development phase.', 1),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'What technology stack do you build custom web apps with?', 'We primarily leverage React, TypeScript, Next.js, Node.js, and PostgreSQL for unmatched stability, speed, and long-term maintainability.', 1)
ON CONFLICT (id) DO UPDATE
SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  display_order = EXCLUDED.display_order;

-- 6. Portfolio Items (Valid hex UUID prefix b0000000-...)
INSERT INTO public.portfolio_items (
  id, title, slug, description, category, client_type, thumbnail_url, images, technologies, demo_url, published
) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'Apex Logistics & Freight Web Portal',
    'apex-logistics-portal',
    'Comprehensive corporate website and shipment quote engine for a pan-India freight aggregator. Increased qualified corporate leads by 180% within 60 days of rollout.',
    'Websites',
    'Supply Chain & B2B Logistics',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["React", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"]'::jsonb,
    NULL,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Kaveri Handlooms E-Commerce Store',
    'kaveri-handlooms-store',
    'Artisanal ethnic wear brand storefront featuring high-resolution swatch previews, currency switching, automated catalog management, and WhatsApp direct inquiries.',
    'E-Commerce',
    'D2C Fashion & Retail',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["React", "Tailwind CSS", "PostgreSQL", "Cloudflare CDN"]'::jsonb,
    NULL,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'PulseHealth Clinic SaaS & Patient Queue',
    'pulsehealth-clinic-saas',
    'Multi-doctor appointment scheduling, real-time token queue management, and digital prescription generation used daily across 14 diagnostic centers.',
    'Apps & Web Apps',
    'Healthcare & Diagnostics',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["React", "TypeScript", "PostgreSQL", "Tailwind CSS", "WebSockets"]'::jsonb,
    NULL,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'UrbanBites Restaurant QR Menu & Ordering',
    'urbanbites-qr-menu',
    'Dynamic bilingual contactless QR menu and kitchen display screen for a high-volume gastro-pub chain. Reduced order wait times by 35%.',
    'Business Solutions',
    'Hospitality & Dining',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    '["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"]'::jsonb,
    '["Progressive Web App", "React", "Tailwind CSS", "QR Engine"]'::jsonb,
    NULL,
    true
  )
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  client_type = EXCLUDED.client_type,
  thumbnail_url = EXCLUDED.thumbnail_url,
  images = EXCLUDED.images,
  technologies = EXCLUDED.technologies,
  demo_url = EXCLUDED.demo_url,
  published = EXCLUDED.published;
