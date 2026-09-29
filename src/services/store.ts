import {
  AgencySettings,
  DeveloperProfile,
  LegalConfig,
  ContactMessage,
  InternalPaymentStatus,
  PortfolioItem,
  ProjectItem,
  ProjectMilestone,
  RequestStatus,
  ServiceCategory,
  ServiceItem,
  ServiceRequest,
  UserProfile,
  NotificationItem,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Helper to generate reference numbers (e.g. VP-REQ-8F3A29B1)
export function generateReferenceCode(prefix: 'VP-REQ' | 'VP-PRJ' | 'VP-MSG'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}

const DEFAULT_DEVELOPER: DeveloperProfile = {
  name: 'SRIJAL KUMAR',
  role: 'Founder & Developer, VyapaarPro',
  location: 'BIHAR, INDIA',
  bio: 'Founder and software developer behind VyapaarPro. Dedicated to building practical, accessible, and high-performance digital solutions for clients ranging from creators and local shops to growing startups and businesses. Focused on direct collaboration, clean architecture, and transparent milestone delivery.',
  focus: [
    'Web Development',
    'Android / App Development',
    'UI/UX Design',
    'Digital Products',
    'Custom Software Solutions',
  ],
  avatar_url: '',
  github: '',
  instagram: '',
  linkedin: '',
  twitter: '',
};

const DEFAULT_LEGAL: LegalConfig = {
  governing_jurisdiction: '[Jurisdiction of Bihar / India]',
  effective_date: 'January 1, 2026',
  last_updated: 'September 2026',
  legal_notice: 'Notice: This legal text is an operational policy template. Please review and customize according to your specific registered entity and local regulations before public enforcement.',
};

const DEFAULT_SETTINGS: AgencySettings = {
  name: 'VyapaarPro',
  tagline: 'High-Performance Digital Engineering for Modern Businesses',
  email: 'kumarsrijal732@gmail.com',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  address: 'Indiranagar 100ft Road, Bangalore, Karnataka 560038',
  description:
    'VyapaarPro provides digital solutions and services for individuals, creators, startups, shops, businesses, and organizations. We build bespoke business websites, custom web applications, mobile apps, e-commerce systems, and full-spectrum digital branding to help enterprises scale sustainably.',
  footer_text:
    `© ${new Date().getFullYear()} VyapaarPro. All rights reserved. Every client solution is custom-engineered and deployed independently.`,
  logo_url: '',
  favicon_url: '',
  social: {
    twitter: '',
    linkedin: '',
    github: '',
    instagram: '',
  },
  developer: DEFAULT_DEVELOPER,
  legal: DEFAULT_LEGAL,
};

const DEFAULT_CATEGORIES: ServiceCategory[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Websites',
    slug: 'websites',
    description: 'High-converting, responsive and ultra-fast business and brand websites.',
    display_order: 1,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Apps & Web Apps',
    slug: 'apps',
    description: 'Modern scalable progressive web apps, Android apps and SaaS platforms.',
    display_order: 2,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    name: 'E-Commerce',
    slug: 'e-commerce',
    description: 'Online shopping stores, payment-ready architectures and digital catalogues.',
    display_order: 3,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    name: 'Design & Branding',
    slug: 'design-branding',
    description: 'Bespoke UI/UX interface design, vector identity, logos and creative assets.',
    display_order: 4,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    name: 'Marketing & Growth',
    slug: 'marketing-growth',
    description: 'Strategic SEO, Google Business Profiles, social creatives and performance marketing.',
    display_order: 5,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000006',
    name: 'Business Solutions',
    slug: 'business-solutions',
    description: 'Interactive QR menus, digital catalogs, CRM setups and workflow automation.',
    display_order: 6,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000007',
    name: 'Technical Services',
    slug: 'technical-services',
    description: 'Domain/cloud deployment, database engineering, bug fixing and API integrations.',
    display_order: 7,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000008',
    name: 'Custom Solutions',
    slug: 'custom-solutions',
    description: 'End-to-end proprietary software, microservices and enterprise digital transformation.',
    display_order: 8,
  },
];

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    category_name: 'Websites',
    name: 'Custom Business Website',
    slug: 'business-website',
    short_description: 'Modern, mobile-first responsive corporate website designed to convert visitors into loyal clients.',
    description:
      'We engineer fast, secure, search-engine-optimized business websites tailored to your exact industry. Includes responsive mobile design, custom typography, inquiry capture, analytics integration, and blazingly fast load speeds.',
    pricing_model: 'STARTING_FROM',
    price: 14999,
    currency: 'INR',
    timeline: '7 - 14 Days',
    thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    published: true,
    deliverables: [
      '5 to 10 Custom Web Pages',
      'Mobile & Tablet Fully Responsive',
      'Contact & Lead Generation Form',
      'On-page SEO Optimization',
      'Fast CDN & SSL Setup Assistance',
      '1 Month Free Post-Launch Support',
    ],
    features: [
      { id: 'f1', service_id: 's1', title: 'High-Converting Layout', description: 'Strategic landing sections crafted to guide leads directly to phone and WhatsApp consultations.', display_order: 1 },
      { id: 'f2', service_id: 's1', title: 'Lightning Fast Performance', description: 'Optimized assets, WebP images, clean HTML5 and 90+ Google PageSpeed score.', display_order: 2 },
      { id: 'f3', service_id: 's1', title: 'Mobile-First Responsiveness', description: 'Pristine layout on smartphones, tablets, laptops, and ultra-wide screens.', display_order: 3 },
      { id: 'f4', service_id: 's1', title: 'Enterprise Security & SSL', description: 'Hardened headers, HTTPS encryption, spam-protected inquiry forms.', display_order: 4 },
    ],
    faqs: [
      { id: 'faq1', service_id: 's1', question: 'How does the service request and payment process work?', answer: 'After you click "Get Started" and submit your requirements, VyapaarPro contacts you via WhatsApp or phone within 4-12 hours. We review your scope, agree on deliverables, and handle invoice payments directly outside the website. No online checkout is needed.', display_order: 1 },
      { id: 'faq2', service_id: 's1', question: 'Will I own the source code and domain name?', answer: 'Yes, 100%. Once project milestones are completed and delivered, all custom source code, assets, and design files belong entirely to you.', display_order: 2 },
      { id: 'faq3', service_id: 's1', question: 'Can I request additional custom features later?', answer: 'Absolutely. VyapaarPro provides ongoing maintenance and iterative feature sprints as your business evolves.', display_order: 3 },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    category_name: 'E-Commerce',
    name: 'Full-Featured E-Commerce Website',
    slug: 'ecommerce-website',
    short_description: 'Scalable online store with product catalog, cart flows, inventory tracking, and discount engine.',
    description:
      'Turn your inventory into an automated 24/7 revenue driver. Complete storefront with product categories, customer accounts, order management, promo codes, and streamlined checkout experience.',
    pricing_model: 'STARTING_FROM',
    price: 29999,
    currency: 'INR',
    timeline: '14 - 25 Days',
    thumbnail_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    published: true,
    deliverables: [
      'Product & Category Management',
      'Shopping Cart & Wishlist',
      'Admin Order & Inventory Dashboard',
      'Customer Accounts & Order History',
      'Coupon & Discount Management',
      'Shipping & Tax Rule Setup',
    ],
    features: [
      { id: 'f21', service_id: 's2', title: 'Product Variations & SKUs', description: 'Manage colors, sizes, inventory levels, and custom product fields easily.', display_order: 1 },
      { id: 'f22', service_id: 's2', title: 'Cart & Order Tracking', description: 'Seamless cart flows with real-time order updates and customer receipt notifications.', display_order: 2 },
      { id: 'f23', service_id: 's2', title: 'Discounts & Coupon Codes', description: 'Create percentage or flat discounts, promo banners, and scheduled sales.', display_order: 3 },
    ],
    faqs: [
      { id: 'faq21', service_id: 's2', question: 'Do you integrate offline or manual payments into the e-commerce store?', answer: 'Yes, we can configure cash-on-delivery, bank transfer instructions, WhatsApp ordering, or your chosen payment provider during the development phase.', display_order: 1 },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    category_name: 'Apps & Web Apps',
    name: 'Custom Web Application / SaaS MVP',
    slug: 'custom-web-application',
    short_description: 'High-performance full-stack web application with role-based auth, dashboards, and custom database.',
    description:
      'Bring your software idea or proprietary business workflow to life with modern React/TypeScript frontend and scalable PostgreSQL backend. Includes authentication, user management, and custom APIs.',
    pricing_model: 'STARTING_FROM',
    price: 49999,
    currency: 'INR',
    timeline: '3 - 6 Weeks',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    published: true,
    deliverables: [
      'Role-Based Authentication',
      'Interactive Dashboards & Data Tables',
      'Custom Database Schema & Migrations',
      'RESTful / Graph API Integrations',
      'Security & Access Controls',
      'Full Source Code & Deployment Guide',
    ],
    features: [
      { id: 'f31', service_id: 's3', title: 'Secure Role-Based Access', description: 'Granular client, staff, and admin security permissions backed by PostgreSQL.', display_order: 1 },
      { id: 'f32', service_id: 's3', title: 'Real-time Dashboards', description: 'Interactive charts, metrics, activity logs, and exportable CSV/PDF reports.', display_order: 2 },
      { id: 'f33', service_id: 's3', title: 'Third-Party API Connections', description: 'Connect WhatsApp Business, SMS gateways, CRMs, and email providers smoothly.', display_order: 3 },
    ],
    faqs: [
      { id: 'faq31', service_id: 's3', question: 'What technology stack do you build custom web apps with?', answer: 'We primarily leverage React, TypeScript, Next.js, Node.js, and PostgreSQL for unmatched stability, speed, and long-term maintainability.', display_order: 1 },
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000004',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    category_name: 'Apps & Web Apps',
    name: 'Android & PWA Mobile Application',
    slug: 'android-pwa-application',
    short_description: 'Native-feel Android app or installable Progressive Web App with offline support and push alerts.',
    description:
      'Reach your users directly on their home screens without high maintenance friction. We build lightweight, snappy Android applications and PWAs customized for your business service.',
    pricing_model: 'STARTING_FROM',
    price: 34999,
    currency: 'INR',
    timeline: '2 - 4 Weeks',
    thumbnail_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    published: true,
    deliverables: [
      'Android APK & Bundle Ready',
      'Offline Caching & Fast Loading',
      'Push Notification Architecture',
      'Responsive Mobile-First UI',
      'Play Store Submission Guidance',
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000005',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    category_name: 'Design & Branding',
    name: 'UI/UX Design & Interactive Prototypes',
    slug: 'ui-ux-design',
    short_description: 'Pixel-perfect Figma designs, user journeys, design systems, and clickable high-fidelity prototypes.',
    description:
      'Validate your concept before writing code. We create modern visual identities, clean UI component libraries, wireframes, and interactive prototypes tailored for desktop and mobile.',
    pricing_model: 'FIXED',
    price: 12499,
    currency: 'INR',
    timeline: '5 - 10 Days',
    thumbnail_url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    published: true,
    deliverables: [
      'Complete Figma Source Files',
      'Responsive Mobile & Desktop Frames',
      'Design System & Color Tokens',
      'Interactive Prototype',
      'Developer Handoff Specs',
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000006',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    category_name: 'Design & Branding',
    name: 'Logo, Identity & Brand Kit',
    slug: 'logo-branding',
    short_description: 'Distinctive logo marks, typography pairings, brand guidelines, and social media media kits.',
    description:
      'Make your company unforgettable. We develop coherent brand identities that communicate credibility, innovation, and trust across print, digital, and promotional media.',
    pricing_model: 'FIXED',
    price: 7999,
    currency: 'INR',
    timeline: '3 - 5 Days',
    thumbnail_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    published: true,
    deliverables: [
      '3 Original Logo Concepts',
      'Vector Formats (SVG, AI, EPS, PNG)',
      'Brand Style Guide & Font Rules',
      'Social Media Display Avatars',
      'Business Card & Letterhead Mockups',
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000007',
    category_id: 'c0000000-0000-0000-0000-000000000005',
    category_name: 'Marketing & Growth',
    name: 'Local SEO & Google Business Setup',
    slug: 'seo-google-business',
    short_description: 'Dominate local Google searches, Google Maps ranking, keyword optimization, and review funnels.',
    description:
      'Get discovered by nearby customers ready to buy. We optimize your Google Business Profile, implement structured schema markup, and establish local search visibility.',
    pricing_model: 'FIXED',
    price: 9999,
    currency: 'INR',
    timeline: '5 - 7 Days',
    thumbnail_url: 'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    published: true,
    deliverables: [
      'Google Business Profile Verification & Optimization',
      'Geo-targeted Keyword Research',
      'Local Citation Building',
      'Google Maps Pin & Category Optimization',
      'Review Generation Strategy Guide',
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000008',
    category_id: 'c0000000-0000-0000-0000-000000000006',
    category_name: 'Business Solutions',
    name: 'Digital Menu & QR Business Catalog',
    slug: 'digital-menu-qr-solutions',
    short_description: 'Instant contactless digital menus, product showcases, and dynamic QR table ordering systems.',
    description:
      'Perfect for restaurants, retail showrooms, manufacturers, and trade booths. Update items, prices, and photos instantly without reprinting physical brochures.',
    pricing_model: 'STARTING_FROM',
    price: 6499,
    currency: 'INR',
    timeline: '3 - 5 Days',
    thumbnail_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    published: true,
    deliverables: [
      'Mobile Web Digital Menu / Catalog',
      'Print-Ready Branded QR Code Placards',
      'Self-service Category & Pricing Admin',
      'Instant WhatsApp Order Trigger',
      'Fast Cloud Hosting Included',
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000009',
    category_id: 'c0000000-0000-0000-0000-000000000007',
    category_name: 'Technical Services',
    name: 'Website Maintenance & Bug Fixing',
    slug: 'website-maintenance-bug-fixing',
    short_description: 'Professional troubleshooting, speed optimization, malware removal, and continuous updates.',
    description:
      'Keep your mission-critical website operational, secure, and blazing fast. We diagnose errors, repair broken integrations, optimize database queries, and manage backups.',
    pricing_model: 'STARTING_FROM',
    price: 4999,
    currency: 'INR',
    timeline: '1 - 3 Days',
    thumbnail_url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1200&q=80',
    featured: false,
    published: true,
    deliverables: [
      'Root Cause Diagnostic Report',
      'Code & Script Error Resolution',
      'Performance & Core Web Vitals Boost',
      'Automated Daily Backups Setup',
      'SSL Certificate & Domain Health Audit',
    ],
  },
  {
    id: 'a0000000-0000-0000-0000-000000000010',
    category_id: 'c0000000-0000-0000-0000-000000000008',
    category_name: 'Custom Solutions',
    name: 'Enterprise Custom Digital Transformation',
    slug: 'enterprise-custom-solutions',
    short_description: 'Proprietary ERPs, inventory portals, multi-system API bridges, and high-load architectures.',
    description:
      'For complex business models requiring tailored software infrastructure. We work directly with your stakeholders to plan, architect, engineer, and deploy proprietary systems.',
    pricing_model: 'CUSTOM_QUOTE',
    price: 0,
    currency: 'INR',
    timeline: 'Consultation Based',
    thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    featured: true,
    published: true,
    deliverables: [
      'Dedicated Architecture Consultation',
      'Technical Specification & Scope Doc',
      'Enterprise Scalable Cloud Stack',
      'Milestone-Driven Phased Delivery',
      'SLA & Dedicated Engineering Team',
    ],
  },
];

const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Apex Logistics & Freight Web Portal',
    slug: 'apex-logistics-portal',
    description:
      'Comprehensive corporate website and shipment quote engine for a pan-India freight aggregator. Increased qualified corporate leads by 180% within 60 days of rollout.',
    category: 'Websites',
    client_type: 'Supply Chain & B2B Logistics',
    thumbnail_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80',
    ],
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
    published: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    title: 'Kaveri Handlooms E-Commerce Store',
    slug: 'kaveri-handlooms-store',
    description:
      'Artisanal ethnic wear brand storefront featuring high-resolution swatch previews, currency switching, automated catalog management, and WhatsApp direct inquiries.',
    category: 'E-Commerce',
    client_type: 'D2C Fashion & Retail',
    thumbnail_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80',
    ],
    technologies: ['React', 'Tailwind CSS', 'PostgreSQL', 'Cloudflare CDN'],
    published: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    title: 'PulseHealth Clinic SaaS & Patient Queue',
    slug: 'pulsehealth-clinic-saas',
    description:
      'Multi-doctor appointment scheduling, real-time token queue management, and digital prescription generation used daily across 14 diagnostic centers.',
    category: 'Apps & Web Apps',
    client_type: 'Healthcare & Diagnostics',
    thumbnail_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    ],
    technologies: ['React', 'TypeScript', 'PostgreSQL', 'Tailwind CSS', 'WebSockets'],
    published: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    title: 'UrbanBites Restaurant QR Menu & Ordering',
    slug: 'urbanbites-qr-menu',
    description:
      'Dynamic bilingual contactless QR menu and kitchen display screen for a high-volume gastro-pub chain. Reduced order wait times by 35%.',
    category: 'Business Solutions',
    client_type: 'Hospitality & Dining',
    thumbnail_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    ],
    technologies: ['Progressive Web App', 'React', 'Tailwind CSS', 'QR Engine'],
    published: true,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

// Production lists: no fake demo accounts or dummy inquiries
const INITIAL_CLIENTS: UserProfile[] = [];
const INITIAL_REQUESTS: ServiceRequest[] = [];
const INITIAL_PROJECTS: ProjectItem[] = [];
const INITIAL_MESSAGES: ContactMessage[] = [];

// Local Storage Keys
const STORAGE_KEYS = {
  SETTINGS: 'vp_settings_v1',
  CATEGORIES: 'vp_categories_v1',
  SERVICES: 'vp_services_v1',
  REQUESTS: 'vp_requests_v1',
  PROJECTS: 'vp_projects_v1',
  PORTFOLIO: 'vp_portfolio_v1',
  MESSAGES: 'vp_messages_v1',
  CLIENTS: 'vp_clients_v1',
  NOTIFICATIONS: 'vp_notifications_v1',
};

// Automatic cleanup of legacy demo records in client browser storage
if (typeof window !== 'undefined') {
  try {
    const clientsRaw = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (clientsRaw && clientsRaw.includes('u-client-01')) {
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
    }
    const requestsRaw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (requestsRaw && requestsRaw.includes('VP-REQ-A9B28D14')) {
      localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    }
    const projectsRaw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (projectsRaw && projectsRaw.includes('VP-PRJ-7F10E290')) {
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    }
    const messagesRaw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (messagesRaw && messagesRaw.includes('VP-MSG-88B12C4F')) {
      localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    }
    const authRaw = localStorage.getItem('vp_current_user_v1');
    if (authRaw && (authRaw.includes('u-client-01') || authRaw.includes('u-client-02') || authRaw.includes('u-client-03') || authRaw.includes('demo-'))) {
      localStorage.removeItem('vp_current_user_v1');
    }
    const settingsRaw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (settingsRaw) {
      const parsed = JSON.parse(settingsRaw);
      if (parsed.email === 'contact@vyapaarpro.com') {
        parsed.email = 'kumarsrijal732@gmail.com';
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      }
    }
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
}

// Safe JSON local storage helpers with in-memory fallback for restricted/in-app browsers
const memoryStorage = new Map<string, string>();

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    // In-app browsers / private mode can throw SecurityError
  }
  return memoryStorage.get(key) || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }
  } catch (e) {
    // QuotaExceededError or SecurityError in restricted WebViews
  }
  memoryStorage.set(key, value);
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }
  } catch (e) {
    // Ignore
  }
  memoryStorage.delete(key);
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = safeGetItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T): void {
  try {
    safeSetItem(key, JSON.stringify(data));
  } catch (err) {
    // Ignore storage serialization errors
  }
}

// Ensure default seeds exist in storage on first load
function initializeLocalStorage() {
  try {
    if (!safeGetItem(STORAGE_KEYS.SETTINGS)) {
      writeStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    if (!safeGetItem(STORAGE_KEYS.CATEGORIES)) {
      writeStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }
    if (!safeGetItem(STORAGE_KEYS.SERVICES)) {
      writeStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
    }
    if (!safeGetItem(STORAGE_KEYS.REQUESTS)) {
      writeStorage(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    }
    if (!safeGetItem(STORAGE_KEYS.PROJECTS)) {
      writeStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    }
    if (!safeGetItem(STORAGE_KEYS.PORTFOLIO)) {
      writeStorage(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    }
    if (!safeGetItem(STORAGE_KEYS.MESSAGES)) {
      writeStorage(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    }
    if (!safeGetItem(STORAGE_KEYS.CLIENTS)) {
      writeStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    }
    if (!safeGetItem(STORAGE_KEYS.NOTIFICATIONS)) {
      writeStorage(STORAGE_KEYS.NOTIFICATIONS, []);
    }
  } catch (e) {
    // Non-blocking in restricted in-app browser contexts
  }
}

// Run initial hydration
initializeLocalStorage();

// ==============================================================================
// UNIFIED DATA SERVICE
// ==============================================================================
export const dataService = {
  // SETTINGS
  async getSettings(): Promise<AgencySettings> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'agency_profile')
          .maybeSingle();
        if (!error && data?.value) {
          const merged: AgencySettings = {
            ...DEFAULT_SETTINGS,
            ...data.value,
            developer: { ...DEFAULT_DEVELOPER, ...(data.value.developer || {}) },
            legal: { ...DEFAULT_LEGAL, ...(data.value.legal || {}) },
            social: { ...DEFAULT_SETTINGS.social, ...(data.value.social || {}) },
          };
          writeStorage(STORAGE_KEYS.SETTINGS, merged);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase settings query fallback:', err);
      }
    }
    const raw = readStorage<AgencySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return {
      ...DEFAULT_SETTINGS,
      ...raw,
      developer: { ...DEFAULT_DEVELOPER, ...(raw.developer || {}) },
      legal: { ...DEFAULT_LEGAL, ...(raw.legal || {}) },
      social: { ...DEFAULT_SETTINGS.social, ...(raw.social || {}) },
    };
  },

  async saveSettings(settings: AgencySettings): Promise<{ success: boolean; error?: string }> {
    writeStorage(STORAGE_KEYS.SETTINGS, settings);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vp_settings_updated', { detail: settings }));
    }
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          const { error } = await supabase
            .from('settings')
            .upsert(
              { key: 'agency_profile', value: settings, updated_at: new Date().toISOString() },
              { onConflict: 'key' }
            );
          if (error) {
            console.warn('Supabase remote saveSettings notice:', error.message);
            return {
              success: true, // Saved locally and active in app
              error: `Saved in browser. Note: Supabase returned (${error.message}). Make sure to run the latest migration in Supabase SQL Editor.`,
            };
          }
        }
      } catch (err: any) {
        console.warn('Supabase saveSettings network/auth notice:', err);
      }
    }
    return { success: true };
  },

  // CATEGORIES
  async getCategories(): Promise<ServiceCategory[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('service_categories')
          .select('*')
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) {
          return data as ServiceCategory[];
        }
      } catch (err) {
        console.warn('Supabase categories fallback:', err);
      }
    }
    return readStorage<ServiceCategory[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  },

  async saveCategory(category: Partial<ServiceCategory>): Promise<ServiceCategory> {
    const categories = readStorage<ServiceCategory[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    let updated: ServiceCategory;
    if (category.id) {
      const idx = categories.findIndex((c) => c.id === category.id);
      if (idx !== -1) {
        categories[idx] = { ...categories[idx], ...category } as ServiceCategory;
        updated = categories[idx];
      } else {
        updated = {
          id: category.id,
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          display_order: category.display_order ?? categories.length + 1,
        };
        categories.push(updated);
      }
    } else {
      updated = {
        id: 'cat-' + Math.random().toString(36).substring(2, 9),
        name: category.name || '',
        slug: category.slug || (category.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: category.description || '',
        display_order: category.display_order ?? categories.length + 1,
      };
      categories.push(updated);
    }
    writeStorage(STORAGE_KEYS.CATEGORIES, categories);
    return updated;
  },

  // SERVICES
  async getServices(filterPublishedOnly = true): Promise<ServiceItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('services').select(`
          *,
          category:service_categories(name),
          features:service_features(*),
          faqs:service_faqs(*)
        `);
        if (filterPublishedOnly) {
          query = query.eq('published', true);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((item: any) => ({
            ...item,
            category_name: item.category?.name || 'General',
          })) as ServiceItem[];
        }
      } catch (err) {
        console.warn('Supabase getServices fallback:', err);
      }
    }
    const all = readStorage<ServiceItem[]>(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
    if (filterPublishedOnly) {
      return all.filter((s) => s.published);
    }
    return all;
  },

  async getServiceBySlug(slug: string): Promise<ServiceItem | null> {
    const services = await this.getServices(false);
    return services.find((s) => s.slug === slug) || null;
  },

  async getServiceById(id: string): Promise<ServiceItem | null> {
    const services = await this.getServices(false);
    return services.find((s) => s.id === id) || null;
  },

  async saveService(serviceData: Partial<ServiceItem>): Promise<ServiceItem> {
    const services = readStorage<ServiceItem[]>(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
    let saved: ServiceItem;
    if (serviceData.id) {
      const idx = services.findIndex((s) => s.id === serviceData.id);
      if (idx !== -1) {
        services[idx] = {
          ...services[idx],
          ...serviceData,
          updated_at: new Date().toISOString(),
        } as ServiceItem;
        saved = services[idx];
      } else {
        saved = {
          ...serviceData,
          id: serviceData.id,
          created_at: new Date().toISOString(),
        } as ServiceItem;
        services.unshift(saved);
      }
    } else {
      saved = {
        ...serviceData,
        id: 's-' + Math.random().toString(36).substring(2, 10),
        currency: 'INR',
        published: serviceData.published ?? true,
        featured: serviceData.featured ?? false,
        deliverables: serviceData.deliverables || [],
        created_at: new Date().toISOString(),
      } as ServiceItem;
      services.unshift(saved);
    }
    writeStorage(STORAGE_KEYS.SERVICES, services);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('services').upsert({
          id: saved.id,
          category_id: saved.category_id,
          name: saved.name,
          slug: saved.slug,
          short_description: saved.short_description,
          description: saved.description,
          pricing_model: saved.pricing_model,
          price: saved.price,
          currency: saved.currency,
          timeline: saved.timeline,
          thumbnail_url: saved.thumbnail_url,
          featured: saved.featured,
          published: saved.published,
          demo_url: saved.demo_url,
          deliverables: saved.deliverables,
        });
      } catch (err) {
        console.error('Supabase saveService error:', err);
      }
    }

    return saved;
  },

  async deleteService(id: string): Promise<boolean> {
    const services = readStorage<ServiceItem[]>(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES);
    const filtered = services.filter((s) => s.id !== id);
    writeStorage(STORAGE_KEYS.SERVICES, filtered);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('services').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteService error:', err);
      }
    }
    return true;
  },

  // SERVICE REQUESTS (LEADS & ESTIMATES)
  async getRequests(userId?: string): Promise<ServiceRequest[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('service_requests').select('*').order('created_at', { ascending: false });
        if (userId) {
          query = query.eq('user_id', userId);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data as ServiceRequest[];
        }
      } catch (err) {
        console.warn('Supabase getRequests fallback:', err);
      }
    }
    const all = readStorage<ServiceRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    if (userId) {
      return all.filter((r) => r.user_id === userId);
    }
    return all;
  },

  async getRequestById(id: string, userId?: string): Promise<ServiceRequest | null> {
    const requests = await this.getRequests();
    const req = requests.find((r) => r.id === id || r.reference_code === id);
    if (!req) return null;
    // Security check: if userId specified and user is not admin, ensure ownership
    if (userId && req.user_id && req.user_id !== userId) {
      return null;
    }
    return req;
  },

  async createRequest(
    data: Omit<ServiceRequest, 'id' | 'reference_code' | 'created_at' | 'status' | 'payment_status'>
  ): Promise<ServiceRequest> {
    const reference_code = generateReferenceCode('VP-REQ');
    const newRequest: ServiceRequest = {
      ...data,
      id: 'req-' + Math.random().toString(36).substring(2, 10),
      reference_code,
      status: 'New',
      payment_status: 'Not Discussed',
      created_at: new Date().toISOString(),
    };

    const requests = readStorage<ServiceRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    requests.unshift(newRequest);
    writeStorage(STORAGE_KEYS.REQUESTS, requests);

    // If client email matches or is logged in, link or record client in client list
    const clients = readStorage<UserProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    const existingClient = clients.find((c) => c.email.toLowerCase() === data.client_email.toLowerCase());
    if (!existingClient && !data.user_id) {
      // Add as tracked prospect client
      clients.push({
        id: 'client-' + Math.random().toString(36).substring(2, 10),
        email: data.client_email,
        full_name: data.client_name,
        phone: data.client_phone,
        company_name: data.business_name || '',
        role: 'customer',
        created_at: new Date().toISOString(),
      });
      writeStorage(STORAGE_KEYS.CLIENTS, clients);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('service_requests').insert({
          reference_code: newRequest.reference_code,
          user_id: newRequest.user_id,
          service_id: newRequest.service_id,
          service_name: newRequest.service_name,
          client_name: newRequest.client_name,
          client_email: newRequest.client_email,
          client_phone: newRequest.client_phone,
          business_name: newRequest.business_name,
          requirements: newRequest.requirements,
          budget_range: newRequest.budget_range,
          preferred_contact_method: newRequest.preferred_contact_method,
          reference_links: newRequest.reference_links,
          status: newRequest.status,
          payment_status: newRequest.payment_status,
        });
      } catch (err) {
        console.error('Supabase createRequest error:', err);
      }
    }

    return newRequest;
  },

  async updateRequestStatus(
    id: string,
    status: RequestStatus,
    internal_notes?: string,
    payment_status?: InternalPaymentStatus
  ): Promise<boolean> {
    const requests = readStorage<ServiceRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_REQUESTS);
    const idx = requests.findIndex((r) => r.id === id);
    if (idx !== -1) {
      requests[idx].status = status;
      if (internal_notes !== undefined) {
        requests[idx].internal_notes = internal_notes;
      }
      if (payment_status !== undefined) {
        requests[idx].payment_status = payment_status;
      }
      requests[idx].updated_at = new Date().toISOString();
      writeStorage(STORAGE_KEYS.REQUESTS, requests);

      // Create notification for client if request is assigned to user
      if (requests[idx].user_id) {
        this.createNotification(
          requests[idx].user_id!,
          `Request Update: ${requests[idx].reference_code}`,
          `Status changed to: ${status}`,
          `/app/requests/${requests[idx].id}`
        );
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const payload: any = { status, updated_at: new Date().toISOString() };
        if (internal_notes !== undefined) payload.internal_notes = internal_notes;
        if (payment_status !== undefined) payload.payment_status = payment_status;
        await supabase.from('service_requests').update(payload).eq('id', id);
      } catch (err) {
        console.error('Supabase updateRequestStatus error:', err);
      }
    }

    return true;
  },

  // PROJECTS
  async getProjects(clientId?: string): Promise<ProjectItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('projects').select(`
          *,
          milestones:project_milestones(*),
          updates:project_updates(*),
          deliverables:project_deliverables(*)
        `).order('created_at', { ascending: false });
        if (clientId) {
          query = query.eq('client_id', clientId);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data as ProjectItem[];
        }
      } catch (err) {
        console.warn('Supabase getProjects fallback:', err);
      }
    }
    const all = readStorage<ProjectItem[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    if (clientId) {
      return all.filter((p) => p.client_id === clientId);
    }
    return all;
  },

  async getProjectById(id: string, clientId?: string): Promise<ProjectItem | null> {
    const projects = await this.getProjects();
    const prj = projects.find((p) => p.id === id || p.reference_code === id);
    if (!prj) return null;
    if (clientId && prj.client_id && prj.client_id !== clientId) {
      return null;
    }
    return prj;
  },

  async createProject(data: Partial<ProjectItem>): Promise<ProjectItem> {
    const reference_code = generateReferenceCode('VP-PRJ');
    const newProject: ProjectItem = {
      id: 'prj-' + Math.random().toString(36).substring(2, 10),
      reference_code,
      client_id: data.client_id || null,
      client_name: data.client_name || 'Client',
      client_email: data.client_email || '',
      request_id: data.request_id || null,
      service_id: data.service_id || null,
      title: data.title || 'Untitled Project',
      description: data.description || '',
      status: data.status || 'Planning',
      progress_percentage: data.progress_percentage ?? 10,
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      expected_completion: data.expected_completion,
      notes: data.notes || '',
      internal_payment_status: data.internal_payment_status || 'Not Discussed',
      milestones: data.milestones || [
        {
          id: 'm-' + Math.random().toString(36).substring(2, 7),
          project_id: 'new',
          title: 'Requirement Finalization',
          description: 'Scope and technical architecture review.',
          status: 'In Progress',
          display_order: 1,
        },
        {
          id: 'm-' + Math.random().toString(36).substring(2, 7),
          project_id: 'new',
          title: 'UI Design & Wireframing',
          description: 'Design mockups and typography approval.',
          status: 'Pending',
          display_order: 2,
        },
        {
          id: 'm-' + Math.random().toString(36).substring(2, 7),
          project_id: 'new',
          title: 'Full-Stack Development',
          description: 'Frontend components, backend database, and business logic.',
          status: 'Pending',
          display_order: 3,
        },
        {
          id: 'm-' + Math.random().toString(36).substring(2, 7),
          project_id: 'new',
          title: 'QA Testing & Security Audit',
          description: 'Cross-device verification, speed checks, and security review.',
          status: 'Pending',
          display_order: 4,
        },
        {
          id: 'm-' + Math.random().toString(36).substring(2, 7),
          project_id: 'new',
          title: 'Production Deployment & Handoff',
          description: 'Live DNS pointing, documentation, and source code transfer.',
          status: 'Pending',
          display_order: 5,
        },
      ],
      updates: [
        {
          id: 'up-init',
          project_id: 'new',
          title: 'Project Initialized',
          message: 'Project workspace created by VyapaarPro engineering team.',
          created_at: new Date().toISOString(),
        },
      ],
      deliverables: [],
      created_at: new Date().toISOString(),
    };

    const projects = readStorage<ProjectItem[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    projects.unshift(newProject);
    writeStorage(STORAGE_KEYS.PROJECTS, projects);

    if (newProject.client_id) {
      this.createNotification(
        newProject.client_id,
        `New Project Launched: ${newProject.title}`,
        `Your dedicated project workspace has been created with code ${newProject.reference_code}.`,
        `/app/projects/${newProject.id}`
      );
    }

    return newProject;
  },

  async updateProject(id: string, updates: Partial<ProjectItem>): Promise<boolean> {
    const projects = readStorage<ProjectItem[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const idx = projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      projects[idx] = {
        ...projects[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      writeStorage(STORAGE_KEYS.PROJECTS, projects);
      return true;
    }
    return false;
  },

  async addProjectMilestone(
    projectId: string,
    milestone: Omit<ProjectMilestone, 'id' | 'project_id' | 'created_at'>
  ): Promise<ProjectMilestone> {
    const projects = readStorage<ProjectItem[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const idx = projects.findIndex((p) => p.id === projectId);
    const newM: ProjectMilestone = {
      ...milestone,
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      project_id: projectId,
      created_at: new Date().toISOString(),
    };
    if (idx !== -1) {
      if (!projects[idx].milestones) projects[idx].milestones = [];
      projects[idx].milestones!.push(newM);
      writeStorage(STORAGE_KEYS.PROJECTS, projects);
    }
    return newM;
  },

  async updateProjectMilestone(projectId: string, milestoneId: string, updates: Partial<ProjectMilestone>): Promise<boolean> {
    const projects = readStorage<ProjectItem[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const pIdx = projects.findIndex((p) => p.id === projectId);
    if (pIdx !== -1 && projects[pIdx].milestones) {
      const mIdx = projects[pIdx].milestones!.findIndex((m) => m.id === milestoneId);
      if (mIdx !== -1) {
        projects[pIdx].milestones![mIdx] = {
          ...projects[pIdx].milestones![mIdx],
          ...updates,
          completed_date: updates.status === 'Completed' ? new Date().toISOString().split('T')[0] : projects[pIdx].milestones![mIdx].completed_date,
        };
        // Auto-recalculate progress % based on completed milestones
        const total = projects[pIdx].milestones!.length;
        const completed = projects[pIdx].milestones!.filter((m) => m.status === 'Completed').length;
        if (total > 0) {
          projects[pIdx].progress_percentage = Math.round((completed / total) * 100);
        }
        writeStorage(STORAGE_KEYS.PROJECTS, projects);
        return true;
      }
    }
    return false;
  },

  async addProjectUpdate(projectId: string, title: string, message: string): Promise<boolean> {
    const projects = readStorage<ProjectItem[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx !== -1) {
      if (!projects[idx].updates) projects[idx].updates = [];
      const newUp = {
        id: 'up-' + Math.random().toString(36).substring(2, 9),
        project_id: projectId,
        title,
        message,
        created_at: new Date().toISOString(),
      };
      projects[idx].updates!.unshift(newUp);
      writeStorage(STORAGE_KEYS.PROJECTS, projects);

      if (projects[idx].client_id) {
        this.createNotification(
          projects[idx].client_id!,
          `Project Update: ${title}`,
          message,
          `/app/projects/${projectId}`
        );
      }
      return true;
    }
    return false;
  },

  async addProjectDeliverable(projectId: string, title: string, url: string, description?: string): Promise<boolean> {
    const projects = readStorage<ProjectItem[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const idx = projects.findIndex((p) => p.id === projectId);
    if (idx !== -1) {
      if (!projects[idx].deliverables) projects[idx].deliverables = [];
      const newDel = {
        id: 'del-' + Math.random().toString(36).substring(2, 9),
        project_id: projectId,
        title,
        url,
        description,
        created_at: new Date().toISOString(),
      };
      projects[idx].deliverables!.unshift(newDel);
      writeStorage(STORAGE_KEYS.PROJECTS, projects);
      return true;
    }
    return false;
  },

  // PORTFOLIO
  async getPortfolio(filterPublishedOnly = true): Promise<PortfolioItem[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('portfolio_items').select('*').order('created_at', { ascending: false });
        if (filterPublishedOnly) query = query.eq('published', true);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as PortfolioItem[];
      } catch (err) {
        console.warn('Supabase portfolio fallback:', err);
      }
    }
    const all = readStorage<PortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    if (filterPublishedOnly) return all.filter((p) => p.published);
    return all;
  },

  async getPortfolioBySlug(slug: string): Promise<PortfolioItem | null> {
    const items = await this.getPortfolio(false);
    return items.find((p) => p.slug === slug) || null;
  },

  async savePortfolio(item: Partial<PortfolioItem>): Promise<PortfolioItem> {
    const list = readStorage<PortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    let saved: PortfolioItem;
    if (item.id) {
      const idx = list.findIndex((p) => p.id === item.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...item } as PortfolioItem;
        saved = list[idx];
      } else {
        saved = { ...item, id: item.id, created_at: new Date().toISOString() } as PortfolioItem;
        list.unshift(saved);
      }
    } else {
      saved = {
        ...item,
        id: 'p-' + Math.random().toString(36).substring(2, 9),
        images: item.images || [],
        technologies: item.technologies || [],
        published: item.published ?? true,
        created_at: new Date().toISOString(),
      } as PortfolioItem;
      list.unshift(saved);
    }
    writeStorage(STORAGE_KEYS.PORTFOLIO, list);
    return saved;
  },

  async deletePortfolio(id: string): Promise<boolean> {
    const list = readStorage<PortfolioItem[]>(STORAGE_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    writeStorage(
      STORAGE_KEYS.PORTFOLIO,
      list.filter((p) => p.id !== id)
    );
    return true;
  },

  // CLIENTS
  async getClients(): Promise<UserProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Try secure admin endpoint with current auth session token
        const session = (await supabase.auth.getSession())?.data.session;
        if (session?.access_token) {
          try {
            const apiRes = await fetch('/api/admin/clients', {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            });
            if (apiRes.ok) {
              const apiData = await apiRes.json();
              if (apiData.success && Array.isArray(apiData.clients)) {
                return apiData.clients as UserProfile[];
              }
            }
          } catch (apiErr) {
            console.warn('Admin clients API fallback notice:', apiErr);
          }
        }

        // 2. Direct Supabase query fallback
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data as UserProfile[];
        }
      } catch (err) {
        console.warn('Supabase clients fallback:', err);
      }
    }
    const clients = readStorage<UserProfile[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    return clients;
  },

  async getClientById(id: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (!error && data) {
          return data as UserProfile;
        }
      } catch (err) {
        console.warn('Supabase clientById fallback:', err);
      }
    }
    const clients = await this.getClients();
    return clients.find((c) => c.id === id) || null;
  },

  // CONTACT MESSAGES
  async getContactMessages(): Promise<ContactMessage[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
        if (!error && data) return data as ContactMessage[];
      } catch (err) {
        console.warn('Supabase contact messages fallback:', err);
      }
    }
    return readStorage<ContactMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  },

  async createContactMessage(msg: { name: string; email: string; phone?: string; subject: string; message: string }): Promise<ContactMessage> {
    const reference_code = generateReferenceCode('VP-MSG');
    const newMsg: ContactMessage = {
      ...msg,
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      reference_code,
      status: 'Unread',
      created_at: new Date().toISOString(),
    };
    const list = readStorage<ContactMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    list.unshift(newMsg);
    writeStorage(STORAGE_KEYS.MESSAGES, list);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('contact_messages').insert({
          reference_code: newMsg.reference_code,
          name: newMsg.name,
          email: newMsg.email,
          phone: newMsg.phone,
          subject: newMsg.subject,
          message: newMsg.message,
          status: newMsg.status,
        });
      } catch (err) {
        console.error('Supabase contact msg insert error:', err);
      }
    }
    return newMsg;
  },

  async updateContactMessage(id: string, updates: Partial<ContactMessage>): Promise<boolean> {
    const list = readStorage<ContactMessage[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
    const idx = list.findIndex((m) => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      writeStorage(STORAGE_KEYS.MESSAGES, list);
      return true;
    }
    return false;
  },

  // NOTIFICATIONS
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    const all = readStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return all.filter((n) => n.user_id === userId);
  },

  async createNotification(userId: string, title: string, message: string, link?: string): Promise<void> {
    const notifs = readStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifs.unshift({
      id: 'n-' + Math.random().toString(36).substring(2, 9),
      user_id: userId,
      title,
      message,
      link,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    writeStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  async markNotificationRead(id: string): Promise<void> {
    const notifs = readStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const idx = notifs.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notifs[idx].is_read = true;
      writeStorage(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },
};
