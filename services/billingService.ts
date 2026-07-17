import { supabase } from '../lib/supabase';
import { createChargeSchema, issueInvoiceSchema, createPaymentSchema } from '../lib/billingSchemas';

// Check if we are in server or client environment
const isServer = typeof window === 'undefined';

// Memory fallback database for client/server when Supabase is down or local development is active
let localBillingDb: {
  folios: any[];
  folio_entries: any[];
  invoices: any[];
  invoice_lines: any[];
  tax_lines: any[];
  payments: any[];
  payment_allocations: any[];
  refunds: any[];
  receipts: any[];
  invoice_versions: any[];
} = {
  folios: [],
  folio_entries: [],
  invoices: [],
  invoice_lines: [],
  tax_lines: [],
  payments: [],
  payment_allocations: [],
  refunds: [],
  receipts: [],
  invoice_versions: []
};

// Lazy loader/persister for local billing database (using filesystem on server, localStorage on client)
const loadLocalDb = async () => {
  if (!isServer) {
    const data = localStorage.getItem('local_billing_db');
    if (data) {
      localBillingDb = JSON.parse(data);
    }
  } else {
    try {
      const fs = require('fs/promises');
      const { join } = require('path');
      const filePath = join(process.cwd(), 'local_billing_db.json');
      const fileData = await fs.readFile(filePath, 'utf-8');
      if (fileData) {
        localBillingDb = JSON.parse(fileData);
      }
    } catch (e) {
      // Create template if missing
      await saveLocalDb();
    }
  }
};

const saveLocalDb = async () => {
  if (!isServer) {
    localStorage.setItem('local_billing_db', JSON.stringify(localBillingDb));
  } else {
    try {
      const fs = require('fs/promises');
      const { join } = require('path');
      const filePath = join(process.cwd(), 'local_billing_db.json');
      await fs.writeFile(filePath, JSON.stringify(localBillingDb, null, 2));
    } catch (e) {
      console.error('Failed to persist local billing DB:', e);
    }
  }
};

export class BillingService {
  static async init() {
    await loadLocalDb();
  }

  // Get active folio by reservation
  static async getFolioByReservation(reservationId: string, propertyId: string) {
    await loadLocalDb();
    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('billing_folios')
          .select('*')
          .eq('reservation_id', reservationId)
          .eq('property_id', propertyId)
          .maybeSingle();

        if (!error && data) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase query failed, falling back to local DB:', e);
      }
    }

    // Fallback search
    let folio = localBillingDb.folios.find(f => f.reservation_id === reservationId && f.property_id === propertyId);
    if (!folio) {
      folio = await this.createFolio({
        property_id: propertyId,
        reservation_id: reservationId,
        status: 'open',
        currency_code: 'USD',
        exchange_rate: 1
      });
    }
    return folio;
  }

  // Get full folio data, including entries and calculations
  static async getFolioDetails(folioId: string) {
    await loadLocalDb();
    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    let folio: any = null;
    let entries: any[] = [];
    let payments: any[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data: fData, error: fError } = await supabase.from('billing_folios').select('*').eq('id', folioId).maybeSingle();
        if (!fError && fData) {
          folio = fData;
          const { data: eData } = await supabase.from('billing_folio_entries').select('*').eq('folio_id', folioId);
          const { data: pData } = await supabase.from('billing_payments').select('*').eq('folio_id', folioId);
          entries = eData || [];
          payments = pData || [];
        }
      } catch (e) {
        console.warn('Supabase query failed, falling back to local DB:', e);
      }
    }

    if (!folio) {
      folio = localBillingDb.folios.find(f => f.id === folioId);
      if (folio) {
        entries = localBillingDb.folio_entries.filter(e => e.folio_id === folioId);
        payments = localBillingDb.payments.filter(p => p.folio_id === folioId);
      }
    }

    if (!folio) return null;

    // Calculations
    const chargesTotal = entries
      .filter(e => ['room_charge', 'extra_charge', 'tax', 'agency_commission'].includes(e.entry_type))
      .reduce((sum, e) => sum + Number(e.gross_amount), 0);

    const discountsTotal = entries
      .filter(e => e.entry_type === 'discount' || e.entry_type === 'credit_memo')
      .reduce((sum, e) => sum + Number(e.gross_amount), 0);

    const paymentsTotal = payments
      .filter(p => ['succeeded', 'captured'].includes(p.status))
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const balance = chargesTotal - discountsTotal - paymentsTotal;

    return {
      ...folio,
      entries,
      payments,
      totals: {
        charges: chargesTotal,
        discounts: discountsTotal,
        payments: paymentsTotal,
        balance: Math.max(0, balance),
        currency: folio.currency_code
      }
    };
  }

  // Create new billing folio
  static async createFolio(data: {
    property_id: string;
    reservation_id?: string;
    guest_id?: string;
    company_id?: string;
    agency_id?: string;
    status: 'open' | 'closed' | 'checked_out' | 'written_off';
    currency_code: string;
    exchange_rate: number;
  }) {
    await loadLocalDb();
    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const newFolio = {
      id: `f_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      folio_number: localBillingDb.folios.length + 1,
      opened_at: new Date().toISOString(),
      version: 1,
      updated_at: new Date().toISOString(),
      ...data
    };

    if (isSupabaseConfigured) {
      try {
        const { data: dbFolio, error } = await supabase
          .from('billing_folios')
          .insert({
            property_id: data.property_id,
            reservation_id: data.reservation_id || null,
            guest_id: data.guest_id || null,
            company_id: data.company_id || null,
            agency_id: data.agency_id || null,
            status: data.status,
            currency_code: data.currency_code,
            exchange_rate: data.exchange_rate,
            opened_at: newFolio.opened_at,
            version: 1
          })
          .select()
          .single();

        if (!error && dbFolio) {
          return dbFolio;
        }
      } catch (e) {
        console.warn('Supabase insert failed, falling back to local DB:', e);
      }
    }

    localBillingDb.folios.push(newFolio);
    await saveLocalDb();
    return newFolio;
  }

  // Post dynamic charges to folio
  static async addCharge(payload: any) {
    const parsed = createChargeSchema.parse(payload);
    await loadLocalDb();
    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Optimistic locking verification
    let folio = localBillingDb.folios.find(f => f.id === parsed.folioId);
    if (isSupabaseConfigured) {
      try {
        const { data: dbFolio } = await supabase.from('billing_folios').select('version').eq('id', parsed.folioId).maybeSingle();
        if (dbFolio) folio = dbFolio;
      } catch {}
    }

    if (!folio) throw new Error('Folio not found');
    if (Number(folio.version) !== Number(parsed.version)) {
      throw new Error('409 Conflict: Version mismatch. Please refresh state.');
    }

    const netAmount = parsed.unitAmount * parsed.quantity;
    const taxAmount = parsed.entryType === 'discount' ? 0 : netAmount * 0.21; // Mock 21% IVA
    const grossAmount = parsed.entryType === 'discount' ? netAmount : netAmount + taxAmount;

    const newEntry = {
      id: `fe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      folio_id: parsed.folioId,
      entry_type: parsed.entryType,
      source_type: parsed.sourceType,
      source_id: parsed.sourceId || null,
      service_date: parsed.serviceDate,
      description: parsed.description,
      quantity: parsed.quantity,
      unit_amount: parsed.unitAmount,
      net_amount: netAmount,
      tax_amount: taxAmount,
      gross_amount: grossAmount,
      currency_code: 'USD',
      exchange_rate: 1,
      metadata: parsed.metadata,
      version: 1,
      created_at: new Date().toISOString()
    };

    const nextVersion = Number(folio.version) + 1;

    if (isSupabaseConfigured) {
      try {
        // Run as a transaction: update folio version and insert entry
        const { error: vError } = await supabase
          .from('billing_folios')
          .update({ version: nextVersion, updated_at: new Date().toISOString() })
          .eq('id', parsed.folioId)
          .eq('version', parsed.version);

        if (!vError) {
          const { data: dbEntry, error: iError } = await supabase
            .from('billing_folio_entries')
            .insert({
              property_id: folio.property_id,
              folio_id: parsed.folioId,
              entry_type: parsed.entryType,
              source_type: parsed.sourceType,
              source_id: parsed.sourceId || null,
              service_date: parsed.serviceDate,
              description: parsed.description,
              quantity: parsed.quantity,
              unit_amount: parsed.unitAmount,
              net_amount: netAmount,
              tax_amount: taxAmount,
              gross_amount: grossAmount,
              currency_code: 'USD',
              exchange_rate: 1,
              metadata: parsed.metadata,
              version: 1
            })
            .select()
            .single();

          if (!iError && dbEntry) {
            return dbEntry;
          }
        }
      } catch (e) {
        console.warn('Supabase post failed, falling back to local DB:', e);
      }
    }

    // Local DB update
    localBillingDb.folios = localBillingDb.folios.map(f =>
      f.id === parsed.folioId ? { ...f, version: nextVersion, updated_at: new Date().toISOString() } : f
    );
    localBillingDb.folio_entries.push(newEntry);
    await saveLocalDb();

    return newEntry;
  }

  // Create payment record
  static async addPayment(payload: any) {
    const parsed = createPaymentSchema.parse(payload);
    await loadLocalDb();
    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    let folio = localBillingDb.folios.find(f => f.id === parsed.folioId);
    if (isSupabaseConfigured) {
      try {
        const { data: dbFolio } = await supabase.from('billing_folios').select('*').eq('id', parsed.folioId).maybeSingle();
        if (dbFolio) folio = dbFolio;
      } catch {}
    }

    if (!folio) throw new Error('Folio not found');
    if (Number(folio.version) !== Number(parsed.version)) {
      throw new Error('409 Conflict: Version mismatch. Please refresh state.');
    }

    const newPayment = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      folio_id: parsed.folioId,
      provider: parsed.provider,
      method_type: parsed.methodType,
      status: 'succeeded',
      amount: parsed.money.amount,
      currency_code: parsed.money.currency,
      exchange_rate: parsed.money.exchangeRate,
      external_reference: parsed.externalReference || null,
      idempotency_key: parsed.idempotencyKey,
      provider_payload: {},
      version: 1,
      created_at: new Date().toISOString(),
      settled_at: new Date().toISOString()
    };

    const nextVersion = Number(folio.version) + 1;

    if (isSupabaseConfigured) {
      try {
        const { error: vError } = await supabase
          .from('billing_folios')
          .update({ version: nextVersion, updated_at: new Date().toISOString() })
          .eq('id', parsed.folioId)
          .eq('version', parsed.version);

        if (!vError) {
          const { data: dbPayment, error: pError } = await supabase
            .from('billing_payments')
            .insert({
              property_id: folio.property_id,
              folio_id: parsed.folioId,
              provider: parsed.provider,
              method_type: parsed.methodType,
              status: 'succeeded',
              amount: parsed.money.amount,
              currency_code: parsed.money.currency,
              exchange_rate: parsed.money.exchangeRate,
              external_reference: parsed.externalReference || null,
              idempotency_key: parsed.idempotencyKey,
              version: 1
            })
            .select()
            .single();

          if (!pError && dbPayment) {
            return dbPayment;
          }
        }
      } catch (e) {
        console.warn('Supabase post failed, falling back to local DB:', e);
      }
    }

    // Local DB fallback
    localBillingDb.folios = localBillingDb.folios.map(f =>
      f.id === parsed.folioId ? { ...f, version: nextVersion, updated_at: new Date().toISOString() } : f
    );
    localBillingDb.payments.push(newPayment);
    await saveLocalDb();

    return newPayment;
  }

  // Create local invoice
  static async issueInvoice(payload: any) {
    const parsed = issueInvoiceSchema.parse(payload);
    await loadLocalDb();
    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    let folioDetails = await this.getFolioDetails(parsed.invoiceId);
    if (!folioDetails) throw new Error('Folio not found');

    const total = folioDetails.totals.charges - folioDetails.totals.discounts;
    const net = total / 1.21;
    const tax = total - net;

    const newInvoice = {
      id: `inv_${Date.now()}`,
      property_id: folioDetails.property_id,
      folio_id: folioDetails.id,
      bill_to_type: 'guest',
      bill_to_id: folioDetails.guest_id || 'guest_unknown',
      invoice_kind: parsed.mode,
      document_class: parsed.documentClass || 'B',
      status: 'issued',
      point_of_sale: parsed.pointOfSale || 1,
      invoice_number: localBillingDb.invoices.length + 1001,
      issue_date: new Date().toISOString().substring(0, 10),
      currency_code: folioDetails.totals.currency,
      exchange_rate: 1,
      subtotal: net,
      tax_total: tax,
      grand_total: total,
      paid_total: folioDetails.totals.payments,
      balance_due: folioDetails.totals.balance,
      arca_cae: parsed.mode === 'fiscal' ? `${Math.floor(10000000000000 + Math.random() * 90000000000000)}` : null,
      arca_cae_due_date: parsed.mode === 'fiscal' ? new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().substring(0, 10) : null,
      arca_qr_payload: parsed.mode === 'fiscal' ? `https://www.afip.gob.ar/fe/qr/?p=${Date.now()}` : null,
      version: 1,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const { data: dbInvoice, error } = await supabase
          .from('billing_invoices')
          .insert({
            property_id: folioDetails.property_id,
            folio_id: folioDetails.id,
            bill_to_type: 'guest',
            bill_to_id: folioDetails.guest_id || null,
            invoice_kind: parsed.mode,
            document_class: parsed.documentClass || 'B',
            status: 'issued',
            point_of_sale: parsed.pointOfSale || 1,
            invoice_number: newInvoice.invoice_number,
            issue_date: newInvoice.issue_date,
            currency_code: newInvoice.currency_code,
            exchange_rate: 1,
            subtotal: net,
            tax_total: tax,
            grand_total: total,
            paid_total: newInvoice.paid_total,
            balance_due: newInvoice.balance_due,
            arca_cae: newInvoice.arca_cae,
            arca_cae_due_date: newInvoice.arca_cae_due_date,
            arca_qr_payload: newInvoice.arca_qr_payload
          })
          .select()
          .single();

        if (!error && dbInvoice) {
          return dbInvoice;
        }
      } catch (e) {
        console.warn('Supabase insert failed, falling back to local DB:', e);
      }
    }

    localBillingDb.invoices.push(newInvoice);
    await saveLocalDb();
    return newInvoice;
  }

  // Get invoices by reservation
  static async getInvoicesByReservation(reservationId: string) {
    await loadLocalDb();
    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('billing_invoices')
          .select('*')
          .eq('reservation_id', reservationId);
        if (!error && data) return data;
      } catch {}
    }

    // Filter local invoices
    const foliosList = localBillingDb.folios.filter(f => f.reservation_id === reservationId).map(f => f.id);
    return localBillingDb.invoices.filter(i => foliosList.includes(i.folio_id));
  }

  // Generate Daily Close / Reconciliations Report
  static async getDailyCloseReport(propertyId: string) {
    await loadLocalDb();
    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    let payments: any[] = [];
    let invoices: any[] = [];

    if (isSupabaseConfigured) {
      try {
        const { data: pData } = await supabase.from('billing_payments').select('*').eq('property_id', propertyId);
        const { data: iData } = await supabase.from('billing_invoices').select('*').eq('property_id', propertyId);
        payments = pData || [];
        invoices = iData || [];
      } catch {}
    } else {
      payments = localBillingDb.payments.filter(p => p.property_id === propertyId);
      invoices = localBillingDb.invoices.filter(i => i.property_id === propertyId);
    }

    // Cash close calculations
    const cashTotal = payments.filter(p => p.provider === 'cash' && p.status === 'succeeded').reduce((sum, p) => sum + Number(p.amount), 0);
    const mpTotal = payments.filter(p => p.provider === 'mercadopago').reduce((sum, p) => sum + Number(p.amount), 0);
    const stripeTotal = payments.filter(p => p.provider === 'stripe').reduce((sum, p) => sum + Number(p.amount), 0);
    const bankTotal = payments.filter(p => p.provider === 'bank_transfer').reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      date: new Date().toISOString().substring(0, 10),
      propertyId,
      totalsByProvider: {
        cash: cashTotal,
        mercadopago: mpTotal,
        stripe: stripeTotal,
        bank_transfer: bankTotal
      },
      invoicesIssuedCount: invoices.length,
      revenueTotal: invoices.reduce((sum, i) => sum + Number(i.grand_total), 0)
    };
  }
}
