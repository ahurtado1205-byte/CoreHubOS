import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/webhookValidator';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('stripe-signature');
    const rawBody = await request.text();
    
    // Parse JSON payload
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventId = String(body.id || `evt_str_${Date.now()}`);
    console.log(`[Webhook Stripe] Received event ${eventId}:`, body.type);

    // 1. Signature Verification (HMAC-SHA256 & Timestamps)
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'stripe_test_secret';
    const verification = verifyWebhookSignature(rawBody, signature, secret);

    if (!verification.isValid) {
      console.error(`[Webhook Stripe] Signature verification failed: ${verification.reason}`);
      return NextResponse.json(
        { error: 'Invalid webhook signature', reason: verification.reason },
        { status: 401 }
      );
    }

    // 2. Idempotency Check using the database
    const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (isSupabaseConfigured) {
      try {
        const { data: existing } = await supabase
          .from('billing_webhook_events')
          .select('id')
          .eq('provider', 'stripe')
          .eq('event_id', eventId)
          .maybeSingle();

        if (existing) {
          console.warn(`[Webhook Stripe] Duplicate event skipped: ${eventId}`);
          return NextResponse.json({ success: true, duplicate: true, message: 'Event already processed' });
        }

        // Insert event into inbox log to secure idempotency
        await supabase.from('billing_webhook_events').insert({
          provider: 'stripe',
          event_id: eventId,
          signature_valid: true,
          payload_json: body,
          processed_at: new Date().toISOString(),
          result: 'success'
        });
      } catch (e) {
        console.warn('Database idempotency logging failed, bypass for test:', e);
      }
    }

    return NextResponse.json({ received: true, verified: true });
  } catch (error: any) {
    console.error('[Webhook Stripe] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
