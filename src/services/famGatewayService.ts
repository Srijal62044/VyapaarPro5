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
   * Initializes a payment order session via the server-side endpoint
   */
  async createCheckoutSession(params: CreatePaymentSessionParams): Promise<PaymentSessionResult> {
    try {
      const orderId =
        params?.order?.id ||
        (params?.order as any)?.order_id ||
        (params?.order as any)?.orderNumber ||
        (params?.order as any)?.order_number ||
        (params as any)?.orderId;

      console.log('[checkout] payment/create request starting', { hasOrderId: !!orderId });

      const response = await fetch('/api/store/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      console.log(`[checkout] payment/create status: ${response.status}`);
      const data = await response.json();
      console.log('[checkout] payment/create response received', {
        status: response.status,
        success: Boolean(data?.success),
      });

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize FamGateway payment order.');
      }

      return {
        success: true,
        paymentUrl: data.paymentUrl,
        gatewayOrderId: data.gatewayOrderId,
      };
    } catch (err: any) {
      console.error('FamGateway checkout error:', err);
      return {
        success: false,
        error: err.message || 'Payment initialization failed. Please try again.',
      };
    }
  },
};
