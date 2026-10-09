import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Download,
} from 'lucide-react';
import { famGatewayService } from '../../services/famGatewayService';

export interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  amount: number;
  upiUrl?: string;
  qrUrl?: string;
  merchantVpa?: string;
  merchantName?: string;
  expiresAt?: string;
  onPaymentSuccess?: (order?: any) => void;
  title?: string;
  subtitle?: string;
}

export const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber = '',
  amount,
  upiUrl = '',
  qrUrl = '',
  merchantVpa = 'vyapaarpro@upi',
  merchantName = 'VyapaarPro',
  onPaymentSuccess,
  title = 'Scan to Pay with UPI',
  subtitle = 'Zero redirects. Pay instantly from your UPI app.',
}) => {
  // Countdown timer (15 minutes by default = 900 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isPaid, setIsPaid] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  // UTR manual verification fallback
  const [showUtrInput, setShowUtrInput] = useState(false);
  const [utr, setUtr] = useState('');
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  const [utrError, setUtrError] = useState('');
  const [utrSuccess, setUtrSuccess] = useState('');

  // Copy state
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const pollIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(15 * 60);
      setIsPaid(false);
      setIsPolling(true);
      setPollCount(0);
      setShowUtrInput(false);
      setUtr('');
      setUtrError('');
      setUtrSuccess('');

      // Start countdown timer
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsPolling(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Start real-time order polling (every 2.5 seconds)
      pollIntervalRef.current = setInterval(async () => {
        if (!orderId) return;
        try {
          const res = await famGatewayService.checkOrderStatus(orderId);
          setPollCount((c) => c + 1);
          if (res.paid) {
            setIsPaid(true);
            setIsPolling(false);
            clearInterval(pollIntervalRef.current);
            clearInterval(timerIntervalRef.current);
            if (onPaymentSuccess) {
              onPaymentSuccess(res.order);
            }
          }
        } catch {
          // ignore transient poll error
        }
      }, 2500);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopyVpa = () => {
    if (navigator.clipboard && merchantVpa) {
      navigator.clipboard.writeText(merchantVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    }
  };

  const handleCopyAmount = () => {
    if (navigator.clipboard && amount) {
      navigator.clipboard.writeText(amount.toString());
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleOpenUpiApp = () => {
    if (upiUrl) {
      window.location.href = upiUrl;
    }
  };

  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError('');
    setUtrSuccess('');

    const clean = utr.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (!clean || clean.length < 6) {
      setUtrError('Please enter a valid 12-digit UPI Reference Number / UTR.');
      return;
    }

    setIsVerifyingUtr(true);
    try {
      const res = await famGatewayService.verifyUtr(orderId, clean);
      if (res.success) {
        setUtrSuccess('Payment verified successfully!');
        setIsPaid(true);
        setIsPolling(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      } else {
        setUtrError(res.error || 'Verification failed. Please check the UTR number.');
      }
    } catch (err: any) {
      setUtrError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-100 my-6 max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isPaid ? (
          /* Payment Success Confirmation View */
          <div className="text-center py-6 space-y-5 animate-in fade-in duration-300">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                Payment Confirmed
              </span>
              <h3 className="text-2xl font-bold text-white">Payment Received!</h3>
              <p className="text-sm text-slate-400 mt-1">
                Your payment of <span className="font-bold text-white">₹{amount}</span> has been verified.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Order Reference:</span>
                <span className="font-mono text-indigo-400 font-bold">{orderNumber || orderId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Payment Mode:</span>
                <span className="text-slate-200 font-medium">FamGateway UPI</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center">
                  <Check className="w-3 h-3 mr-1" /> Completed
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (orderId) {
                  window.location.href = `/store/payment-result?order_id=${encodeURIComponent(orderId)}`;
                }
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <span>View Order & Access Downloads</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Main In-Page UPI QR & Intent View */
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center pr-6 pl-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                <Sparkles className="w-3 h-3" />
                <span>FamGateway In-Page Checkout</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>

            {/* Amount & Countdown Bar */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Amount to Pay</p>
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-2xl font-black text-white">₹{amount}</span>
                  <button
                    type="button"
                    onClick={handleCopyAmount}
                    className="text-slate-500 hover:text-indigo-400 text-xs transition"
                    title="Copy amount"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="text-right">
                <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center justify-end">
                  <Clock className="w-3 h-3 mr-1 text-amber-400" /> Expires In
                </p>
                <span className={`font-mono text-base font-bold ${timeLeft < 180 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                  {formattedTime}
                </span>
              </div>
            </div>

            {/* Dynamic QR Code Box */}
            <div className="relative p-4 bg-white rounded-3xl shadow-inner flex flex-col items-center justify-center">
              {/* Scan Corner Guide Accents */}
              <div className="relative p-2 bg-white rounded-2xl flex items-center justify-center">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="UPI Payment QR Code"
                    className="w-56 h-56 object-contain rounded-xl select-none"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-100 rounded-xl text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                    <span className="text-xs font-medium">Generating QR...</span>
                  </div>
                )}
              </div>

              {/* UPI Logos & Brand Strip */}
              <div className="mt-2 flex items-center justify-center space-x-3 text-slate-700 text-[11px] font-semibold">
                <span className="text-indigo-600 font-bold">GPay</span>
                <span className="text-purple-600 font-bold">PhonePe</span>
                <span className="text-sky-600 font-bold">Paytm</span>
                <span className="text-emerald-600 font-bold">BHIM</span>
                <span className="text-slate-500">Cred</span>
              </div>
            </div>

            {/* Mobile 1-Tap UPI Intent Button */}
            {upiUrl && (
              <button
                type="button"
                onClick={handleOpenUpiApp}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Pay via UPI App (PhonePe / GPay)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>
            )}

            {/* Live Auto-Polling Status Bar */}
            <div className="p-3 bg-indigo-950/30 rounded-2xl border border-indigo-500/20 flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-indigo-300">Auto-detecting payment...</p>
                <p className="text-[11px] text-slate-400">Do not close this page. Screen will update automatically.</p>
              </div>
            </div>

            {/* UPI ID Details for manual entry */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="overflow-hidden">
                <span className="text-slate-400 text-[11px] block">Merchant UPI VPA:</span>
                <span className="font-mono text-slate-200 font-medium truncate block">{merchantVpa}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyVpa}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium flex items-center space-x-1 transition cursor-pointer ml-2 flex-shrink-0"
              >
                {copiedVpa ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Manual UTR Verification Toggle */}
            <div className="border-t border-slate-800/80 pt-3">
              <button
                type="button"
                onClick={() => setShowUtrInput(!showUtrInput)}
                className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer flex items-center justify-center space-x-1 py-1"
              >
                <span>{showUtrInput ? 'Hide UTR submission' : 'Already paid? Enter 12-digit UTR Number'}</span>
              </button>

              {showUtrInput && (
                <form onSubmit={handleVerifyUtr} className="mt-3 space-y-2.5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      12-Digit UPI Reference / UTR Number:
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="e.g. 428190348291"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                    />
                  </div>

                  {utrError && (
                    <div className="flex items-center space-x-1.5 text-xs text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{utrError}</span>
                    </div>
                  )}

                  {utrSuccess && (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{utrSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifyingUtr || !utr.trim()}
                    className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {isVerifyingUtr ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying with Gateway...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Submit & Confirm Payment</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
