import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  CreditCard,
  ExternalLink,
  XCircle,
  FileCode,
} from 'lucide-react';
import { StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { useAuth } from '../../contexts/AuthContext';
import { SEO } from '../../components/common/SEO';

export const ClientOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();

  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await storeDataService.getOrderById(id, profile?.id);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [id, profile?.id]);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Order Not Found</h2>
        <p className="text-xs text-slate-400">
          This order could not be located or you do not have permission to view it.
        </p>
        <Link
          to="/app/orders"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const priceRupees = Math.round(order.total_paise / 100);
  const isPaid = order.status === 'PAID' || order.status === 'DELIVERED';
  const isRejected = order.status === 'REJECTED';
  const isUnderReview = order.status === 'PAYMENT_REVIEW';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SEO title={`Order ${order.order_number} | VyapaarPro Workspace`} description="Order confirmation and download receipt." />

      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/orders"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders List</span>
        </Link>

        {isPaid && (
          <Link
            to="/app/downloads"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Go to Downloads</span>
          </Link>
        )}
      </div>

      {/* Main Order Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider block mb-1">
              Digital Product Purchase Receipt
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">{order.order_number}</h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Purchased on {new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end space-y-1">
            <span className="text-xs text-slate-400 block">Payment Status</span>
            {isPaid ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PAID & VERIFIED</span>
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-3.5 h-3.5" />
                <span>REJECTED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>{isUnderReview ? 'PAYMENT UNDER REVIEW' : order.status}</span>
              </span>
            )}
            <span className="text-[10px] text-slate-500 font-mono">
              Fulfillment: {order.fulfillment_status || 'UNFULFILLED'}
            </span>
          </div>
        </div>

        {/* Notice for orders under review */}
        {isUnderReview && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-3">
            <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-0.5">Payment Under Review</h4>
              <p className="leading-relaxed">
                Your payment has been received and is currently under review. You will be contacted within a few hours, after which download access will be unlocked.
              </p>
            </div>
          </div>
        )}

        {/* Itemized Products */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Ordered Items ({order.items?.length || 1})
          </h3>

          <div className="divide-y divide-slate-800">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">{item.product_name_snapshot}</h4>
                      <span className="text-[11px] text-slate-400">Qty: {item.quantity} • Perpetual License</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white">
                    ₹{Math.round(item.total_paise / 100).toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Digital Product Package</h4>
                  <span className="text-[11px] text-slate-400">Qty: 1</span>
                </div>
                <span className="text-sm font-bold text-white">
                  ₹{priceRupees.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Total Summary */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>₹{priceRupees.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Discounts</span>
            <span>₹0</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-white">
            <span>Total</span>
            <span className="text-base text-indigo-400">₹{priceRupees.toLocaleString('en-IN')} INR</span>
          </div>
        </div>

        {/* Payment & Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="space-y-1 text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Customer Information
            </span>
            <p className="text-white font-medium">{order.customer_name || 'Customer'}</p>
            <p>{order.customer_email || '—'}</p>
            {order.customer_phone && <p>{order.customer_phone}</p>}
          </div>

          <div className="space-y-1 text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Payment Gateway Reference
            </span>
            <p className="text-white font-medium">FamGateway Online Checkout</p>
            <p className="font-mono text-[11px]">
              Ref: {order.payments?.[0]?.gateway_payment_id || order.payments?.[0]?.gateway_order_id || 'Manual Review Queue'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
