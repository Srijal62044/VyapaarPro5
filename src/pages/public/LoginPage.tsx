import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, Shield, User, Lock, Mail } from 'lucide-react';
import { useAuth, isAuthorizedAdminEmail } from '../../contexts/AuthContext';
import { SEO } from '../../components/common/SEO';
import { BrandLogo } from '../../components/common/BrandLogo';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        const isAdminUser = isAuthorizedAdminEmail(email);
        if (isAdminUser) {
          navigate(redirectUrl || '/admin');
        } else {
          // If non-admin tried to navigate directly to /admin, take them to their client workspace
          navigate(redirectUrl && !redirectUrl.startsWith('/admin') ? redirectUrl : '/app');
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

  return (
    <div className="py-16 sm:py-24 px-4 flex items-center justify-center">
      <SEO title="Client & Admin Sign In | VyapaarPro" />

      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center flex flex-col items-center">
            <div className="mb-4">
              <BrandLogo size="md" variant="default" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Sign In</h1>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with your registered email and password.
            </p>
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
              {isSubmitting ? 'Verifying Credentials...' : 'Sign In'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
              Create Client Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
