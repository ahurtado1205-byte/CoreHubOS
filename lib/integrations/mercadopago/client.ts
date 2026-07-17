export interface MercadoPagoPaymentConfig {
  amount: number;
  description: string;
  payerEmail: string;
  idempotencyKey: string;
}

export class MercadoPagoIntegration {
  // Simulate payment/order creation for Checkout Pro, Bricks and QR Point
  static async createPayment(config: MercadoPagoPaymentConfig) {
    console.log('[Mercado Pago integration] Initiating payment:', config);
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      id: `mp_pay_${Date.now()}`,
      status: 'pending',
      status_detail: 'pending_waiting_transfer',
      transaction_amount: config.amount,
      idempotency_key: config.idempotencyKey,
      point_of_interaction: {
        transaction_data: {
          qr_code: `https://www.mercadopago.com.ar/qr/${Math.random().toString(36).substring(2, 8)}`,
          ticket_url: 'https://www.mercadopago.com.ar/ticket/example'
        }
      }
    };
  }

  // Simulate refund API call
  static async refundPayment(paymentId: string, amount: number) {
    console.log(`[Mercado Pago integration] Refunding ${amount} on ${paymentId}`);
    return {
      id: `mp_ref_${Date.now()}`,
      payment_id: paymentId,
      amount: amount,
      status: 'approved'
    };
  }
}
