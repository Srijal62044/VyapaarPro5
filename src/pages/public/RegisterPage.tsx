import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Building, Phone, Shield, UserPlus, LogIn } from 'lucide-react';
import { useAuth, isAuthorizedAdminEmail } from '../../contexts/AuthContext';
import { SEO } from '../../components/common/SEO';
import { BrandLogo } from '../../components/common/BrandLogo';

export const RegisterPage: React.FC = () => {
  const { profile, isAdmin, isLoading, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already authenticated, redirect immediately to target page or homepage to explore
  useEffect(() => {
    if (!isLoading && profile) {
      if (isAdmin) {
        navigate(redirectUrl || '/admin', { replace: true });
      } else {
        const target = redirectUrl && !redirectUrl.startsWith('/admin') ? redirectUrl : '/';
        navigate(target, { replace: true });
      }
    }
  }, [profile, isLoading, isAdmin, redirectUrl, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');

    if (fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(email, password, fullName, phone, companyName);
      if (res.success) {
        const isAdminUser = isAuthorizedAdminEmail(email);
        if (isAdminUser) {
          navigate(redirectUrl || '/admin', { replace: true });
        } else {
          // Send new registered user to their target page or homepage to freely explore the site
          const target = redirectUrl && !redirectUrl.startsWith('/admin') ? redirectUrl : '/';
          navigate(target, { replace: true });
        }
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginLink = redirectUrl
    ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
    : '/login';

  return (
    <div className="py-12 sm:py-20 px-4 flex items-center justify-center">
      <SEO title="Sign Up Required | VyapaarPro" />

      <div className="w-full max-w-md">
        {/* Compulsory Registration Callout Banner */}
        <div className="mb-4 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl p-4 text-left shadow-lg backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Registration Compulsory
              </h2>
              <p className="text-xs text-indigo-200/90 mt-0.5 leading-relaxed">
                Create your account to unlock full access and explore all VyapaarPro services, products, and agency portfolio.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center flex flex-col items-center">
            <div className="mb-4">
              <BrandLogo size="md" variant="default" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Create New Account</h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign up for free to explore the entire website.
            </p>
          </div>

          {/* Quick Tab Switcher between Sign In and Sign Up */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
            <Link
              to={loginLink}
              className="py-2 text-center rounded-lg text-slate-400 hover:text-white transition flex items-center justify-center space-x-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
            <button
              type="button"
              className="py-2 text-center rounded-lg bg-indigo-600 text-white shadow-sm transition flex items-center justify-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Your Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ananya Iyer"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ananya@company.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enterprises Ltd"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Choose Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-60 cursor-pointer pt-2"
            >
              {isSubmitting ? 'Registering Account...' : 'Register & Explore Website'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to={loginLink} className="text-indigo-400 font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
