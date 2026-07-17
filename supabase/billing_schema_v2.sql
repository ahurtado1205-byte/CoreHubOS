-- DDL for normalized billing tables v2
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table properties extensions mapping
CREATE TABLE IF NOT EXISTS public.billing_tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'AR',
  vat_condition TEXT NOT NULL DEFAULT 'responsable_inscripto',
  document_default_class CHAR(1) NOT NULL DEFAULT 'B',
  arca_enabled BOOLEAN NOT NULL DEFAULT true,
  pos_map_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_tax_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind in ('iva','percepcion','retencion','municipal','other')),
  rate NUMERIC(9,4) NOT NULL DEFAULT 0,
  jurisdiction TEXT NULL,
  calculation_order INTEGER NOT NULL DEFAULT 1,
  recoverable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Windows splitting inside folios
CREATE TABLE IF NOT EXISTS public.billing_folio_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id UUID NOT NULL,
  name TEXT NOT NULL,
  payer_type TEXT NOT NULL CHECK (payer_type in ('guest','company','agency')),
  payer_entity_id UUID NOT NULL,
  routing_rules_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger lines append-only
CREATE TABLE IF NOT EXISTS public.billing_folio_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_window_id UUID NOT NULL REFERENCES public.billing_folio_windows(id) ON DELETE CASCADE,
  line_type TEXT NOT NULL CHECK (line_type in ('charge','payment','discount','adjustment','reversal')),
  service_date DATE NOT NULL,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT NOT NULL,
  qty NUMERIC(18,6) NOT NULL DEFAULT 1,
  unit_amount_minor BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  tax_code_id UUID REFERENCES public.billing_tax_codes(id) ON DELETE SET NULL,
  gross_minor BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status in ('posted','voided','reverted')),
  source_type TEXT NOT NULL,
  source_id UUID NULL,
  reversal_of_line_id UUID NULL REFERENCES public.billing_folio_lines(id) ON DELETE SET NULL,
  created_by UUID NULL
);

-- Charges metadata view
CREATE TABLE IF NOT EXISTS public.billing_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_line_id UUID NOT NULL REFERENCES public.billing_folio_lines(id) ON DELETE CASCADE,
  charge_category TEXT NOT NULL CHECK (charge_category in ('room_night','consumption','adjustment','other')),
  room_night_id UUID NULL,
  product_id UUID NULL,
  consumption_id UUID NULL
);

-- Payment Intents internal tracking
CREATE TABLE IF NOT EXISTS public.billing_payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type in ('folio','reservation','invoice')),
  scope_id UUID NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  idempotency_key TEXT NOT NULL,
  provider_intent_id TEXT NULL,
  client_secret TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chargebacks tracking
CREATE TABLE IF NOT EXISTS public.billing_chargebacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  provider_case_id TEXT NOT NULL,
  status TEXT NOT NULL,
  disputed_minor BIGINT NOT NULL,
  fee_minor BIGINT NOT NULL,
  reason TEXT NULL,
  due_at TIMESTAMPTZ NULL,
  won_lost_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS public.billing_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency CHAR(3) NOT NULL,
  quote_currency CHAR(3) NOT NULL,
  source TEXT NOT NULL,
  rate NUMERIC(18,6) NOT NULL,
  as_of TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reconciliation batches & items
CREATE TABLE IF NOT EXISTS public.billing_reconciliation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  provider TEXT NOT NULL,
  source_file TEXT NULL,
  period_from DATE NULL,
  period_to DATE NULL,
  status TEXT NOT NULL CHECK (status in ('open','processing','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.billing_reconciliation_batches(id) ON DELETE CASCADE,
  external_tx_id TEXT NOT NULL,
  local_payment_id UUID NULL,
  kind TEXT NOT NULL,
  gross_minor BIGINT NOT NULL,
  fee_minor BIGINT NOT NULL,
  net_minor BIGINT NOT NULL,
  match_status TEXT NOT NULL CHECK (match_status in ('matched','unresolved','manual'))
);

-- Webhook Events Inbox for Idempotence
CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NULL,
  result TEXT NULL,
  UNIQUE(provider, event_id)
);

-- Snapshots for audit trails
CREATE TABLE IF NOT EXISTS public.billing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL,
  scope_id UUID NOT NULL,
  version BIGINT NOT NULL,
  state_json JSONB NOT NULL,
  checksum TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  reason TEXT NULL
);

-- Accounting Exports
CREATE TABLE IF NOT EXISTS public.billing_accounting_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  format TEXT NOT NULL CHECK (format in ('csv','ofx','iso20022')),
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  status TEXT NOT NULL CHECK (status in ('pending','exported','failed')),
  file_uri TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Enablement
ALTER TABLE public.billing_tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_tax_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_folio_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_folio_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_chargebacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_reconciliation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_accounting_exports ENABLE ROW LEVEL SECURITY;
