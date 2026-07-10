export type UnitStatusType = 'active' | 'out_of_order' | 'out_of_service';

export interface MaintenanceBlock {
  id: string;
  property_id: string;
  unit_id: string;
  type: 'out_of_order' | 'out_of_service';
  start_date: string; // ISO string
  end_date: string; // ISO string
  reason?: string;
}

export interface UnitType {
  id: string;
  property_id: string;
  name: string;
  description: string;
  max_pax: number;
  base_price: number;
  amenities: string[];
  images?: string[];
}

export interface Unit {
  id: string;
  property_id: string;
  unit_type_id: string;
  name: string; // e.g., "101", "Villa 1"
  status: UnitStatusType;
  notes?: string;
  housekeeping_status?: 'clean' | 'dirty' | 'cleaning' | 'inspected';
}

export interface RatePlan {
  id: string;
  property_id: string;
  name: string;
  description?: string;
  is_default?: boolean;
  parent_plan_id?: string;
  discount_type?: 'percent' | 'fixed';
  discount_value?: number;
  meal_plan?: string;
  cancellation_policy?: string;
  is_visible_in_quotes?: boolean;
}

export interface RateRule {
  id: string;
  rate_plan_id: string;
  unit_type_id: string;
  season_name: string;
  start_date: string; // ISO date YYYY-MM-DD
  end_date: string; // ISO date YYYY-MM-DD
  price: number;
  min_nights?: number;
}

export interface DailyRate {
  id: string;
  rate_plan_id: string;
  unit_type_id: string;
  date: string; // ISO date YYYY-MM-DD
  price: number;
}
