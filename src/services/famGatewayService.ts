import { StoreOrder } from '../types';

/**
 * FamGateway Payment Gateway Service
 *
 * Implements the official FamGateway integration:
 * Endpoint: POST https://famgateway.in/api/create-order.php
 * Authentication: Authorization: Bearer ${FAMGATEWAY_API_KEY} (Server-side)
 * Payload: { amount, redirect_url }
 */

export interface CreatePaymentSessionParams {
  order: StoreOrder;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface PaymentSessionResult {
  success: boolean;
  paymentUrl?: string;
  gatewayOrderId?: string;
  error?: string;
}

export const famGatewayService = {
  /**
   * Initializes a payment order session via the server-side endpoint with auto-retry
   */
  async createCheckoutSession(params: CreatePaymentSessionParams): Promise<PaymentSessionResult> {
    const maxAttempts = 3;
    let lastError = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch('/api/store/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: params.order.id,
            order: params.order,
          }),
        });

        const rawText = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          const isWarmup = rawText.includes('<!doctype') || rawText.includes('<html') || rawText.includes('Starting Server');
          if (isWarmup && attempt < maxAttempts) {
            console.warn(`Dev server warming up, retrying payment creation (attempt ${attempt}/${maxAttempts})...`);
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw new Error(
            isWarmup
              ? 'Server payment service is initializing. Please try again.'
              : rawText || 'Invalid server response'
          );
        }

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || 'Failed to initialize FamGateway payment order.');
        }

        return {
          success: true,
          paymentUrl: data.paymentUrl,
          gatewayOrderId: data.gatewayOrderId,
        };
      } catch (err: any) {
        lastError = err.message || 'Payment initialization failed.';
        if (attempt < maxAttempts && (lastError.includes('initializing') || lastError.includes('unavailable') || lastError.includes('fetch'))) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        break;
      }
    }

    console.error('FamGateway checkout error:', lastError);
    return {
      success: false,
      error: lastError || 'Payment initialization failed. Please try again.',
    };
  },
};
