import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Copy,
  Check,
  Key,
  FileCode,
  Info,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Lock,
  Share2,
} from 'lucide-react';
import { StoreOrder, StoreProduct } from '../../types';
import { formatWhatsAppDeliveryMessage, getCustomerSupportWhatsAppUrl, getWhatsAppDeliveryUrl } from '../../services/storeDelivery';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';

interface StoreProductDeliveryDetailsProps {
  order: StoreOrder;
  product?: StoreProduct;
  isAdminView?: boolean;
}

export const StoreProductDeliveryDetails: React.FC<StoreProductDeliveryDetailsProps> = ({
  order,
  product: initialProduct,
  isAdminView = false,
}) => {
  const { settings } = useSettings();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // Fallback to item snapshot or product attached to order items
  const product: StoreProduct | undefined =
    initialProduct || order.items?.[0]?.product;

  const accessLink = product?.access_link || '';
  const licenseKey = product?.license_key || '';
  const instructions = product?.instructions || '';
  const accessInfo = product?.access_info || '';
  const deliveryNotes = order.delivery_notes || product?.delivery_notes || '';
  const hasFile = Boolean(product?.product_file_path || product?.file_name);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSecureDownload = async () => {
    setIsDownloading(true);
    setDownloadError('');
    try {
      const session = (await supabase?.auth.getSession())?.data.session;
      const token = session?.access_token || '';

      // First try to download via API if user is authenticated
      const res = await fetch(`/api/store/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          downloadId: order.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.downloadUrl) {
          window.location.href = data.downloadUrl;
          return;
        }
      }

      // If direct API returned 404 or fallback, check storage signed url
      if (product?.product_file_path && supabase) {
        const { data: signedData, error: signErr } = await supabase.storage
          .from('store-products-private')
          .createSignedUrl(product.product_file_path, 300, {
            download: product.file_name || 'download.zip',
          });

        if (!signErr && signedData?.signedUrl) {
          window.location.href = signedData.signedUrl;
          return;
        }
      }

      // If offline/preview mode simulation
      if (product?.file_name) {
        // Create an informational download receipt text file in preview/offline mode
        const textContent = `VyapaarPro Digital Product Delivery Receipt\n=========================================\nOrder Number: ${order.order_number}\nProduct: ${product?.name || 'Digital Product'}\nLicensed To: ${order.customer_name || 'Customer'} (${order.customer_email || '—'})\nLicense Key: ${licenseKey || 'VP-LIC-PRO'}\nAccess Link: ${accessLink || 'N/A'}\nDate: ${new Date().toISOString()}\n\nThank you for choosing VyapaarPro!`;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = product.file_name || `${order.order_number}-delivery.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      throw new Error('No digital file package is linked to this order.');
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadError(err.message || 'Failed to initialize secure download.');
    } finally {
      setIsDownloading(false);
    }
  };

  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  const handleAdminSendWhatsApp = () => {
    if (!isAdminView) return;
    if (order.customer_phone) {
      if (hasFile && product?.file_name) {
        setAdminNotice(
          `WhatsApp message prepared. Note: WhatsApp web links cannot automatically attach binary files. Please attach "${product.file_name}" manually in the opened chat window.`
        );
      }
      const url = getWhatsAppDeliveryUrl(order.customer_phone, order, product, settings.whatsapp);
      window.open(url, '_blank');
    } else {
      alert('No customer phone number recorded for this order.');
    }
  };

  const handleContactSupport = () => {
    const url = getCustomerSupportWhatsAppUrl(order, settings.whatsapp || '919876543210');
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Container Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-emerald-950/20">
        {/* Glow & Badge Accent */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Deliverables</span>
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">Order {order.order_number}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-2 flex items-center space-x-2">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
              <span>Your Product / Delivery</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Your payment has been confirmed. Below are your authorized digital assets, access credentials, and instructions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Admin-only Send on WhatsApp action */}
            {isAdminView && order.customer_phone && (
              <button
                onClick={handleAdminSendWhatsApp}
                className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                title="Admin only: Send verified delivery dispatch via WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Send on WhatsApp</span>
              </button>
            )}

            {/* General customer support button */}
            <button
              onClick={handleContactSupport}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer"
              title="Need assistance with this order"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Contact Support</span>
            </button>
          </div>
        </div>

        {/* Admin Attachment Notice */}
        {isAdminView && adminNotice && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="flex-1">
              <strong className="text-amber-200 block mb-0.5">Admin Dispatch Notice:</strong>
              <span>{adminNotice}</span>
            </div>
            <button onClick={() => setAdminNotice(null)} className="text-amber-400 hover:text-white text-xs ml-2">
              Dismiss
            </button>
          </div>
        )}

        {downloadError && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{downloadError}</span>
          </div>
        )}

        {/* Content Section */}
        <div className="mt-6 space-y-6 relative z-10">
          {/* 1. Primary Action: Download Package or Access Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Download Card */}
            {hasFile && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                      Digital Download Package
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      {product?.file_name || 'Downloadable Asset Bundle'}
                    </h3>
                    {product?.file_size_bytes && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(product.file_size_bytes / (1024 * 1024)).toFixed(2)} MB • {product.mime_type || 'Digital Archive'}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSecureDownload}
                  disabled={isDownloading}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Secure Token...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Digital Package</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Access Link Card */}
            {accessLink && (
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Direct Access / Portal Link
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5 truncate">
                      Cloud Resource & Dashboard
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">
                      {accessLink}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={accessLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
                  >
                    <span>Open Access Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(accessLink, 'accessLink')}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Copy Access Link"
                  >
                    {copiedField === 'accessLink' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. License / Access Code (if configured) */}
          {licenseKey && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    License / Access Key
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Active & Valid</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-300 font-mono text-xs font-semibold tracking-wider select-all overflow-x-auto">
                  {licenseKey}
                </div>
                <button
                  onClick={() => copyToClipboard(licenseKey, 'licenseKey')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  {copiedField === 'licenseKey' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 3. Access Information / Credentials (if configured) */}
          {accessInfo && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-violet-400" />
                  <span>Access Credentials & Setup Details</span>
                </span>
                <button
                  onClick={() => copyToClipboard(accessInfo, 'accessInfo')}
                  className="text-[11px] text-slate-400 hover:text-white transition flex items-center space-x-1"
                >
                  {copiedField === 'accessInfo' ? (
                    <span className="text-emerald-400 font-semibold">Copied!</span>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                {accessInfo}
              </pre>
            </div>
          )}

          {/* 4. Product Instructions (if configured) */}
          {instructions && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Product Instructions & Setup Guide</span>
              </span>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {instructions}
              </div>
            </div>
          )}

          {/* 5. Delivery Notes (if configured) */}
          {deliveryNotes && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Special Delivery Notes from VyapaarPro</span>
              </span>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {deliveryNotes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
