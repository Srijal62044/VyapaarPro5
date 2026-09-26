import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Menu,
  X,
  User,
  Shield,
  Briefcase,
  ChevronDown,
  LogOut,
  Layers,
  Phone,
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
          <span>Accepting New Client Projects for Q3/Q4. Full-stack development & bespoke design.</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Direct WhatsApp Consultation: {settings.phone}</span>
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
                to={link.href}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                {link.label}
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
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 transition flex items-center space-x-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-violet-400" />
                    <span>Admin Panel</span>
                  </Link>
                ) : (
                  <Link
                    to="/app"
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition flex items-center space-x-1.5"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Client Portal</span>
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition"
              >
                Sign In
              </Link>
            )}

            {/* Get Started CTA */}
            <button
              onClick={onOpenGetStarted}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get Started</span>
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={onOpenGetStarted}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
            >
              Get Started
            </button>
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
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-base font-medium ${
                  isActive(link.href)
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                {link.label}
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
                  <Link
                    to="/app"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full py-2.5 px-4 text-center rounded-xl bg-indigo-600/20 text-indigo-300 font-medium text-sm"
                  >
                    Go to Client Portal
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full py-2 text-center text-slate-400 text-xs"
                >
                  Sign Out ({profile.email})
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 px-4 text-center rounded-xl bg-slate-900 text-white font-medium text-sm border border-slate-800"
              >
                Sign In / Client Account
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
