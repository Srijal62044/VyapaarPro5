import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Home,
  ShoppingBag,
  Briefcase,
  Package,
  MessageSquare,
  ArrowLeft,
  Search,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <SEO
        title="Page Not Found (404) | VyapaarPro"
        description="The page you are looking for does not exist or has been moved. Explore VyapaarPro digital services, digital store, or contact our support team."
      />

      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl w-full text-center z-10">
        {/* Glowing Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Error 404 • Resource Not Found</span>
        </div>

        {/* 404 Heading */}
        <h1 className="text-7xl sm:text-9xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent font-['Space_Grotesk'] leading-none">
          404
        </h1>

        <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-white font-['Space_Grotesk']">
          Lost in Digital Space?
        </h2>

        <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-lg mx-auto">
          The page or asset you are looking for might have been moved, renamed, or never existed in the first place.
        </p>

        {/* Quick Navigation Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <Link
            to="/"
            className="group p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Home className="w-4 h-4" />
              </div>
              <span className="font-semibold text-white text-sm">Homepage</span>
            </div>
            <p className="text-xs text-slate-400">Return to main digital agency showcase</p>
          </Link>

          <Link
            to="/store"
            className="group p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-colors">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="font-semibold text-white text-sm">Digital Store</span>
            </div>
            <p className="text-xs text-slate-400">Discover source codes, themes & social services</p>
          </Link>

          <Link
            to="/services"
            className="group p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="font-semibold text-white text-sm">Our Services</span>
            </div>
            <p className="text-xs text-slate-400">Custom web development, mobile apps & branding</p>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Take Me Home</span>
          </Link>

          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white text-sm font-medium transition-all"
          >
            <Package className="w-4 h-4" />
            <span>My Orders</span>
          </Link>

          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white text-sm font-medium transition-all"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Need Help?</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
