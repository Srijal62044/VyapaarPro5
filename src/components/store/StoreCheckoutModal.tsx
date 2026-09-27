import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShieldCheck,
  Download,
  ArrowRight,
  Sparkles,
  Lock,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { StoreProduct, StoreOrder } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { rateLimiter } from '../../services/rateLimiter';
import { famGatewayService } from '../../services/famGatewayService';

interface StoreCheckoutModalProps {
  product: StoreProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StoreCheckoutModal: React.FC<StoreCheckoutModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successOrder, setSuccessOrder] = useState<StoreOrder | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [profile, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      setIsProcessing(false);
      setSuccessOrder(null);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const priceRupees = Math.round(product.price_paise / 100);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Rate Limiting Check
      const rlResult = await rateLimiter.checkRateLimit('store_checkout', email);
      if (!rlResult.allowed) {
        throw new Error(rlResult.error || 'Too many checkout attempts. Please wait a few minutes.');
      }

      // 2. Create Order via Server Endpoint
      const orderRes = await fetch('/api/store/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          customerPhone: phone.trim() || undefined,
          userId: profile?.id || null,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.order) {
        throw new Error(orderData.error || 'Failed to create checkout order');
      }

      const order: StoreOrder = orderData.order;

      // 3. Initialize FamGateway Session
      const sessionResult = await famGatewayService.createCheckoutSession({
        order,
        customer: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
        },
      });

      if (!sessionResult.success || !sessionResult.paymentUrl) {
        throw new Error(sessionResult.error || 'Payment gateway initialization failed');
      }

      // 4. Redirect customer to the FamGateway payment page
      window.location.href = sessionResult.paymentUrl;
      return;
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success State */}
        {successOrder ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Payment Successful!</h3>
            <p className="text-xs text-slate-300">
              Your order <span className="font-mono text-indigo-400">{successOrder.order_number}</span> is confirmed. Redirecting to your order details...
            </p>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Digital Checkout</span>
            </div>
            <h2 className="text-xl font-bold text-white">Complete Your Purchase</h2>

            {/* Product Summary Card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{product.name}</h4>
                <p className="text-xs text-slate-400 line-clamp-1">{product.short_description}</p>
                <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 pt-1">
                  <Download className="w-3 h-3" />
                  <span>Instant Download Access</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-white">
                  ₹{priceRupees.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">INR</span>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Your download link & receipt will be securely associated with this email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone / WhatsApp (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Payment Gateway Trust Indicator */}
              <div className="pt-2">
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Secured by FamGateway Payment Engine</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Pay ₹{priceRupees.toLocaleString('en-IN')} via FamGateway</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
