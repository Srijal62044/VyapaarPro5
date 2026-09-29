import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Share2,
  Layers,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  ShieldCheck,
  Hash,
} from 'lucide-react';
import { StoreOrder } from '../../types';

interface SocialOrderSubmittedDetailsProps {
  order: StoreOrder;
  isAdmin?: boolean;
}

export const SocialOrderSubmittedDetails: React.FC<SocialOrderSubmittedDetailsProps> = ({
  order,
  isAdmin = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const snapshot = order.service_fields_snapshot || order.items?.[0]?.fields_snapshot || {};
  const firstItem = order.items?.[0];
  const product = firstItem?.product;

  const platform = product?.platform || (snapshot.platform as string) || '';
  const serviceType = product?.service_type || (snapshot.service_type as string) || '';
  const quantity = firstItem?.quantity || Number(snapshot.quantity) || 1;

  // If there are no dynamic submitted fields and not a social product, return null
  const hasFields = Object.keys(snapshot).length > 0 || !!order.target_url || !!order.target_username || (product?.platform && product.platform !== 'digital');
  if (!hasFields) {
    return null;
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const isUrl = (val: string) => {
    return /^https?:\/\//i.test(val) || (val.includes('.') && !val.includes(' ') && val.length > 5);
  };

  const normalizeUrl = (val: string) => {
    if (/^https?:\/\//i.test(val)) return val;
    return `https://${val}`;
  };

  // Find target url or username from snapshot or order columns
  const targetVal =
    order.target_url ||
    snapshot.target_url ||
    snapshot.url ||
    snapshot.link ||
    snapshot.target_username ||
    snapshot.username ||
    order.target_username ||
    '';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                {isAdmin ? 'Admin Fulfillment Details' : 'Your Submitted Service Order Details'}
              </span>
              {platform && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                  {platform}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {firstItem?.product_name_snapshot || 'Social Media Service Package'}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-slate-950 border border-slate-800 text-indigo-300">
            Quantity: {quantity.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Grid of Key Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Target URL / Profile */}
        {targetVal && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Link / Profile</span>
              </span>
              <button
                onClick={() => copyToClipboard(targetVal, 'target')}
                className="text-slate-400 hover:text-white flex items-center space-x-1 transition cursor-pointer"
                title="Copy Target Link"
              >
                {copiedKey === 'target' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{copiedKey === 'target' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-1 flex items-center justify-between gap-3">
              <p className="font-mono text-white text-xs truncate break-all select-all">{targetVal}</p>
              {isUrl(targetVal) && (
                <a
                  href={normalizeUrl(targetVal)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold transition flex items-center space-x-1.5 shrink-0"
                >
                  <span>Open Safely</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Custom Fields from Snapshot */}
        {Object.entries(snapshot).map(([key, value]) => {
          // Skip keys already displayed or internal
          if (
            key === 'target_url' ||
            key === 'url' ||
            key === 'link' ||
            key === 'target_username' ||
            key === 'username' ||
            key === 'platform' ||
            key === 'service_type' ||
            key === 'quantity' ||
            !value
          ) {
            return null;
          }

          const label = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

          const strVal = String(value);

          return (
            <div key={key} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                <button
                  onClick={() => copyToClipboard(strVal, key)}
                  className="text-slate-400 hover:text-white transition cursor-pointer"
                  title="Copy"
                >
                  {copiedKey === key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-white text-xs whitespace-pre-wrap break-words">{strVal}</p>
            </div>
          );
        })}
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Zero account password requirement. Automated server-side pacing.</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Immutable Order Snapshot</span>
      </div>
    </div>
  );
};
