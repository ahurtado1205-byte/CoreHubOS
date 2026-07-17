import { NextResponse } from 'next/server';
import { BillingService } from '@/services/billingService';
import { StripeIntegration } from '@/lib/integrations/stripe/client';
import { MercadoPagoIntegration } from '@/lib/integrations/mercadopago/client';
import { ArcaFiscalAdapter } from '@/lib/integrations/arca/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const idempotencyKey = request.headers.get('idempotency-key') || `ikey_${Date.now()}`;

    // 1. POST /api/billing/folios
    if (slug.length === 1 && slug[0] === 'folios') {
      const folio = await BillingService.createFolio(body);
      return NextResponse.json(folio);
    }

    // 2. POST /api/billing/folios/[id]/lines (Append-only Ledger cargo)
    if (slug.length === 3 && slug[0] === 'folios' && slug[2] === 'lines') {
      const folioId = slug[1];
      const line = await BillingService.addCharge({
        version: body.version,
        idempotencyKey,
        folioId,
        entryType: body.line_type === 'charge' ? 'extra_charge' : body.line_type,
        sourceType: body.source_type || 'manual',
        serviceDate: body.service_date,
        description: body.description,
        quantity: body.qty || 1,
        unitAmount: body.unit_amount_minor / 100, // convert minor to standard units
        metadata: body.metadata || {}
      });
      return NextResponse.json({
        ...line,
        gross_minor: line.gross_amount * 100,
        tax_minor: line.tax_amount * 100,
        total_minor: line.gross_amount * 100,
        status: 'posted',
        version: line.version || 1
      });
    }

    // 3. POST /api/billing/payment-intents
    if (slug.length === 1 && slug[0] === 'payment-intents') {
      const { provider, amount_minor, currency } = body;
      let intent: any = null;

      if (provider === 'stripe') {
        intent = await StripeIntegration.createPaymentIntent({
          amountMinor: amount_minor,
          currency,
          idempotencyKey
        });
      } else if (provider === 'mercadopago') {
        const mpResult = await MercadoPagoIntegration.createPayment({
          amount: amount_minor / 100,
          description: `Cobro Intento ${idempotencyKey}`,
          payerEmail: body.customer?.email || 'guest@example.com',
          idempotencyKey
        });
        intent = {
          id: mpResult.id,
          provider: 'mercadopago',
          provider_intent_id: mpResult.id,
          status: 'requires_payment_method',
          checkout: {
            public_key: 'pk_live_mp_mock',
            client_secret: null,
            redirect_url: mpResult.point_of_interaction.transaction_data.ticket_url
          }
        };
      } else {
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
      }

      return NextResponse.json(intent);
    }

    // 4. POST /api/billing/invoices (Fiscal and Proforma composer)
    if (slug.length === 1 && slug[0] === 'invoices') {
      let arcaData = null;
      if (body.mode === 'fiscal') {
        arcaData = await ArcaFiscalAdapter.requestCAE({
          documentClass: body.document_class || 'B',
          receiverVatCondition: body.receiver?.vat_condition || 'consumer_final',
          receiverDocNumber: body.receiver?.document_number || '30111222',
          netAmountMinor: body.net_minor || 1000,
          taxAmountMinor: body.tax_minor || 210,
          grandTotalMinor: body.total_minor || 1210,
          pointOfSale: Number(body.point_of_sale || 1)
        });
      }

      const invoice = await BillingService.issueInvoice({
        version: body.version || 1,
        idempotencyKey,
        invoiceId: body.folio_id,
        mode: body.mode,
        documentClass: body.document_class,
        pointOfSale: Number(body.point_of_sale || 1)
      });

      return NextResponse.json({
        ...invoice,
        arca: arcaData ? {
          cae: arcaData.cae,
          caeDueDate: arcaData.caeDueDate,
          qrIncluded: true
        } : undefined
      });
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error: any) {
    console.error('API Billing POST Error:', error);
    if (error.message && error.message.includes('409')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 400 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // 1. GET /api/billing/reports/daily-close?propertyId=...
    if (slug.length === 2 && slug[0] === 'reports' && slug[1] === 'daily-close') {
      const propertyId = searchParams.get('propertyId') || 'prop_1';
      const report = await BillingService.getDailyCloseReport(propertyId);
      return NextResponse.json(report);
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  } catch (error: any) {
    console.error('API Billing GET Error:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 400 });
  }
}
