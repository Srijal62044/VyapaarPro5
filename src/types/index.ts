// VyapaarPro Core Types

export type UserRole = 'customer' | 'admin' | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export type PricingModel = 'FIXED' | 'STARTING_FROM' | 'CUSTOM_QUOTE';

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  created_at?: string;
}

export interface ServiceFeature {
  id: string;
  service_id: string;
  title: string;
  description?: string;
  display_order: number;
}

export interface ServiceFAQ {
  id: string;
  service_id: string;
  question: string;
  answer: string;
  display_order: number;
}

export interface ServiceItem {
  id: string;
  category_id?: string;
  category_name?: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  pricing_model: PricingModel;
  price: number;
  currency: string;
  timeline?: string;
  thumbnail_url?: string;
  featured: boolean;
  published: boolean;
  demo_url?: string;
  deliverables: string[];
  features?: ServiceFeature[];
  faqs?: ServiceFAQ[];
  created_at?: string;
  updated_at?: string;
}

export type RequestStatus =
  | 'New'
  | 'Contacted'
  | 'Discussing'
  | 'Approved'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type InternalPaymentStatus =
  | 'Not Discussed'
  | 'Pending'
  | 'Partially Received'
  | 'Received';

export interface ServiceRequestFile {
  id: string;
  request_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  reference_code: string;
  user_id?: string | null;
  service_id?: string | null;
  service_name: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  business_name?: string;
  requirements: string;
  budget_range?: string;
  preferred_contact_method: string;
  reference_links?: string;
  status: RequestStatus;
  internal_notes?: string; // Admin only!
  payment_status: InternalPaymentStatus; // Admin internal only!
  files?: ServiceRequestFile[];
  created_at: string;
  updated_at?: string;
}

export type ProjectStatus =
  | 'Planning'
  | 'Design'
  | 'Development'
  | 'Testing'
  | 'Review'
  | 'Completed'
  | 'On Hold'
  | 'Cancelled';

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  due_date?: string;
  completed_date?: string;
  display_order: number;
  created_at?: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface ProjectDeliverable {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  url: string;
  created_at: string;
}

export interface ProjectItem {
  id: string;
  reference_code: string;
  client_id?: string | null;
  client_name?: string;
  client_email?: string;
  request_id?: string | null;
  service_id?: string | null;
  title: string;
  description?: string;
  status: ProjectStatus;
  progress_percentage: number;
  start_date?: string;
  expected_completion?: string;
  notes?: string; // Admin notes
  internal_payment_status: InternalPaymentStatus; // Admin only
  milestones?: ProjectMilestone[];
  updates?: ProjectUpdate[];
  deliverables?: ProjectDeliverable[];
  created_at: string;
  updated_at?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  client_type?: string;
  thumbnail_url: string;
  images: string[];
  technologies: string[];
  demo_url?: string;
  published: boolean;
  created_at: string;
}

export type ContactMessageStatus = 'Unread' | 'Read' | 'Replied' | 'Archived';

export interface ContactMessage {
  id: string;
  reference_code: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  admin_notes?: string;
  created_at: string;
}

export interface DeveloperProfile {
  name: string;
  role: string;
  location: string;
  bio: string;
  focus: string[];
  avatar_url?: string;
  github?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
}

export interface LegalConfig {
  governing_jurisdiction: string;
  effective_date: string;
  last_updated: string;
  legal_notice: string;
}

export interface AgencySettings {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  description: string;
  footer_text: string;
  logo_url?: string;
  favicon_url?: string;
  social: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  developer?: DeveloperProfile;
  legal?: LegalConfig;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// ==============================================================================
// DIGITAL STORE MODULE TYPES
// ==============================================================================

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type StoreProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface StoreProduct {
  id: string;
  category_id?: string | null;
  category_name?: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  price_paise: number; // Stored in integer paise (e.g. 49900 for ₹499.00)
  compare_at_price_paise?: number | null;
  thumbnail_path?: string | null;
  thumbnail_url?: string | null;
  product_file_path?: string | null;
  file_name?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  
  // Delivery & Access configuration
  access_link?: string | null;
  instructions?: string | null;
  access_info?: string | null;
  license_key?: string | null;
  delivery_notes?: string | null;

  // Social Media & Service Metadata
  platform?: string | null; // e.g. 'instagram' | 'youtube' | 'facebook' | 'twitter' | 'telegram' | 'tiktok' | 'threads' | 'snapchat' | 'pinterest' | 'linkedin' | 'discord' | 'spotify' | 'digital'
  service_type?: string | null; // e.g. 'followers' | 'likes' | 'views' | 'subscribers' | 'comments' | 'members'
  min_quantity?: number | null;
  max_quantity?: number | null;
  delivery_time_info?: string | null;
  sort_order?: number | null;

  status: StoreProductStatus;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export type StoreOrderStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_REVIEW'
  | 'PAID'
  | 'REJECTED'
  | 'DELIVERED'
  | 'CANCELLED';

export type StoreFulfillmentStatus =
  | 'UNFULFILLED'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED';

export interface StoreOrderItem {
  id: string;
  order_id: string;
  product_id?: string | null;
  product_name_snapshot: string;
  unit_price_paise: number;
  quantity: number;
  total_paise: number;
  created_at?: string;
  product?: StoreProduct;
}

export type StorePaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'REVIEW'
  | 'SUCCESS'
  | 'FAILED'
  | 'REJECTED'
  | 'REFUNDED';

export interface StorePayment {
  id: string;
  order_id: string;
  gateway: string;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  gateway_reference?: string | null;
  amount_paise: number;
  currency: string;
  status: StorePaymentStatus;
  raw_reference_metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StoreOrderAuditLog {
  id: string;
  order_id: string;
  admin_user_id?: string | null;
  admin_email?: string | null;
  action:
    | 'ORDER_CREATED'
    | 'PAYMENT_SUBMITTED_FOR_REVIEW'
    | 'PAYMENT_APPROVED'
    | 'PAYMENT_REJECTED'
    | 'DELIVERY_SENT_WHATSAPP'
    | 'ORDER_DELIVERED'
    | 'ADMIN_NOTE_ADDED';
  previous_status?: string | null;
  new_status?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
}

export interface StoreOrder {
  id: string;
  user_id?: string | null;
  order_number: string; // e.g. VP-ORD-A9B28D14
  subtotal_paise: number;
  discount_paise: number;
  total_paise: number;
  currency: string;
  status: StoreOrderStatus;
  fulfillment_status?: StoreFulfillmentStatus;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  idempotency_key?: string;
  
  // Manual Review & Approval Fields
  payment_reviewed_at?: string | null;
  payment_reviewed_by?: string | null;
  payment_rejection_reason?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  
  // Delivery Fields
  delivered_at?: string | null;
  delivered_by?: string | null;
  delivery_notes?: string | null;
  admin_notes?: string | null;

  items?: StoreOrderItem[];
  payments?: StorePayment[];
  audit_logs?: StoreOrderAuditLog[];
  created_at: string;
  updated_at?: string;
}

export interface StoreDownload {
  id: string;
  order_id: string;
  order_item_id?: string | null;
  user_id?: string | null;
  product_id?: string | null;
  product_name?: string;
  file_name?: string | null;
  file_size_bytes?: number | null;
  download_count: number;
  last_downloaded_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
  updated_at?: string;
  order?: StoreOrder;
  product?: StoreProduct;
}

export interface StoreDashboardStats {
  total_products: number;
  published_products: number;
  draft_products: number;
  total_orders: number;
  paid_orders: number;
  pending_payments: number;
  pending_reviews: number;
  total_delivered: number;
  total_revenue_paise: number;
}

