import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Layers,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { StoreDashboardStats, StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { SEO } from '../../components/common/SEO';

export const AdminStoreDashboard: React.FC = () => {
  const [stats, setStats] = useState<StoreDashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, ordersData] = await Promise.all([
        storeDataService.getStoreDashboardStats(),
        storeDataService.getAdminOrders(),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load store dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const revenueRupees = stats ? Math.round(stats.total_revenue_paise / 100) : 0;

  return (
    <div className="space-y-6">
      <SEO title="Digital Store Operations | VyapaarPro Admin" description="Store dashboard metrics and order management." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-400 block mb-1">
            Store Operations & E-Commerce Module
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-violet-400" />
            <span>Digital Store Dashboard</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/store/social-services"
            className="px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Social Media Services</span>
          </Link>
          <Link
            to="/admin/store/categories"
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition"
          >
            Categories
          </Link>
          <Link
            to="/admin/store/products"
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition"
          >
            Manage Products
          </Link>
          <Link
            to="/admin/store/products/new"
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Store Revenue</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">₹{revenueRupees.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">From verified paid orders</span>
        </div>

        {/* Paid Orders */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paid Orders</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.paid_orders ?? 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Total Orders: {stats?.total_orders ?? 0}</span>
        </div>

        {/* Social Media Services */}
        <Link
          to="/admin/store/social-services"
          className="bg-slate-900 border border-slate-800 hover:border-pink-500/50 p-5 rounded-2xl transition group"
        >
          <div className="flex items-center justify-between text-pink-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Social Services</span>
            <Share2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.social_services_count ?? 30}</p>
          <span className="text-[10px] text-pink-400/80 mt-1 block">12 Platforms Active →</span>
        </Link>

        {/* Digital Products */}
        <Link
          to="/admin/store/products"
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl transition group"
        >
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Digital Products</span>
            <Package className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.digital_products_count ?? 1}</p>
          <span className="text-[10px] text-purple-400/80 mt-1 block">Code & Templates →</span>
        </Link>

        {/* Store Orders */}
        <Link
          to="/admin/store/orders"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition group col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.total_orders ?? 0}</p>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Automatic Verification Active →</span>
        </Link>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Link
          to="/admin/store/social-services"
          className="p-5 rounded-2xl bg-violet-950/20 border border-violet-500/30 hover:border-violet-500/60 transition group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-violet-300 group-hover:text-violet-200">Social Media</h3>
            <ArrowRight className="w-4 h-4 text-violet-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition" />
          </div>
          <p className="text-xs text-violet-400/70 mt-1">Manage growth services, live prices, and limits.</p>
        </Link>

        <Link
          to="/admin/store/orders"
          className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500/60 transition group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-300 group-hover:text-emerald-200">Store Orders</h3>
            <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
          </div>
          <p className="text-xs text-emerald-400/70 mt-1">Inspect transactions, customer receipts, and delivery packages.</p>
        </Link>

        <Link
          to="/admin/store/products"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white group-hover:text-violet-300">Product Catalogue</h3>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Upload digital packages, set pricing, and publish items.</p>
        </Link>

        <Link
          to="/admin/store/categories"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white group-hover:text-violet-300">Store Categories</h3>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Organize digital items with taxonomy & sorting.</p>
        </Link>

        <Link
          to="/admin/store/orders"
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/50 transition group"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white group-hover:text-violet-300">Orders & Invoices</h3>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Inspect transactions, customer details, and logs.</p>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Orders</h2>
          <Link to="/admin/store/orders" className="text-xs text-violet-400 hover:text-violet-300 font-medium">
            View All Orders →
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 font-semibold">Order #</th>
                  <th className="py-2.5 font-semibold">Customer</th>
                  <th className="py-2.5 font-semibold">Amount</th>
                  <th className="py-2.5 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold">Date</th>
                  <th className="py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 font-mono font-bold text-white">{o.order_number}</td>
                    <td className="py-3 text-slate-300">{o.customer_email || o.customer_name || 'Guest'}</td>
                    <td className="py-3 font-semibold text-white">₹{Math.round(o.total_paise / 100).toLocaleString('en-IN')}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.status === 'PAID' || o.status === 'DELIVERED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : o.status === 'REJECTED' || o.status === 'CANCELLED'
                            ? 'bg-rose-500/10 text-rose-400'
                            : o.status === 'PAYMENT_REVIEW'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/admin/store/orders/${o.id}`}
                        className="text-violet-400 hover:text-violet-300 font-medium"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">No store orders recorded yet.</p>
        )}
      </div>
    </div>
  );
};
