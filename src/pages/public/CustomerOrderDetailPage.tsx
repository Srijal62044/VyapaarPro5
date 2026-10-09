import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Shield,
  Layers,
  FileCode,
  Download,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { famGatewayService } from '../../services/famGatewayService';
import { SEO } from '../../components/common/SEO';
import { StoreProductDeliveryDetails } from '../../components/store/StoreProductDeliveryDetails';
import { SocialServiceOrderCard } from '../../components/store/SocialServiceOrderCard';
import { PaymentQRModal } from '../../components/payment/PaymentQRModal';

export const CustomerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Payment QR modal state
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    orderId: string;
    orderNumber: string;
    amount: number;
    upiUrl?: string;
    qrUrl?: string;
    merchantVpa?: string;
    merchantName?: string;
  } | null>(null);

  const loadOrder = async () => {
    if (!id) return;
    try {
      const data = await storeDataService.getOrderById(id);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handlePayNow = async () => {
    if (!order) return;
    setIsInitializingPayment(true);
    setPaymentError('');

    try {
      const priceRupees = Math.round(order.total_paise / 100);
      const sessionResult = await famGatewayService.createCheckoutSession({
        order,
        customer: {
          name: order.customer_name || 'Customer',
          email: order.customer_email || '',
          phone: order.customer_phone,
        },
      });

      if (sessionResult.success) {
        setQrModalData({
          isOpen: true,
          orderId: order.id,
          orderNumber: order.order_number,
          amount: priceRupees,
          upiUrl: sessionResult.upiUrl,
          qrUrl: sessionResult.qrUrl,
          merchantVpa: sessionResult.merchantVpa,
          merchantName: sessionResult.merchantName,
        });
      } else {
        setPaymentError(sessionResult.error || 'Failed to initialize payment gateway.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment initialization failed.');
    } finally {
      setIsInitializingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Order Record Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested order does not exist or may have expired. Please verify your order number.
        </p>
        <div className="pt-2">
          <Link
            to="/orders"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
        </div>
      </div>
    );
  }

  const priceRupees = Math.round(order.total_paise / 100);
  const isPaidOrDelivered = order.status === 'PAID' || order.status === 'DELIVERED';
  const isUnderReview = order.status === 'PAYMENT_REVIEW';
  const isPending = order.status === 'PAYMENT_PENDING' || order.status === 'CREATED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      <SEO
        title={`Order ${order.order_number} | VyapaarPro`}
        description="View order receipt, payment verification status, and digital delivery package."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-3">
          <Link
            to="/orders"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Back to Orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
              Digital Store Order
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">{order.order_number}</h1>
          </div>
        </div>

        <div>
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border inline-flex items-center space-x-1.5 ${
              isPaidOrDelivered
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isUnderReview
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {isPaidOrDelivered && <CheckCircle2 className="w-3.5 h-3.5" />}
            {isUnderReview && <Clock className="w-3.5 h-3.5" />}
            <span>{order.status}</span>
          </span>
        </div>
      </div>

      {/* Verification Notice if Under Review */}
      {isUnderReview && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-3.5 shadow-lg">
          <Clock className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-1">
            <h4 className="font-bold text-white text-sm">Awaiting Final Settlement Confirmation</h4>
            <p className="text-amber-200/80 leading-relaxed">
              Your transaction is being confirmed by the banking network. Once settlement is recorded by the gateway, your delivery package, downloads, and activation instructions will unlock here automatically.
            </p>
          </div>
        </div>
      )}

      {/* Payment Pending Action Banner */}
      {!isPaidOrDelivered && !isUnderReview && (
        <div className="p-6 rounded-3xl bg-indigo-950/40 border border-indigo-500/30 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <h4 className="font-bold text-white text-base">Payment Required</h4>
            </div>
            <p className="text-xs text-slate-300">
              Complete your payment of <span className="font-bold text-white">₹{priceRupees}</span> via FamGateway UPI to unlock access and delivery instantly.
            </p>
            {paymentError && <p className="text-xs text-rose-400 mt-1">{paymentError}</p>}
          </div>

          <button
            onClick={handlePayNow}
            disabled={isInitializingPayment}
            className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isInitializingPayment ? (
              <span>Preparing UPI QR...</span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{priceRupees} via UPI QR</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Social Service Dynamic Ordering Details Snapshot */}
      <SocialServiceOrderCard order={order} isAdminView={false} />

      {/* DELIVERED PACKAGE SECTION - Visible when Approved */}
      {isPaidOrDelivered && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              Approved Product & Access Package
            </h2>
          </div>
          <StoreProductDeliveryDetails order={order} />
        </div>
      )}

      {/* Order Summary & Financials */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
          <span>Purchased Items</span>
        </h3>

        {/* Items Table */}
        <div className="divide-y divide-slate-800">
          {order.items?.map((item) => {
            const itemRupees = Math.round(item.total_paise / 100);
            return (
              <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">{item.product_name_snapshot}</h4>
                  <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-white">₹{itemRupees}</p>
              </div>
            );
          })}
        </div>

        {/* Total calculation */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-base font-bold">
          <span className="text-slate-300">Total Amount Paid</span>
          <span className="text-white text-lg">₹{priceRupees}</span>
        </div>

        {/* Customer & Timestamp info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Customer Info</span>
            <p className="text-white mt-1">{order.customer_name || 'Customer'}</p>
            <p>{order.customer_email || 'No email'}</p>
            {order.customer_phone && <p>{order.customer_phone}</p>}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Order Timestamp</span>
            <p className="text-white mt-1">{new Date(order.created_at).toLocaleString('en-IN')}</p>
            <p className="text-indigo-400 font-mono text-[11px] mt-0.5">Reference: {order.order_number}</p>
          </div>
        </div>
      </div>

      {/* In-Page Dynamic UPI QR Modal */}
      {qrModalData && (
        <PaymentQRModal
          isOpen={qrModalData.isOpen}
          onClose={() => setQrModalData(null)}
          orderId={qrModalData.orderId}
          orderNumber={qrModalData.orderNumber}
          amount={qrModalData.amount}
          upiUrl={qrModalData.upiUrl}
          qrUrl={qrModalData.qrUrl}
          merchantVpa={qrModalData.merchantVpa}
          merchantName={qrModalData.merchantName}
          title={`Pay ₹${qrModalData.amount} for Order ${order.order_number}`}
          subtitle="Scan the QR in your UPI app or tap Open in UPI App."
          onPaymentSuccess={() => {
            setQrModalData(null);
            loadOrder();
          }}
        />
      )}
    </div>
  );
};
