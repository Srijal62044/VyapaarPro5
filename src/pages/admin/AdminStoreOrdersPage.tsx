import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  CreditCard,
} from 'lucide-react';
import { StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { SEO } from '../../components/common/SEO';

export const AdminStoreOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await storeDataService.getAdminOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    if (selectedStatus !== 'all' && o.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <SEO title="Store Orders & Transactions | VyapaarPro Admin" description="Inspect digital store orders, payment status, and customer download logs." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <Link to="/admin/store" className="hover:text-white">Store</Link>
            <span>/</span>
            <span className="text-violet-400">Orders</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-violet-400" />
            <span>Store Orders & Invoices</span>
          </h1>
        </div>

        <button
          onClick={loadOrders}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, email, name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PAYMENT_PENDING">PAYMENT PENDING</option>
            <option value="CREATED">CREATED</option>
            <option value="PAYMENT_FAILED">PAYMENT FAILED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Order #</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOrders.map((o) => {
                const priceRupees = Math.round(o.total_paise / 100);
                return (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{o.order_number}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-white block">{o.customer_name || 'Guest'}</span>
                      <span className="text-[11px] text-slate-400">{o.customer_email || '—'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {o.items && o.items.length > 0
                        ? o.items.map((i) => i.product_name_snapshot).join(', ')
                        : '1 Item'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">₹{priceRupees.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          o.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : o.status === 'PAYMENT_FAILED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(o.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/store/orders/${o.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Orders Found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery || selectedStatus !== 'all'
              ? 'No orders match your filter criteria.'
              : 'Zero store orders have been placed yet.'}
          </p>
        </div>
      )}
    </div>
  );
};
