import React, { useState } from 'react';
import {
  X,
  Wallet,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CreditCard,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { famGatewayService } from '../../services/famGatewayService';
import { PaymentQRModal } from './PaymentQRModal';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFundsAdded?: (amount: number) => void;
}

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2000, 5000];

export const AddFundsModal: React.FC<AddFundsModalProps> = ({
  isOpen,
  onClose,
  onFundsAdded,
}) => {
  const { profile } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment QR Session State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    orderId: string;
    orderNumber: string;
    amount: number;
    upiUrl?: string;
    qrUrl?: string;
    merchantVpa?: string;
    merchantName?: string;
  } | null>(null);

  if (!isOpen) return null;

  const currentAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;

  const handleSelectPreset = (amt: number) => {
    setSelectedAmount(amt);
    setIsCustom(false);
    setErrorMessage('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    setIsCustom(true);
    setErrorMessage('');
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (currentAmount < 10) {
      setErrorMessage('Minimum amount is ₹10.');
      return;
    }
    if (currentAmount > 100000) {
      setErrorMessage('Maximum amount per transaction is ₹1,00,000.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderRef = `FUNDS-${Date.now().toString().slice(-6)}`;
      const res = await fetch('/api/famgateway/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: currentAmount,
          customerName: profile?.full_name || 'Customer',
          customerEmail: profile?.email || '',
          customerPhone: profile?.phone || '',
          purpose: 'wallet_deposit',
          orderId: orderRef,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize payment gateway.');
      }

      // Open in-page zero-redirect dynamic QR modal
      setQrModalData({
        isOpen: true,
        orderId: data.orderId || orderRef,
        orderNumber: data.orderNumber || orderRef,
        amount: currentAmount,
        upiUrl: data.upiUrl,
        qrUrl: data.qrUrl,
        merchantVpa: data.merchantVpa,
        merchantName: data.merchantName,
      });
    } catch (err: any) {
      console.error('Add funds error:', err);
      setErrorMessage(err.message || 'Payment initialization failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Add Funds to Wallet</h3>
              <p className="text-xs text-slate-400">Instant UPI deposit with zero external redirects.</p>
            </div>
          </div>

          <form onSubmit={handleProceedToPayment} className="space-y-6">
            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Select Amount (INR)
              </label>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = !isCustom && selectedAmount === amt;
                  return (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => handleSelectPreset(amt)}
                      className={`py-2.5 px-3 rounded-xl font-semibold text-sm transition cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder="Or enter custom amount"
                  className={`w-full pl-8 pr-4 py-2.5 bg-slate-950 border rounded-xl text-white text-sm focus:outline-none transition ${
                    isCustom
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-800 focus:border-slate-700'
                  }`}
                />
              </div>
            </div>

            {/* Payment Method Badge */}
            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">FamGateway Dynamic UPI QR</p>
                  <p className="text-[11px] text-slate-400">Zero redirects • In-app scanner & auto-polling</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                0% Fee
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting || currentAmount <= 0}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Dynamic QR Code...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Pay ₹{currentAmount.toLocaleString('en-IN')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Render Dynamic UPI QR Modal upon submission */}
      {qrModalData && (
        <PaymentQRModal
          isOpen={qrModalData.isOpen}
          onClose={() => {
            setQrModalData(null);
            onClose();
          }}
          orderId={qrModalData.orderId}
          orderNumber={qrModalData.orderNumber}
          amount={qrModalData.amount}
          upiUrl={qrModalData.upiUrl}
          qrUrl={qrModalData.qrUrl}
          merchantVpa={qrModalData.merchantVpa}
          merchantName={qrModalData.merchantName}
          title="Scan to Add Funds"
          subtitle="Scan the QR or open your UPI app to complete the deposit."
          onPaymentSuccess={() => {
            if (onFundsAdded) {
              onFundsAdded(qrModalData.amount);
            }
          }}
        />
      )}
    </>
  );
};
