import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyWebhookSignature } from '@/lib/webhookValidator';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-signature') || request.headers.get('x-adyen-signature');
    const rawBody = await request.text();

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    console.log('[Webhook Adyen] Notification received:', body);

    // Extract unique event ID from Adyen's typical nested structure (NotificationRequestItem.pspReference)
    const notificationItem = body.notificationItems?.[0]?.NotificationRequestItem;
    const eventId = String(
      notificationItem?.pspReference || 
      body.pspReference || 
      `evt_adyen_${Date.now()}`
    );

    // 1. Signature Verification (HMAC-SHA256 & Timestamps)
    const secret = process.env.ADYEN_WEBHOOK_SECRET || 'adyen_test_secret';
    // Adyen can sign with signature header
    const verification = verifyWebhookSignature(rawBody, signature, secret);

    if (!verification.isValid) {
      console.error(`[Webhook Adyen] Signature verification failed: ${verification.reason}`);
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
          .eq('provider', 'adyen')
          .eq('event_id', eventId)
          .maybeSingle();

        if (existing) {
          console.warn(`[Webhook Adyen] Duplicate event skipped: ${eventId}`);
          return NextResponse.json({ notificationResponse: '[accepted]', duplicate: true });
        }

        // Insert new inbox log for idempotency
        await supabase.from('billing_webhook_events').insert({
          provider: 'adyen',
          event_id: eventId,
          signature_valid: true,
          payload_json: body,
          processed_at: new Date().toISOString(),
          result: 'success'
        });
      } catch (e) {
        console.warn('Database logging failed, bypass for test:', e);
      }
    }

    // Adyen expects a quick 200 [accepted] acknowledgment response
    return NextResponse.json({ notificationResponse: '[accepted]' });
  } catch (error: any) {
    console.error('[Webhook Adyen] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
