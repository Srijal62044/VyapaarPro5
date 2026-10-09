import { StoreOrder } from '../types';

/**
 * FamGateway Payment Gateway Service (Zero-Redirect In-Page Architecture)
 *
 * Implements:
 * 1. Server-to-server Order & Dynamic UPI QR Creation (POST /api/famgateway/create-order or /api/store/payment/create)
 * 2. In-Page Dynamic UPI Intent (`upi://pay?...`) & Base64 QR Code
 * 3. Client Polling (GET /api/famgateway/order-status/:orderId)
 * 4. Fallback Instant UTR Verification (POST /api/famgateway/verify-utr)
 * 5. Webhook Settlement Notification (POST /api/famgateway/webhook)
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
  orderId?: string;
  orderNumber?: string;
  amount?: number;
  currency?: string;
  paymentUrl?: string;
  gatewayOrderId?: string;
  upiUrl?: string;
  qrUrl?: string;
  expiresAt?: string;
  merchantVpa?: string;
  merchantName?: string;
  error?: string;
}

export interface OrderStatusResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  status: string;
  paid: boolean;
  order?: any;
  error?: string;
}

export interface VerifyUtrResult {
  success: boolean;
  status?: string;
  orderId?: string;
  orderNumber?: string;
  message?: string;
  error?: string;
}

export const famGatewayService = {
  /**
   * Initializes an in-page payment order session returning dynamic QR & UPI intent (zero external redirects)
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

      // Try /api/famgateway/create-order first, fallback to /api/store/payment/create
      let response = await fetch('/api/famgateway/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount: params?.order?.total_paise ? params.order.total_paise / 100 : undefined,
          customerName: params?.customer?.name,
          customerPhone: params?.customer?.phone,
        }),
      });

      if (!response.ok) {
        console.log('[checkout] trying /api/store/payment/create route');
        response = await fetch('/api/store/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
          }),
        });
      }

      console.log(`[checkout] payment create status: ${response.status}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment session.');
      }

      return {
        success: true,
        orderId: data.orderId || orderId,
        orderNumber: data.orderNumber,
        amount: data.amount,
        currency: data.currency || 'INR',
        paymentUrl: data.paymentUrl,
        gatewayOrderId: data.gatewayOrderId,
        upiUrl: data.upiUrl,
        qrUrl: data.qrUrl,
        expiresAt: data.expiresAt,
        merchantVpa: data.merchantVpa,
        merchantName: data.merchantName,
      };
    } catch (err: any) {
      console.error('FamGateway checkout initialization error:', err);
      return {
        success: false,
        error: err.message || 'Payment initialization failed. Please try again.',
      };
    }
  },

  /**
   * Polls the backend order status endpoint to detect payment settlement without page reload
   */
  async checkOrderStatus(orderIdentifier: string): Promise<OrderStatusResult> {
    try {
      if (!orderIdentifier) {
        return { success: false, status: 'UNKNOWN', paid: false, error: 'No order ID provided' };
      }

      const res = await fetch(`/api/famgateway/order-status/${encodeURIComponent(orderIdentifier)}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        // Fallback to /api/store/payment/verify
        const fallbackRes = await fetch(`/api/store/payment/verify?order_id=${encodeURIComponent(orderIdentifier)}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const isPaid = fallbackData.status === 'PAID' || fallbackData.status === 'DELIVERED';
          return {
            success: true,
            orderId: fallbackData.orderId,
            orderNumber: fallbackData.orderNumber,
            status: fallbackData.status || 'PENDING',
            paid: isPaid,
          };
        }
        return { success: false, status: 'PENDING', paid: false };
      }

      const data = await res.json();
      return {
        success: Boolean(data.success),
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        status: data.status || 'PENDING',
        paid: Boolean(data.paid || data.status === 'PAID' || data.status === 'DELIVERED'),
        order: data.order,
      };
    } catch (err: any) {
      console.warn('Status poll warning:', err?.message);
      return { success: false, status: 'PENDING', paid: false, error: err.message };
    }
  },

  /**
   * Submits a 12-digit UPI UTR / Reference number for instant client confirmation
   */
  async verifyUtr(orderId: string, utr: string, senderName?: string): Promise<VerifyUtrResult> {
    try {
      const res = await fetch('/api/famgateway/verify-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          utr,
          senderName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify UPI reference number.');
      }

      return {
        success: true,
        status: data.status,
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        message: data.message,
      };
    } catch (err: any) {
      console.error('UTR verification error:', err);
      return {
        success: false,
        error: err.message || 'Could not verify UPI reference number.',
      };
    }
  },
};
