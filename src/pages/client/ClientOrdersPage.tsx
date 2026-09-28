import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  CreditCard,
  PackageOpen,
  Send,
  XCircle,
  Layers,
} from 'lucide-react';
import { StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { useAuth } from '../../contexts/AuthContext';
import { SEO } from '../../components/common/SEO';

export const ClientOrdersPage: React.FC = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        const data = await storeDataService.getCustomerOrders(profile.id);
        setOrders(data);
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [profile?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>PAID</span>
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>DELIVERED</span>
          </span>
        );
      case 'PAYMENT_REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>UNDER REVIEW</span>
          </span>
        );
      case 'PAYMENT_PENDING':
      case 'CREATED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>PAYMENT PENDING</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>REJECTED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getFulfillmentBadge = (status?: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            Delivered
          </span>
        );
      case 'READY_FOR_DELIVERY':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
            Ready For Delivery
          </span>
        );
      case 'UNFULFILLED':
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/40">
            Unfulfilled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="My Store Orders | VyapaarPro Workspace" description="View and manage your digital store orders and invoices." />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            <span>My Store Orders</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your digital product purchases, review statuses, and invoice receipts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/app/downloads"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>My Downloads</span>
          </Link>
          <Link
            to="/store"
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            Browse Store
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your orders...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const priceRupees = Math.round(order.total_paise / 100);
            const canDownload = order.status === 'PAID' || order.status === 'DELIVERED';

            return (
              <div
                key={order.id}
                className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-white">{order.order_number}</span>
                    {getStatusBadge(order.status)}
                    {getFulfillmentBadge(order.fulfillment_status)}
                    <span className="text-xs text-slate-500 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                    </span>
                  </div>

                  {/* Order items snapshot */}
                  <div className="text-xs text-slate-300">
                    {order.items && order.items.length > 0 ? (
                      <span className="font-medium text-indigo-300">
                        {order.items.map((i) => i.product_name_snapshot).join(', ')}
                      </span>
                    ) : (
                      <span>Digital Product Order</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end space-x-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-white">
                      ₹{priceRupees.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">INR</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canDownload && (
                      <Link
                        to="/app/downloads"
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition flex items-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </Link>
                    )}

                    <Link
                      to={`/app/orders/${order.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center space-x-1"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <PackageOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Orders Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            You haven't purchased any digital products yet. Visit the Digital Store to explore downloadable templates and code packages.
          </p>
          <Link
            to="/store"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Digital Store</span>
          </Link>
        </div>
      )}
    </div>
  );
};
