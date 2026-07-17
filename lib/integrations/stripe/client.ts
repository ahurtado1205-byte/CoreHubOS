export interface StripePaymentIntentConfig {
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export class StripeIntegration {
  // Simulate Stripe client-secret and PaymentIntent creation
  static async createPaymentIntent(config: StripePaymentIntentConfig) {
    console.log('[Stripe integration] Creating intent:', config);
    
    // Simulate API fetch delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      id: `pi_str_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount: config.amountMinor,
      currency: config.currency,
      status: 'requires_payment_method',
      client_secret: `src_client_secret_${Math.random().toString(36).substring(2, 12)}`,
      idempotency_key: config.idempotencyKey
    };
  }

  // Handle mock refund API call
  static async refundPayment(paymentIntentId: string, amountMinor: number) {
    console.log(`[Stripe integration] Refunding ${amountMinor} on ${paymentIntentId}`);
    return {
      id: `re_str_${Date.now()}`,
      payment_intent: paymentIntentId,
      amount: amountMinor,
      status: 'succeeded'
    };
  }
}
