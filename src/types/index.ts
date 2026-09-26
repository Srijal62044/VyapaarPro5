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
