export type QuoteStatus = 'draft' | 'sent' | 'follow_up' | 'pre_booked' | 'booked' | 'lost' | 'expired';
export type OpportunityStage = 'draft' | 'sent' | 'follow_up' | 'pre_booked' | 'booked' | 'lost';
export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'qualified' | 'converted' | 'lost';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed' | 'overdue';

export interface Property {
  id: string;
  name: string;
  location?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  booking_engine_color?: string;
  booking_engine_logo?: string;
  booking_engine_hero?: string;
  terms_conditions?: string;
  cancellation_policy?: string;
  website_hero_title?: string;
  website_hero_subtitle?: string;
  website_hero_image?: string;
  website_about_title?: string;
  website_about_text?: string;
  website_amenities?: string;
  website_instagram?: string;
  website_facebook?: string;
  theme_preset?: 'cozy' | 'luxury' | 'minimalist' | 'tropical';
  website_logo?: string;
  website_about_image?: string;
  website_check_in_time?: string;
  website_check_out_time?: string;
  website_maps_url?: string;
  website_footer_text?: string;
  website_whatsapp_message?: string;
}

export interface CommunicationTemplate {
  id: string;
  property_id?: string;
  name: string;
  type: 'whatsapp' | 'email' | 'pdf';
  subject?: string; // used for email
  content: string;
}

export interface TimelineEvent {
  id: string;
  type: 'creation' | 'status_change' | 'stage_change' | 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'task_created' | 'task_completed' | 'proposal_generated' | 'won' | 'lost' | 'reservation_created';
  date: string;
  agent: string;
  description: string;
  metadata?: any;
}

export interface Activity {
  id: string;
  property_id?: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'note' | 'follow_up' | 'proposal' | 'rate_change' | 'lead' | 'reserva' | 'other';
  date: string;
  result: 'pending' | 'completed' | 'no_answer' | 'interested' | 'not_interested' | 'needs_follow_up';
  description: string;
  next_action?: string;
  next_action_date?: string;
  quote_id?: string;
  opportunity_id?: string;
  lead_id?: string;
  contact_id?: string;
  agent_id: string;
}

export interface Task {
  id: string;
  property_id?: string;
  title: string;
  description?: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  agent_id: string;
  quote_id?: string;
  opportunity_id?: string;
  lead_id?: string;
  contact_id?: string;
}

export interface Lead {
  id: string;
  property_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source: string;
  type: 'individual' | 'group' | 'event' | 'corporate' | 'agency' | 'package' | 'other';
  tentative_dates?: string;
  pax?: number;
  rooms_count?: number;
  budget?: number;
  notes?: string;
  status: LeadStatus;
  agent_id: string;
  created_at: string;
  updated_at: string;
  last_activity_at?: string;
  timeline?: TimelineEvent[];
}

export interface Contact {
  id: string;
  property_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  type: 'guest' | 'agency' | 'corporate' | 'operator' | 'event_planner' | 'other';
  account_id?: string;
  notes?: string;
  created_at: string;
  timeline?: TimelineEvent[];
}

export interface Opportunity {
  id: string;
  property_id?: string;
  name: string;
  lead_id?: string;
  contact_id?: string;
  account_id?: string;
  primary_quote_id?: string;
  estimated_value: number;
  currency: string;
  expected_close_date?: string;
  tentative_dates?: string;
  rooms_count?: number;
  pax?: number;
  business_type: string;
  stage: OpportunityStage;
  probability: number; // 0 to 100
  status: 'open' | 'won' | 'lost';
  lost_reason?: string;
  agent_id: string;
  next_action?: string;
  next_action_date?: string;
  last_activity_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  timeline?: TimelineEvent[];
}

export interface Quote {
  id: string;
  property_id: string;
  confirmation_id?: string;
  contact_id?: string;
  lead_id?: string;
  opportunity_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  check_in: string;
  check_out: string;
  pax: number;
  extra_beds?: number;
  rooms_count?: number;
  unit_type_id?: string;
  rate_plan_id?: string;
  nightly_rate?: number;
  total_nights?: number;
  subtotal?: number;
  discount_type?: 'none' | 'percent' | 'fixed';
  discount_value?: number;
  total_amount: number;
  currency?: string;
  status: QuoteStatus;
  source: string;
  expiration_date: string;
  follow_up_date?: string;
  notes?: string;
  internal_notes?: string;
  assigned_agent?: string;
  probability?: number;
  next_action?: string;
  next_action_date?: string;
  last_activity_at?: string;
  created_at?: string;
  updated_at?: string;
  options?: { currency: string }[];
  timeline?: TimelineEvent[];
}

export type BookingStatus = string;

export interface Companion {
  firstName: string;
  lastName: string;
  documentId: string;
  dob: string;
}

export interface Booking {
  id: string;
  property_id: string;
  confirmation_id?: string;
  quote_id?: string;
  created_at?: string;
  updated_at?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  source?: string;
  unit_type_id?: string;
  room_id?: string;
  rooms_count?: number;
  rate_plan_id?: string;
  check_in: string;
  check_out: string;
  nightly_rate?: number;
  total_nights?: number;
  subtotal?: number;
  discount_type?: 'none' | 'percent' | 'fixed';
  discount_value?: number;
  total_amount?: number;
  booking_status: BookingStatus;
  notes?: string;
  follow_up_date?: string;
  pax?: number;
  extra_beds?: number;
  document_id?: string;
  dob?: string;
  pre_checkin_completed?: boolean;
  companions?: Companion[];
  cancellation_reason?: string;
}

export interface Room {
  id: string;
  name: string;
  type: string;
}

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'payment_link' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  property_id: string;
  booking_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  reference?: string;
  notes?: string;
  created_at: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  property_id: string;
  booking_id: string;
  invoice_number?: string;
  issue_date: string;
  due_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  billing_name: string;
  billing_document: string;
  billing_address?: string;
  notes?: string;
  created_at: string;
}

export interface HousekeepingTask {
  id: string;
  unit_id: string;
  date: string; // YYYY-MM-DD
  team_member_id: string | null;
  task_type: 'check_in' | 'check_out' | 'stay_over' | 'turn_down' | 'deep_clean';
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
}
export interface Promotion {
  id: string;
  property_id: string;
  code: string;
  name: string;
  discount_type: 'percentage' | 'percent' | 'fixed';
  discount_value: number;
  valid_from: string;
  valid_until: string;
  min_nights?: number;
  is_active: boolean;
  created_at: string;
}
