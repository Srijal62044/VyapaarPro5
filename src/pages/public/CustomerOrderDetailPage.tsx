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
import { SEO } from '../../components/common/SEO';
import { StoreProductDeliveryDetails } from '../../components/store/StoreProductDeliveryDetails';
import { SocialServiceOrderCard } from '../../components/store/SocialServiceOrderCard';

export const CustomerOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await storeDataService.getOrderById(id);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

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
            <h4 className="font-bold text-white text-sm">Payment Under Manual Review</h4>
            <p className="text-amber-200/80 leading-relaxed">
              We have received your payment submission. Our admin team will verify your transaction against our bank statement.
              Once approved, your delivery links, files, and activation instructions will unlock here automatically.
            </p>
          </div>
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
    </div>
  );
};
