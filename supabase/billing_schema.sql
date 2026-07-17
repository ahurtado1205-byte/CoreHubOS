-- DDL for normalized billing tables
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.billing_folios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  reservation_id UUID NULL,
  guest_id UUID NULL,
  company_id UUID NULL,
  agency_id UUID NULL,
  folio_number BIGSERIAL,
  status TEXT NOT NULL CHECK (status in ('open','closed','checked_out','written_off')),
  currency_code CHAR(3) NOT NULL DEFAULT 'USD',
  exchange_rate NUMERIC(18,6) NOT NULL DEFAULT 1,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ NULL,
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS public.billing_folio_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  folio_id UUID NOT NULL REFERENCES public.billing_folios(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (
    entry_type in ('room_charge','extra_charge','tax','discount','agency_commission','adjustment','payment_memo','credit_memo')
  ),
  source_type TEXT NOT NULL,
  source_id UUID NULL,
  service_date DATE NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(18,6) NOT NULL DEFAULT 1,
  unit_amount NUMERIC(18,6) NOT NULL,
  net_amount NUMERIC(18,6) NOT NULL,
  tax_amount NUMERIC(18,6) NOT NULL DEFAULT 0,
  gross_amount NUMERIC(18,6) NOT NULL,
  currency_code CHAR(3) NOT NULL,
  exchange_rate NUMERIC(18,6) NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL
);

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  folio_id UUID NULL REFERENCES public.billing_folios(id) ON DELETE SET NULL,
  reservation_id UUID NULL,
  bill_to_type TEXT NOT NULL CHECK (bill_to_type in ('guest','company','agency')),
  bill_to_id UUID NOT NULL,
  invoice_kind TEXT NOT NULL CHECK (invoice_kind in ('proforma','fiscal','receipt_only')),
  document_class TEXT NULL CHECK (document_class in ('A','B','C','E','T','NC','ND','RCPT')),
  status TEXT NOT NULL CHECK (status in ('draft','issued','paid_partial','paid','cancelled','refunded')),
  point_of_sale INTEGER NULL,
  invoice_number BIGINT NULL,
  issue_date DATE NULL,
  due_date DATE NULL,
  currency_code CHAR(3) NOT NULL,
  exchange_rate NUMERIC(18,6) NOT NULL DEFAULT 1,
  subtotal NUMERIC(18,6) NOT NULL DEFAULT 0,
  tax_total NUMERIC(18,6) NOT NULL DEFAULT 0,
  other_taxes_total NUMERIC(18,6) NOT NULL DEFAULT 0,
  grand_total NUMERIC(18,6) NOT NULL DEFAULT 0,
  paid_total NUMERIC(18,6) NOT NULL DEFAULT 0,
  balance_due NUMERIC(18,6) NOT NULL DEFAULT 0,
  arca_cae VARCHAR(32) NULL,
  arca_cae_due_date DATE NULL,
  arca_qr_payload TEXT NULL,
  fiscal_response JSONB NULL,
  version BIGINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_at TIMESTAMPTZ NULL,
  cancelled_at TIMESTAMPTZ NULL,
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS public.billing_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  folio_entry_id UUID NULL REFERENCES public.billing_folio_entries(id) ON DELETE SET NULL,
  line_no INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  description TEXT NOT NULL,
  service_date_from DATE NULL,
  service_date_to DATE NULL,
  quantity NUMERIC(18,6) NOT NULL DEFAULT 1,
  unit_price NUMERIC(18,6) NOT NULL,
  discount_amount NUMERIC(18,6) NOT NULL DEFAULT 0,
  net_amount NUMERIC(18,6) NOT NULL,
  tax_amount NUMERIC(18,6) NOT NULL DEFAULT 0,
  gross_amount NUMERIC(18,6) NOT NULL,
  tax_code TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.billing_tax_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  invoice_line_id UUID NULL REFERENCES public.billing_invoice_lines(id) ON DELETE CASCADE,
  tax_type TEXT NOT NULL CHECK (
    tax_type in ('iva','percepcion_iva','percepcion_iibb','retencion_iva','retencion_ganancias','municipal','interno','other')
  ),
  jurisdiction_code TEXT NULL,
  rate NUMERIC(9,4) NOT NULL DEFAULT 0,
  base_amount NUMERIC(18,6) NOT NULL,
  tax_amount NUMERIC(18,6) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  folio_id UUID NULL REFERENCES public.billing_folios(id) ON DELETE SET NULL,
  reservation_id UUID NULL,
  provider TEXT NOT NULL CHECK (provider in ('cash','bank_transfer','mercadopago','stripe','adyen','pos_manual','other')),
  method_type TEXT NOT NULL CHECK (method_type in ('card','cash','transfer','qr','pos','payment_link','wallet','other')),
  status TEXT NOT NULL CHECK (status in ('pending','authorized','captured','succeeded','failed','cancelled','refunded','partially_refunded')),
  amount NUMERIC(18,6) not null,
  currency_code CHAR(3) NOT NULL,
  exchange_rate NUMERIC(18,6) NOT NULL DEFAULT 1,
  external_reference TEXT NULL,
  idempotency_key TEXT NOT NULL,
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  version BIGINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ NULL,
  created_by UUID NULL
);

CREATE TABLE IF NOT EXISTS public.billing_payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  payment_id UUID NOT NULL REFERENCES public.billing_payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  amount NUMERIC(18,6) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.billing_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  payment_id UUID NOT NULL REFERENCES public.billing_payments(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status in ('pending','succeeded','failed','reversed')),
  amount NUMERIC(18,6) NOT NULL CHECK (amount > 0),
  reason TEXT NULL,
  external_reference TEXT NULL,
  provider_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL
);

CREATE TABLE IF NOT EXISTS public.billing_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  payment_id UUID NOT NULL REFERENCES public.billing_payments(id) ON DELETE CASCADE,
  receipt_number BIGSERIAL,
  status TEXT NOT NULL CHECK (status in ('issued','cancelled')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_url TEXT NULL,
  version BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.billing_invoice_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.billing_invoices(id) ON DELETE CASCADE,
  version BIGINT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL
);

-- Enable RLS for all billing tables
ALTER TABLE public.billing_folios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_folio_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_tax_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoice_versions ENABLE ROW LEVEL SECURITY;

-- Allow all access for authenticated roles
CREATE POLICY "Enable all for authenticated users on folios" ON public.billing_folios FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on folio_entries" ON public.billing_folio_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on billing_invoices" ON public.billing_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on invoice_lines" ON public.billing_invoice_lines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on tax_lines" ON public.billing_tax_lines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on billing_payments" ON public.billing_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on allocations" ON public.billing_payment_allocations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on refunds" ON public.billing_refunds FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on receipts" ON public.billing_receipts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on invoice_versions" ON public.billing_invoice_versions FOR ALL USING (auth.role() = 'authenticated');
