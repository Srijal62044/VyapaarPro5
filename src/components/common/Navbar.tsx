import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Menu,
  X,
  User,
  Shield,
  ShoppingBag,
  Download,
  ChevronDown,
  LogOut,
  Layers,
  Phone,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  onOpenGetStarted?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenGetStarted }) => {
  const { profile, isAdmin, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { label: 'Services', href: '/services' },
    { label: 'Store', href: '/store' },
    { label: 'Track Orders', href: '/orders' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'About Agency', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      {/* Top micro announcement bar */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/60 border-b border-indigo-900/20 py-1.5 px-4 text-center text-xs text-indigo-300 hidden md:flex items-center justify-between">
        <div className="flex items-center space-x-2 mx-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Social Media Growth Services & Custom Software Development. Instant Automated Delivery.</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Direct Consultation: {settings.phone}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <BrandLogo size="md" variant="default" />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={profile ? link.href : `/login?redirect=${encodeURIComponent(link.href)}`}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition flex items-center space-x-1.5 ${
                  isActive(link.href)
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
                title={!profile ? 'Sign in required to explore ' + link.label : undefined}
              >
                {!profile && <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Action CTAs & Auth */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Authenticated user links */}
            {profile ? (
              <div className="flex items-center space-x-2">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 transition flex items-center space-x-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-violet-400" />
                    <span>Admin Panel</span>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-1.5">
                    <Link
                      to="/orders"
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition flex items-center space-x-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      to="/account"
                      className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      Account
                    </Link>
                  </div>
                )}

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  title="Sign out (Lock website)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
                >
                  Sign In
                </Link>
                <Link
                  to={`/register?redirect=${encodeURIComponent(location.pathname)}`}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

            {/* Get Started CTA (Only active for logged in users, otherwise directs to login) */}
            {profile ? (
              <button
                onClick={onOpenGetStarted}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
              </button>
            ) : null}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center space-x-2 lg:hidden">
            {!profile ? (
              <Link
                to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
              >
                Sign In
              </Link>
            ) : (
              <button
                onClick={onOpenGetStarted}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
              >
                Get Started
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-6 space-y-3">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={profile ? link.href : `/login?redirect=${encodeURIComponent(link.href)}`}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-base font-medium flex items-center justify-between ${
                  isActive(link.href)
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span>{link.label}</span>
                {!profile && <Lock className="w-3.5 h-3.5 text-amber-400" />}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            {profile ? (
              <div className="space-y-2">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-2.5 px-4 text-center rounded-xl bg-violet-600/20 text-violet-300 font-medium text-sm"
                  >
                    Go to Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2.5 px-4 text-center rounded-xl bg-indigo-600/20 text-indigo-300 font-medium text-sm"
                    >
                      My Store Orders & Downloads
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block w-full py-2 px-4 text-center rounded-xl bg-slate-900 text-slate-300 text-xs"
                    >
                      My Account Details
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full py-2 text-center text-slate-400 text-xs cursor-pointer hover:text-rose-400"
                >
                  Sign Out ({profile.email})
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 px-4 text-center rounded-xl bg-indigo-600 text-white font-medium text-sm"
                >
                  Sign In to Explore Website
                </Link>
                <Link
                  to={`/register?redirect=${encodeURIComponent(location.pathname)}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 px-4 text-center rounded-xl bg-slate-900 text-slate-200 font-medium text-sm border border-slate-800"
                >
                  Create New Account (Sign Up)
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
