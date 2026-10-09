import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield, User, Lock, Mail, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth, isAuthorizedAdminEmail } from '../../contexts/AuthContext';
import { SEO } from '../../components/common/SEO';
import { BrandLogo } from '../../components/common/BrandLogo';

export const LoginPage: React.FC = () => {
  const { profile, isAdmin, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        const isAdminUser = isAuthorizedAdminEmail(email);
        if (isAdminUser) {
          navigate(redirectUrl || '/admin', { replace: true });
        } else {
          // Send user to their target page or homepage to freely explore the site
          const target = redirectUrl && !redirectUrl.startsWith('/admin') ? redirectUrl : '/';
          navigate(target, { replace: true });
        }
      } else {
        setErrorMsg(res.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const registerLink = redirectUrl
    ? `/register?redirect=${encodeURIComponent(redirectUrl)}`
    : '/register';

  return (
    <div className="py-12 sm:py-20 px-4 flex items-center justify-center">
      <SEO title="Sign In Required | VyapaarPro" />

      <div className="w-full max-w-md">
        {/* Compulsory Authentication Callout Banner */}
        <div className="mb-4 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl p-4 text-left shadow-lg backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Authentication Compulsory
              </h2>
              <p className="text-xs text-indigo-200/90 mt-0.5 leading-relaxed">
                Please sign in or create an account to explore VyapaarPro services, digital store, portfolio, and pricing.
              </p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center flex flex-col items-center">
            <div className="mb-4">
              <BrandLogo size="md" variant="default" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Sign In to Continue</h1>
            <p className="text-xs text-slate-400 mt-1">
              Enter your registered credentials to explore the platform.
            </p>
          </div>

          {/* Quick Tab Switcher between Sign In and Sign Up */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              className="py-2 text-center rounded-lg bg-indigo-600 text-white shadow-sm transition"
            >
              Sign In
            </button>
            <Link
              to={registerLink}
              className="py-2 text-center rounded-lg text-slate-400 hover:text-white transition flex items-center justify-center space-x-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </Link>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-indigo-400 hover:text-indigo-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? 'Verifying Credentials...' : 'Sign In & Explore Website'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to={registerLink} className="text-indigo-400 font-semibold hover:underline">
              Create Client Account (Sign Up)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
