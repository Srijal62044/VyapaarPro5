import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  FileCode,
  ExternalLink,
  ShieldCheck,
  PackageOpen,
  ArrowRight,
  Sparkles,
  Key,
  Lock,
} from 'lucide-react';
import { StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { useAuth } from '../../contexts/AuthContext';
import { SEO } from '../../components/common/SEO';

export const CustomerDownloadsPage: React.FC = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        if (profile?.id) {
          const data = await storeDataService.getCustomerOrders(profile.id);
          // Only paid or delivered orders
          setOrders(data.filter((o) => o.status === 'PAID' || o.status === 'DELIVERED'));
        } else {
          const localOrderIds: string[] = JSON.parse(localStorage.getItem('vp_my_order_ids') || '[]');
          if (localOrderIds.length > 0) {
            const list: StoreOrder[] = [];
            for (const id of localOrderIds) {
              const o = await storeDataService.getOrderById(id);
              if (o && (o.status === 'PAID' || o.status === 'DELIVERED')) list.push(o);
            }
            setOrders(list);
          }
        }
      } catch (err) {
        console.error('Failed to load downloads:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [profile?.id]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      <SEO
        title="My Digital Downloads | VyapaarPro Store"
        description="Access and download your purchased digital products, code packages, templates, and activation keys."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Secure Vault & Delivery Files</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">My Digital Downloads & Assets</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Download your purchased digital software, access links, and activation keys anytime.
          </p>
        </div>

        <Link
          to="/orders"
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          View All Orders
        </Link>
      </div>

      {/* Downloads Grid */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your digital downloads...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => {
            const item = order.items?.[0];
            const product = item?.product;
            const hasDownload = !!product?.product_file_path || !!product?.access_link;

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-800/40">
                      {order.order_number}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {item?.product_name_snapshot || 'Digital Software Package'}
                    </h3>
                    {product?.short_description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.short_description}</p>
                    )}
                  </div>

                  {/* License Key snippet if available */}
                  {product?.license_key && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 flex items-center space-x-2">
                      <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">Key: {product.license_key}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <Link
                    to={`/orders/${order.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition text-center shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <span>Open Access & Instructions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-900/60 border border-slate-800 rounded-3xl max-w-md mx-auto space-y-3">
          <PackageOpen className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Approved Downloads Found</h3>
          <p className="text-xs text-slate-400">
            Once your store purchases or service orders are approved, your downloadable assets and instructions will appear here.
          </p>
          <div className="pt-2">
            <Link
              to="/store"
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Browse Store Catalog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
