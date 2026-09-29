import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Search,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { StoreOrder } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { useAuth } from '../../contexts/AuthContext';
import { SEO } from '../../components/common/SEO';

export const CustomerOrdersPage: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('order') || searchParams.get('search') || '';

  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchedOrder, setSearchedOrder] = useState<StoreOrder | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        if (profile?.id) {
          const data = await storeDataService.getCustomerOrders(profile.id);
          setOrders(data);
        } else {
          // If not logged in, check if order numbers are saved in localStorage
          const localOrderIds: string[] = JSON.parse(localStorage.getItem('vp_my_order_ids') || '[]');
          if (localOrderIds.length > 0) {
            const list: StoreOrder[] = [];
            for (const id of localOrderIds) {
              const o = await storeDataService.getOrderById(id);
              if (o) list.push(o);
            }
            setOrders(list);
          }
        }
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [profile?.id]);

  // Handle direct lookup by Order Number or Phone/Email
  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchedOrder(null);

    try {
      const q = searchQuery.trim();
      const allOrders = await storeDataService.getAdminOrders();
      const match = allOrders.find(
        (o) =>
          o.order_number.toLowerCase() === q.toLowerCase() ||
          o.id === q ||
          (o.customer_phone && o.customer_phone.includes(q)) ||
          (o.customer_email && o.customer_email.toLowerCase() === q.toLowerCase())
      );

      if (match) {
        setSearchedOrder(match);
      } else {
        setSearchError(`No order found matching "${searchQuery}". Please verify your Order Number or phone number.`);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error searching for order');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>{status}</span>
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
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>{status}</span>
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-10">
      <SEO
        title="Track Store Orders & Delivery | VyapaarPro"
        description="Check your digital store order status, payment verification, and access approved delivery files & instructions."
      />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
          <span>Customer Orders & Delivery Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Track Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300">Orders & Delivery</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter your Order Number (e.g. VP-ORD-...) or phone number below to view payment status, downloads, and instructions.
        </p>
      </div>

      {/* Quick Lookup Box */}
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <form onSubmit={handleSearchOrder} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Order #, Phone or Email..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md shadow-indigo-600/20 cursor-pointer whitespace-nowrap"
          >
            {isSearching ? 'Tracking...' : 'Track Order'}
          </button>
        </form>

        {searchError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}

        {searchedOrder && (
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Found Order</span>
                <h4 className="text-sm font-bold text-white">{searchedOrder.order_number}</h4>
              </div>
              {getStatusBadge(searchedOrder.status)}
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>Product: <span className="text-white font-semibold">{searchedOrder.items?.[0]?.product_name_snapshot || 'Digital Item'}</span></p>
              <p>Amount: <span className="text-white font-semibold">₹{Math.round(searchedOrder.total_paise / 100)}</span></p>
            </div>

            <Link
              to={`/orders/${searchedOrder.id}`}
              className="block w-full py-2.5 px-4 text-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md"
            >
              View Full Order & Delivery Package →
            </Link>
          </div>
        )}
      </div>

      {/* Orders List for Logged-In User or Local History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <span>{profile ? 'Your Order History' : 'Recent Session Purchases'}</span>
          </h2>
          <div className="flex items-center space-x-3 text-xs">
            <Link to="/downloads" className="text-indigo-400 hover:text-indigo-300 font-medium">
              View All Downloads →
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading order records...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => {
              const priceRupees = Math.round(order.total_paise / 100);
              const firstItem = order.items?.[0];

              return (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition flex flex-col justify-between space-y-4 shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-indigo-400">{order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">
                        {firstItem?.product_name_snapshot || 'Digital Store Package'}
                      </h3>
                      {order.items && order.items.length > 1 && (
                        <p className="text-[11px] text-slate-400">+{order.items.length - 1} more item(s)</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Total: <strong className="text-white">₹{priceRupees}</strong></span>
                      <span>{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  <Link
                    to={`/orders/${order.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-semibold transition text-center flex items-center justify-center space-x-1.5"
                  >
                    <span>View Order & Delivery Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-slate-900/60 border border-slate-800 rounded-3xl max-w-md mx-auto space-y-3">
            <PackageOpen className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Previous Orders Found</h3>
            <p className="text-xs text-slate-400">
              Browse our digital catalog to purchase social media services or full-stack software kits.
            </p>
            <div className="pt-2">
              <Link
                to="/store"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Browse Digital Store
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
