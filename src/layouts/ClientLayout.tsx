import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Layers,
  FileText,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  Bell,
  ExternalLink,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { BrandLogo } from '../components/common/BrandLogo';

export const ClientLayout: React.FC = () => {
  const { profile, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // If user is not authenticated, redirect to login
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Client Portal Sign-In Required</h2>
          <p className="text-sm text-slate-400 mb-6">
            Please sign in to access your project requests, milestones, and deliverables.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition"
            >
              Sign In to Your Account
            </Link>
            <Link
              to="/"
              className="block w-full py-2 text-slate-400 hover:text-white text-xs transition"
            >
              Back to VyapaarPro Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', href: '/app', icon: Layers },
    { label: 'My Requests', href: '/app/requests', icon: FileText },
    { label: 'Active Projects', href: '/app/projects', icon: Briefcase },
    { label: 'Account Profile', href: '/app/profile', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/app' && location.pathname === '/app') return true;
    if (path !== '/app' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/60 border-r border-slate-800 shrink-0 min-h-screen">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800/80">
          <BrandLogo size="sm" variant="client" linkTo="/app" />
        </div>

        {/* Client Profile Card */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-sm text-white">
              {profile.full_name?.charAt(0) || 'C'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{profile.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{profile.company_name || profile.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Support & Logout */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <a
            href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/20 transition"
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Engineering</span>
            </div>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>

          <Link
            to="/"
            className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-400 hover:text-white transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Agency Site</span>
          </Link>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center space-x-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 transition w-full text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm font-semibold text-white">Client Portal</h1>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Logged in as Client</span>
            </div>
            <Link
              to="/services"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
            >
              Explore Services
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm ${
                    isActive(item.href) ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-800 flex justify-between">
              <Link to="/" className="text-xs text-slate-400">
                Agency Website
              </Link>
              <button onClick={() => logout()} className="text-xs text-rose-400">
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Routed Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
