import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MessageSquare,
  RefreshCw,
  FileCode,
  Check,
} from 'lucide-react';
import { StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { useSettings } from '../../contexts/SettingsContext';
import { SEO } from '../../components/common/SEO';
import { StoreProductDeliveryDetails } from '../../components/store/StoreProductDeliveryDetails';

export const StorePaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') || searchParams.get('orderId');
  const { settings } = useSettings();

  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollTimerRef = useRef<any>(null);

  // Authoritatively verify payment with backend endpoint
  const checkVerification = async (isManual = false) => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    if (isManual) setIsVerifying(true);

    try {
      // 1. Call server-side authoritative verify endpoint
      const res = await fetch(`/api/store/payment/verify?order_id=${encodeURIComponent(orderId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        const verifyData = await res.json();
        // 2. Fetch fresh order model
        const updatedOrder = await storeDataService.getOrderById(orderId);
        if (updatedOrder) {
          if (verifyData.status === 'PAID') {
            updatedOrder.status = 'PAID';
          } else if (verifyData.status === 'PAYMENT_REVIEW') {
            updatedOrder.status = 'PAYMENT_REVIEW';
          }
          setOrder(updatedOrder);
        }
      } else {
        const fallbackOrder = await storeDataService.getOrderById(orderId);
        setOrder(fallbackOrder);
      }
    } catch (err) {
      console.error('Failed to verify order status:', err);
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    checkVerification();
  }, [orderId]);

  // Polling for review updates
  useEffect(() => {
    if (!order || order.status === 'PAID' || order.status === 'REJECTED' || order.status === 'CANCELLED' || order.status === 'DELIVERED') {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    if (order.status === 'PAYMENT_PENDING' || order.status === 'CREATED' || order.status === 'PAYMENT_REVIEW') {
      pollTimerRef.current = setInterval(() => {
        setPollCount((prev) => {
          if (prev >= 45) {
            clearInterval(pollTimerRef.current);
            return prev;
          }
          checkVerification(false);
          return prev + 1;
        });
      }, 5000);

      return () => {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      };
    }
  }, [order?.status]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold text-white">Checking Transaction Status</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to server verification engine...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Order Reference Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            No valid order reference was found. If you completed a payment, check your customer dashboard or contact engineering support.
          </p>
          <div className="pt-2 space-y-2">
            <Link
              to="/app/orders"
              className="block w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Go to Customer Orders
            </Link>
            <Link
              to="/store"
              className="block w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs transition"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const priceRupees = Math.round(order.total_paise / 100);
  const isPaid = order.status === 'PAID' || order.status === 'DELIVERED';
  const isRejected = order.status === 'REJECTED' || order.status === 'CANCELLED';
  const isUnderReview = !isPaid && !isRejected; // PAYMENT_REVIEW, PAYMENT_PENDING, CREATED
  const productName = order.items && order.items.length > 0
    ? order.items.map((i) => i.product_name_snapshot).join(', ')
    : 'Digital Product';
  const latestPayment = order.payments?.[0];
  const gatewayOrderId = latestPayment?.gateway_order_id;
  const transactionId = latestPayment?.gateway_payment_id;

  return (
    <div className="min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <SEO title="Payment Status | VyapaarPro Store" description="Digital product order payment status." />

      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Status Icon & Header */}
        <div className="text-center space-y-3">
          {isPaid ? (
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : isRejected ? (
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/40">
              <Clock className="w-8 h-8" />
            </div>
          )}

          <div>
            <span className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider block mb-1">
              Order {order.order_number}
            </span>
            <h1 className="text-2xl font-black text-white">
              {isPaid
                ? 'Payment Confirmed & Delivered'
                : isRejected
                ? 'Payment Rejected'
                : 'Payment Under Review'}
            </h1>
            <p className="text-xs text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed font-normal">
              {isPaid
                ? 'Your transaction has been confirmed and approved. Your digital product files have been delivered and access is permanently unlocked.'
                : isRejected
                ? order.payment_rejection_reason || 'The transaction could not be verified or was rejected during review.'
                : 'Your payment has been received and is currently under review. You will be contacted within a few hours.'}
            </p>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
            <span className="text-slate-400">Order ID</span>
            <span className="font-mono font-bold text-white">{order.order_number}</span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
            <span className="text-slate-400">Product</span>
            <span className="font-semibold text-white max-w-[260px] truncate text-right">{productName}</span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
            <span className="text-slate-400">Amount</span>
            <span className="font-bold text-white">₹{priceRupees.toLocaleString('en-IN')} INR</span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
            <span className="text-slate-400">Payment Status</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isPaid
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isRejected
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {isPaid ? 'PAID / DELIVERED' : isRejected ? 'REJECTED' : 'Under Review'}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
            <span className="text-slate-400">Date & Time</span>
            <span className="text-slate-200">
              {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>

          {gatewayOrderId && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400">FamGateway Order ID</span>
              <span className="font-mono text-indigo-300">{gatewayOrderId}</span>
            </div>
          )}
        </div>

        {/* Delivered Details if Paid */}
        {isPaid && (
          <StoreProductDeliveryDetails order={order} />
        )}

        {/* Note that product will be delivered after confirmation */}
        {isUnderReview && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2.5">
            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <p className="leading-relaxed">
              <strong className="text-amber-200">Note:</strong> Your digital product package will be delivered and download access unlocked immediately after payment confirmation.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {isPaid ? (
            <Link
              to="/app/downloads"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Access Your Downloads Vault</span>
            </Link>
          ) : (
            <Link
              to={`/app/orders/${order.id}`}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-2"
            >
              <span>View Order in Customer Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/store"
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition"
            >
              Continue Browsing
            </Link>
            <a
              href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-semibold text-center transition flex items-center justify-center space-x-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>

        {/* Trust Notice */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>VyapaarPro Secure Checkout • Manual Verification Guarantee</span>
          </p>
        </div>
      </div>
    </div>
  );
};
