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
} from 'lucide-react';
import { StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { SEO } from '../../components/common/SEO';

export const AdminStoreOrderDetailPage: React.FC = () => {
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
        console.error('Failed to load order inspection:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading order transaction details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Order Record Not Found</h2>
        <Link
          to="/admin/store/orders"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store Orders</span>
        </Link>
      </div>
    );
  }

  const priceRupees = Math.round(order.total_paise / 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SEO title={`Order ${order.order_number} | VyapaarPro Admin`} description="Inspect transaction details and payment logs." />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/store/orders"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[11px] font-mono text-violet-400 font-semibold uppercase tracking-wider block mb-0.5">
              Order Inspection Log
            </span>
            <h1 className="text-xl font-black text-white">{order.order_number}</h1>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            order.status === 'PAID'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : order.status === 'PAYMENT_FAILED'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}
        >
          {order.status}
        </span>
      </div>

      {/* Main Order Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Customer & Transaction Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Customer Details
            </span>
            <p className="text-white font-semibold">{order.customer_name || 'Anonymous Guest'}</p>
            <p className="text-slate-400">{order.customer_email || 'No email'}</p>
            {order.customer_phone && <p className="text-slate-400">{order.customer_phone}</p>}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Timestamps
            </span>
            <p className="text-slate-300">
              Created: {new Date(order.created_at).toLocaleString('en-IN')}
            </p>
            {order.updated_at && (
              <p className="text-slate-400">
                Updated: {new Date(order.updated_at).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Total Amount
            </span>
            <p className="text-lg font-black text-white">₹{priceRupees.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-slate-500 block">{order.currency} • Fixed Digital Rate</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Purchased Item Snapshots
          </h3>
          <div className="bg-slate-950 rounded-2xl border border-slate-800 divide-y divide-slate-800/80">
            {order.items && order.items.length > 0 ? (
              order.items.map((i) => (
                <div key={i.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-semibold text-white">{i.product_name_snapshot}</h4>
                    <span className="text-[11px] text-slate-500 font-mono">Product ID: {i.product_id || '—'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-white">
                      ₹{Math.round(i.total_paise / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Qty: {i.quantity}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-slate-400">Digital Item Snapshot</div>
            )}
          </div>
        </div>

        {/* Payment Transaction Records */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Payment Gateway Transaction Logs
          </h3>

          {order.payments && order.payments.length > 0 ? (
            <div className="space-y-3">
              {order.payments.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-violet-400" />
                      <span className="font-bold text-white uppercase">{p.gateway}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                    <p>Gateway Order ID: {p.gateway_order_id || '—'}</p>
                    <p>Gateway Payment ID: {p.gateway_payment_id || '—'}</p>
                  </div>

                  {p.raw_reference_metadata && (
                    <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                      <pre className="overflow-x-auto bg-slate-900 p-2 rounded-lg font-mono">
                        {JSON.stringify(p.raw_reference_metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500 text-center">
              No gateway payment transaction records logged for this order.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
