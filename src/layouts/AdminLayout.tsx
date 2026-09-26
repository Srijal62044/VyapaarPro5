import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Shield,
  Layers,
  Inbox,
  FolderKanban,
  Users,
  Settings,
  Sparkles,
  ExternalLink,
  LogOut,
  Image,
  MessageSquare,
  Menu,
  X,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo } from '../components/common/BrandLogo';

export const AdminLayout: React.FC = () => {
  const { profile, isAdmin, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold text-white">Verifying Access</h2>
        <p className="text-xs text-slate-400 mt-1">Please wait while we verify your account permissions...</p>
      </div>
    );
  }

  // 2. Logged-out visitor: Redirect to login
  if (!profile) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // 3. Authenticated user without admin authorization: Strict Access Denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase font-bold text-rose-400 tracking-wider block mb-1">
              403 • Unauthorized Access
            </span>
            <h2 className="text-2xl font-extrabold text-white">Access Denied</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Access denied. You do not have permission to access this area.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              to="/app"
              className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition shadow-md shadow-indigo-600/20"
            >
              Go to Client Portal Workspace
            </Link>

            <Link
              to="/"
              className="block w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs transition"
            >
              Back to VyapaarPro Homepage
            </Link>

            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin Access Granted (user is authenticated AND matches AUTHORIZED_ADMIN_EMAIL)
  const navItems = [
    { label: 'Admin Dashboard', href: '/admin', icon: Layers },
    { label: 'Service Catalogue', href: '/admin/services', icon: Sparkles },
    { label: 'Service Requests', href: '/admin/requests', icon: Inbox },
    { label: 'Projects & Milestones', href: '/admin/projects', icon: FolderKanban },
    { label: 'Client Directory', href: '/admin/clients', icon: Users },
    { label: 'Portfolio Showcase', href: '/admin/portfolio', icon: Image },
    { label: 'Inquiries & Messages', href: '/admin/messages', icon: MessageSquare },
    { label: 'Agency Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 min-h-screen">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800">
          <BrandLogo size="sm" variant="admin" linkTo="/admin" />
        </div>

        {/* Admin Persona badge */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{profile?.full_name}</p>
              <p className="text-[10px] text-indigo-400 font-mono truncate">{profile?.email}</p>
              <span className="inline-block px-1.5 py-0.2 rounded text-[9px] bg-violet-500/20 text-violet-300 font-mono mt-0.5">
                AUTHORIZED ADMIN
              </span>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3.5 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            to="/"
            target="_blank"
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition"
          >
            <span>View Live Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="flex items-center space-x-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 transition w-full text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">Agency Administration</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {profile.email}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Link
              to="/admin/services/new"
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition flex items-center space-x-1"
            >
              <span>+ Add Service</span>
            </Link>
            <Link
              to="/"
              className="hidden sm:inline-block text-slate-400 hover:text-white"
            >
              Public Site →
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
                  className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl text-sm ${
                    isActive(item.href) ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-800 flex justify-between">
              <Link to="/" className="text-xs text-slate-400">
                Back to Site
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="text-xs text-rose-400"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
