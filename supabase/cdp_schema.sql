-- DDL for unified guest profile tables (CDP)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Golden Records Table
CREATE TABLE IF NOT EXISTS public.cdp_golden_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  document_id TEXT,
  dob DATE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  merged_into_id UUID REFERENCES public.cdp_golden_records(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for searching and matching
CREATE INDEX IF NOT EXISTS idx_cdp_golden_records_email ON public.cdp_golden_records(email);
CREATE INDEX IF NOT EXISTS idx_cdp_golden_records_phone ON public.cdp_golden_records(phone);
CREATE INDEX IF NOT EXISTS idx_cdp_golden_records_document ON public.cdp_golden_records(document_id);

-- 2. Guest Profiles Table (Source Profiles)
CREATE TABLE IF NOT EXISTS public.cdp_guest_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  golden_record_id UUID REFERENCES public.cdp_golden_records(id) ON DELETE SET NULL,
  source_system TEXT NOT NULL, -- e.g., 'contacts', 'bookings', 'stripe', 'pms'
  source_id TEXT NOT NULL,      -- original id in the source system
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  nationality TEXT,
  document_id TEXT,
  dob DATE,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_system, source_id)
);

CREATE INDEX IF NOT EXISTS idx_cdp_guest_profiles_golden ON public.cdp_guest_profiles(golden_record_id);
CREATE INDEX IF NOT EXISTS idx_cdp_guest_profiles_email ON public.cdp_guest_profiles(email);
CREATE INDEX IF NOT EXISTS idx_cdp_guest_profiles_phone ON public.cdp_guest_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_cdp_guest_profiles_document ON public.cdp_guest_profiles(document_id);

-- 3. Profile Match Logs Table
CREATE TABLE IF NOT EXISTS public.cdp_profile_match_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_profile_id UUID REFERENCES public.cdp_guest_profiles(id) ON DELETE CASCADE,
  golden_record_id UUID REFERENCES public.cdp_golden_records(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL, -- 'email_exact', 'phone_exact', 'document_exact', 'fuzzy_name', 'manual_match'
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0.00, -- 0.00 to 100.00
  rules_evaluated JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL CHECK (status in ('auto_merged', 'pending_review', 'rejected', 'manually_matched')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdp_profile_match_logs_profile ON public.cdp_profile_match_logs(guest_profile_id);
CREATE INDEX IF NOT EXISTS idx_cdp_profile_match_logs_golden ON public.cdp_profile_match_logs(golden_record_id);

-- Triggers for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cdp_golden_records_updated_at
  BEFORE UPDATE ON public.cdp_golden_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cdp_guest_profiles_updated_at
  BEFORE UPDATE ON public.cdp_guest_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS for all tables
ALTER TABLE public.cdp_golden_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdp_guest_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdp_profile_match_logs ENABLE ROW LEVEL SECURITY;

-- Allow all access for authenticated roles
CREATE POLICY "Enable all for authenticated users on cdp_golden_records" ON public.cdp_golden_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on cdp_guest_profiles" ON public.cdp_guest_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on cdp_profile_match_logs" ON public.cdp_profile_match_logs FOR ALL USING (auth.role() = 'authenticated');

-- Allow all access for MVP/development (similar to other schema files)
CREATE POLICY "Enable all access for MVP on cdp_golden_records" ON public.cdp_golden_records FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP on cdp_guest_profiles" ON public.cdp_guest_profiles FOR ALL USING (true);
CREATE POLICY "Enable all access for MVP on cdp_profile_match_logs" ON public.cdp_profile_match_logs FOR ALL USING (true);
