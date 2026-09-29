import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Phone, Mail, MapPin, MessageSquare, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  const { settings } = useSettings();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm">
      {/* Top Banner: Transparent Agency Model Notice */}
      <div className="border-b border-slate-900 bg-slate-950/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-950/20 border border-indigo-500/20 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Direct Consultation & Milestone-Based Delivery
                </h4>
                <p className="text-xs text-slate-400">
                  VyapaarPro does not operate online payment gateways or card checkouts. All contracts & milestone payments are settled directly outside the platform.
                </p>
              </div>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold transition shrink-0"
            >
              <span>Contact Engineering Team</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1 & 2: Brand & Description */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="md" variant="default" />
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              {settings.description ||
                'VyapaarPro provides digital solutions and services for individuals, creators, startups, shops, businesses, and organizations.'}
            </p>
            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <a href={`mailto:${settings.email || 'kumarsrijal732@gmail.com'}`} className="text-slate-300 hover:text-white transition">
                  {settings.email || 'kumarsrijal732@gmail.com'}
                </a>
              </div>
              <div className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-300">{settings.phone || '+91 98765 43210'}</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-emerald-400 transition"
                >
                  WhatsApp Direct Consultation
                </a>
              </div>
              <div className="flex items-center space-x-2.5">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-400">{settings.address || 'Indiranagar 100ft Road, Bangalore, Karnataka 560038'}</span>
              </div>
            </div>
          </div>

          {/* Col 3: Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/services/business-website" className="hover:text-indigo-400 transition">
                  Business Websites
                </Link>
              </li>
              <li>
                <Link to="/services/ecommerce-website" className="hover:text-indigo-400 transition">
                  E-Commerce Stores
                </Link>
              </li>
              <li>
                <Link to="/services/custom-web-application" className="hover:text-indigo-400 transition">
                  Custom Web Apps
                </Link>
              </li>
              <li>
                <Link to="/services/android-pwa-application" className="hover:text-indigo-400 transition">
                  Android & PWAs
                </Link>
              </li>
              <li>
                <Link to="/services/ui-ux-design" className="hover:text-indigo-400 transition">
                  UI/UX & Branding
                </Link>
              </li>
              <li>
                <Link to="/services/local-seo-google-business" className="hover:text-indigo-400 transition">
                  SEO & Search Setup
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Agency & Work */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Company & Store</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/store" className="hover:text-indigo-400 transition text-indigo-300 font-medium">
                  Digital Product Store
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-indigo-400 transition">
                  About VyapaarPro
                </Link>
              </li>
              <li>
                <Link to="/about#developer" className="hover:text-indigo-400 transition">
                  About the Developer
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="hover:text-indigo-400 transition">
                  Client Case Studies
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-indigo-400 transition">
                  Contact & Consultation
                </Link>
              </li>
              <li>
                <Link to="/downloads" className="hover:text-indigo-400 transition">
                  Customer Downloads
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-indigo-400 transition">
                  Track Orders & Status
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-indigo-400 transition">
                  Customer Account
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-indigo-400 transition">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Governance & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Legal & Security</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-indigo-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-indigo-400 transition">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <span className="text-slate-500 block">Row Level Security (RLS)</span>
              </li>
              <li>
                <span className="text-slate-500 block">Independent Cloud Deployment</span>
              </li>
              <li>
                <span className="text-slate-500 block">100% Client Code Ownership</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {currentYear} VyapaarPro. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link to="/about" className="hover:text-slate-400 transition">
              About
            </Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-slate-400 transition">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-400 transition">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-slate-400 transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
