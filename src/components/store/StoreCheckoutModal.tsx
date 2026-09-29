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
  Share2,
  Clock,
  Link as LinkIcon,
  HelpCircle,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { StoreProduct, StoreOrder, SocialServiceFieldConfig } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { rateLimiter } from '../../services/rateLimiter';
import { famGatewayService } from '../../services/famGatewayService';
import { storeDataService } from '../../services/storeDataService';
import {
  getEffectiveServiceFields,
  validateOrderingFields,
  calculateServicePrice,
} from '../../services/socialServiceFields';

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

  // Contact fields (mandatory)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Dynamic ordering fields & quantity
  const [quantity, setQuantity] = useState<number>(1);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successOrder, setSuccessOrder] = useState<StoreOrder | null>(null);

  // Derive dynamic fields for selected product
  const effectiveFields: SocialServiceFieldConfig[] = product
    ? getEffectiveServiceFields(product)
    : [];

  const isSocialService = product?.platform && product.platform !== 'digital';
  const minQty = Number(product?.min_quantity) || 1;
  const maxQty = Number(product?.max_quantity) || 1000000;

  // Reset and pre-populate on open or product change
  useEffect(() => {
    if (product) {
      const initialQty = Math.max(1, minQty);
      setQuantity(initialQty);

      // Pre-fill fields with sensible defaults or empty strings
      const initialFields: Record<string, any> = {};
      const fields = getEffectiveServiceFields(product);
      fields.forEach((f) => {
        initialFields[f.field_key] = f.field_type === 'select' && f.options?.[0] ? f.options[0] : '';
      });
      setFieldValues(initialFields);
      setFieldErrors({});
    }

    if (profile) {
      setName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
    }
  }, [product, profile, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage('');
      setFieldErrors({});
      setIsProcessing(false);
      setSuccessOrder(null);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Live calculated total price in paise and rupees
  const totalPaise = calculateServicePrice(product, quantity);
  const totalRupees = Math.round(totalPaise / 100);

  // Field change handler
  const handleFieldChange = (fieldKey: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [fieldKey]: value }));
    if (fieldErrors[fieldKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }
  };

  // Quantity change handler with clamping
  const handleQuantityChange = (val: number) => {
    setQuantity(val);
    if (fieldErrors.quantity) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.quantity;
        return next;
      });
    }
  };

  // Preset quick picks (e.g. Min, 500, 1000, 2500, 5000, 10000)
  const presets = isSocialService
    ? [
        minQty,
        minQty * 2,
        minQty * 5,
        minQty * 10,
        minQty * 25,
        minQty * 50,
      ].filter((q, idx, arr) => q <= maxQty && arr.indexOf(q) === idx).slice(0, 5)
    : [];

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});

    // 1. Mandatory customer contact validation
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!phone.trim()) {
      setErrorMessage('WhatsApp / Mobile phone number is compulsory to place an order.');
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile or WhatsApp number.');
      return;
    }

    // 2. Validate dynamic service ordering fields and quantity
    const validation = validateOrderingFields(effectiveFields, fieldValues, quantity, product);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      const firstErr = Object.values(validation.errors)[0];
      setErrorMessage(firstErr || 'Please check the required ordering fields.');
      return;
    }

    setIsProcessing(true);

    try {
      // 3. Rate Limiting Check
      const rlResult = await rateLimiter.checkRateLimit('store_checkout', email);
      if (!rlResult.allowed) {
        throw new Error(rlResult.error || 'Too many checkout attempts. Please wait a few minutes.');
      }

      // 4. Create Order via Server Endpoint with Dynamic Service Snapshot (with resilient client fallback)
      let order: StoreOrder | null = null;

      try {
        const orderRes = await fetch('/api/store/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            quantity,
            customerName: name.trim(),
            customerEmail: email.trim().toLowerCase(),
            customerPhone: phone.trim(),
            serviceFields: fieldValues,
            userId: profile?.id || null,
          }),
        });

        if (orderRes.ok) {
          const orderData = await orderRes.json();
          if (orderData?.order) {
            order = orderData.order;
          }
        }
      } catch (e) {
        console.warn('Backend create-order call notice, using local service fallback:', e);
      }

      // If server route didn't return an order, use direct storeDataService
      if (!order) {
        const fallbackRes = await storeDataService.createOrder({
          productId: product.id,
          quantity,
          customerName: name.trim(),
          customerEmail: email.trim().toLowerCase(),
          customerPhone: phone.trim(),
          serviceFields: fieldValues,
          userId: profile?.id || null,
        });
        order = fallbackRes.order;
      }

      if (!order) {
        throw new Error('Failed to create checkout order. Please check your network and try again.');
      }

      // 5. Initialize FamGateway Session
      const sessionResult = await famGatewayService.createCheckoutSession({
        order,
        customer: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        },
      });

      const checkoutUrl = sessionResult.paymentUrl || sessionResult.checkout_url;

      if (sessionResult.success && checkoutUrl) {
        // Direct customer to the official FamGateway payment checkout page
        window.location.href = checkoutUrl;
        return;
      }

      // If gateway creation failed, surface the exact error on modal
      throw new Error(
        sessionResult.error || 'Failed to initialize FamGateway payment session. Please try again.'
      );
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success State */}
        {successOrder ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white">Payment Received</h3>
            <p className="text-xs text-slate-300">
              Your order <span className="font-mono text-indigo-400 font-bold">{successOrder.order_number}</span> is confirmed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Modal Header */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">
                {isSocialService ? <Share2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isSocialService ? `${product.platform} Service Order` : 'Digital Store Checkout'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{product.name}</h2>
            </div>

            {/* Service & Pricing Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs text-slate-300 line-clamp-1">{product.short_description}</p>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Safe & Non-Drop</span>
                  </span>
                  {product.delivery_time_info && (
                    <>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-indigo-300">
                        <Clock className="w-3 h-3" />
                        <span>{product.delivery_time_info}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                <span className="text-xl font-black text-white block">
                  ₹{totalRupees.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">
                  {quantity.toLocaleString('en-IN')} {product.service_type || 'units'}
                </span>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="space-y-5">
              {/* 1. QUANTITY SELECTOR (if social media or customizable quantity) */}
              {isSocialService && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Quantity ({product.service_type || 'units'}) *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Min: <strong className="text-white">{minQty.toLocaleString()}</strong> • Max:{' '}
                      <strong className="text-white">{maxQty.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      required
                      min={minQty}
                      max={maxQty}
                      value={quantity || ''}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border text-white font-bold text-sm focus:outline-none transition ${
                        fieldErrors.quantity ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                  </div>

                  {fieldErrors.quantity && (
                    <p className="text-[11px] text-rose-400 font-medium">{fieldErrors.quantity}</p>
                  )}

                  {/* Quick Preset Buttons */}
                  {presets.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-500 font-medium mr-1">Quick pick:</span>
                      {presets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleQuantityChange(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                            quantity === preset
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {preset.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. DYNAMIC SOCIAL SERVICE ORDERING FIELDS */}
              {effectiveFields.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Target Details & Order Requirements</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Dynamic Form</span>
                  </div>

                  <div className="space-y-3.5">
                    {effectiveFields.map((field) => {
                      const val = fieldValues[field.field_key] || '';
                      const hasErr = !!fieldErrors[field.field_key];

                      return (
                        <div key={field.field_key} className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-300">
                            {field.label} {field.required && <span className="text-rose-400">*</span>}
                          </label>

                          {/* Render based on field type */}
                          {field.field_type === 'textarea' || field.field_type === 'long_text' ? (
                            <textarea
                              rows={3}
                              value={val}
                              onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                              placeholder={field.placeholder || 'Enter instructions...'}
                              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-white text-xs placeholder:text-slate-600 focus:outline-none transition ${
                                hasErr ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                              }`}
                            />
                          ) : field.field_type === 'select' ? (
                            <div className="relative">
                              <select
                                value={val}
                                onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-white text-xs focus:outline-none appearance-none transition ${
                                  hasErr ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                                }`}
                              >
                                {field.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          ) : field.field_type === 'checkbox' ? (
                            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer pt-1">
                              <input
                                type="checkbox"
                                checked={!!val}
                                onChange={(e) => handleFieldChange(field.field_key, e.target.checked)}
                                className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{field.placeholder || field.label}</span>
                            </label>
                          ) : (
                            <input
                              type={field.field_type === 'number' ? 'number' : field.field_type === 'url' ? 'url' : 'text'}
                              value={val}
                              onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                              placeholder={field.placeholder || ''}
                              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-white text-xs placeholder:text-slate-600 focus:outline-none transition ${
                                hasErr ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                              }`}
                            />
                          )}

                          {hasErr && (
                            <p className="text-[10px] text-rose-400 font-medium">{fieldErrors[field.field_key]}</p>
                          )}

                          {field.help_text && !hasErr && (
                            <p className="text-[10px] text-slate-400 leading-normal">{field.help_text}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Security Guarantee Banner (Section 9) */}
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      100% Password-Free: We will never ask for your account password, 2FA codes, or login credentials.
                    </span>
                  </div>
                </div>
              )}

              {/* 3. MANDATORY CUSTOMER CONTACT SECTION */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3.5">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800/80 pb-2">
                  Customer & Delivery Contact
                </span>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp / Phone <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Required for automated order updates and payment verification confirmation.
                </p>
              </div>

              {/* Payment Trust Badge */}
              <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Secured by FamGateway Payment Engine</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Validating Order & Starting Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{totalRupees.toLocaleString('en-IN')} via FamGateway</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
