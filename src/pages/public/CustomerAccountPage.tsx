import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  ShoppingBag,
  Download,
  FolderKanban,
  Inbox,
  LogOut,
  Sparkles,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/store';
import { storeDataService } from '../../services/storeDataService';
import { ServiceRequest, StoreOrder } from '../../types';
import { SEO } from '../../components/common/SEO';

export const CustomerAccountPage: React.FC = () => {
  const { profile, isAdmin, logout } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        const [reqs, ords] = await Promise.all([
          dataService.getRequests(profile.id),
          storeDataService.getCustomerOrders(profile.id),
        ]);
        setRequests(reqs);
        setOrders(ords);
      } catch (err) {
        console.error('Failed to load account data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [profile?.id]);

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <User className="w-12 h-12 text-indigo-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Client Account Sign In</h2>
        <p className="text-xs text-slate-400">
          Sign in or create an account to view your project requests, milestones, and digital purchases.
        </p>
        <div className="pt-2 flex items-center justify-center space-x-3">
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 space-y-8">
      <SEO title="My Account | VyapaarPro" description="Manage your client profile, consultations, and digital orders." />

      {/* Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xl font-bold">
            {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white">{profile.full_name || 'Client Account'}</h1>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 font-mono">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">{profile.email}</p>
            {profile.company_name && <p className="text-xs text-indigo-300 font-medium">{profile.company_name}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {isAdmin && (
            <Link
              to="/admin"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </Link>
          )}
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/orders"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition group"
        >
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <ShoppingBag className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white">My Store Orders</h3>
          <p className="text-xs text-slate-400 mt-1">{orders.length} digital order(s) recorded.</p>
        </Link>

        <Link
          to="/downloads"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition group"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <Download className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white">Digital Downloads</h3>
          <p className="text-xs text-slate-400 mt-1">Access files, repo links, and keys.</p>
        </Link>

        <Link
          to="/store"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition group"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <Sparkles className="w-5 h-5" />
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
          <h3 className="text-base font-bold text-white">Digital Store Catalog</h3>
          <p className="text-xs text-slate-400 mt-1">Explore social media & code kits.</p>
        </Link>
      </div>

      {/* Project Consultation Requests Section */}
      {requests.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Inbox className="w-4 h-4 text-indigo-400" />
            <span>Your Project Inquiries & Consultations</span>
          </h2>
          <div className="divide-y divide-slate-800">
            {requests.map((req) => (
              <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">{req.service_name}</h4>
                  <p className="text-xs text-slate-400">{req.requirements?.slice(0, 100)}...</p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {req.status}
                  </span>
                  <span className="text-slate-500">{new Date(req.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
