import React, { useState } from 'react';
import {
  ExternalLink,
  Share2,
  Copy,
  Check,
  Globe,
  Sliders,
  Info,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';
import { StoreOrder } from '../../types';

interface SocialServiceOrderCardProps {
  order: StoreOrder;
  isAdminView?: boolean;
}

export const SocialServiceOrderCard: React.FC<SocialServiceOrderCardProps> = ({
  order,
  isAdminView = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showConfigSnapshot, setShowConfigSnapshot] = useState(false);

  // Extract snapshot data from order level or item level
  const snapshot: Record<string, any> =
    order.service_fields_snapshot ||
    order.items?.[0]?.fields_snapshot ||
    {};

  const firstItem = order.items?.[0];
  const product = firstItem?.product;

  // Determine platform
  const rawPlatform =
    snapshot.platform ||
    product?.platform ||
    (order.target_url?.includes('instagram.com')
      ? 'Instagram'
      : order.target_url?.includes('youtube.com') || order.target_url?.includes('youtu.be')
      ? 'YouTube'
      : order.target_url?.includes('facebook.com')
      ? 'Facebook'
      : order.target_url?.includes('twitter.com') || order.target_url?.includes('x.com')
      ? 'X (Twitter)'
      : order.target_url?.includes('t.me')
      ? 'Telegram'
      : order.target_url?.includes('tiktok.com')
      ? 'TikTok'
      : order.target_url?.includes('spotify.com')
      ? 'Spotify'
      : order.target_url?.includes('discord')
      ? 'Discord'
      : 'Social Media');

  const platformName =
    rawPlatform.charAt(0).toUpperCase() + rawPlatform.slice(1).toLowerCase();

  // Determine service name
  const serviceName =
    snapshot.service ||
    product?.service_type ||
    firstItem?.product_name_snapshot ||
    'Service';

  // Determine target link or username
  const target =
    order.target_url ||
    snapshot.target ||
    snapshot.target_url ||
    snapshot.link ||
    snapshot.profile_url ||
    snapshot.channel_url ||
    snapshot.post_url ||
    snapshot.reel_url ||
    snapshot.server_invite ||
    snapshot.url ||
    order.target_username ||
    snapshot.target_username ||
    snapshot.username ||
    '';

  // Determine quantity
  const quantity =
    snapshot.quantity ||
    firstItem?.quantity ||
    1;

  // Additional instructions
  const additionalInstructions =
    snapshot.additional_instructions ||
    snapshot.instructions ||
    snapshot.comments ||
    snapshot.comment_instructions ||
    order.delivery_notes ||
    '';

  const isUrl = (val: string) => {
    return /^https?:\/\//i.test(val) || /^www\./i.test(val);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // If there is no snapshot and no target_url and not a social service, don't render
  const isSocialService =
    Boolean(order.target_url) ||
    Boolean(order.target_username) ||
    Boolean(order.service_fields_snapshot && Object.keys(order.service_fields_snapshot).length > 0) ||
    Boolean(product?.platform && product.platform !== 'digital');

  if (!isSocialService && Object.keys(snapshot).length === 0) {
    return null;
  }

  // Filter out meta keys to show custom submitted fields
  const standardKeys = new Set([
    'platform',
    'service',
    'quantity',
    'target',
    'target_url',
    'target_username',
    'url',
    'link',
    'username',
    'profile_url',
    'channel_url',
    'post_url',
    'reel_url',
    'server_invite',
    'additional_instructions',
    'instructions',
    'comments',
    'comment_instructions',
  ]);

  const customFieldEntries = Object.entries(snapshot).filter(
    ([k]) => !standardKeys.has(k)
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-violet-400 font-bold uppercase tracking-wider">
                Submitted Order Specifications
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/20 text-violet-300">
                {platformName}
              </span>
            </div>
            <h2 className="text-lg font-black text-white mt-0.5">Social Service Order</h2>
          </div>
        </div>

        {/* Read-only badge */}
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Locked Snapshot</span>
          </span>
        </div>
      </div>

      {/* Primary Spec Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {/* Platform */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Platform
          </span>
          <p className="text-sm font-bold text-white flex items-center space-x-1.5">
            <Globe className="w-4 h-4 text-violet-400" />
            <span>{platformName}</span>
          </p>
        </div>

        {/* Service */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Service
          </span>
          <p className="text-sm font-bold text-white truncate" title={serviceName}>
            {serviceName}
          </p>
        </div>

        {/* Quantity */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Quantity
          </span>
          <p className="text-sm font-black text-violet-400">
            {Number(quantity).toLocaleString('en-IN')} units
          </p>
        </div>

        {/* Amount */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Order Total
          </span>
          <p className="text-sm font-black text-emerald-400">
            ₹{Math.round(order.total_paise / 100).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Target Link or Username - Clickable safely in new tab */}
      {target && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Target URL / Account Handle</span>
              <span className="text-emerald-400 font-normal text-[11px]">(Required for fulfillment)</span>
            </span>
            <button
              onClick={() => copyToClipboard(target, 'target')}
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer transition"
              title="Copy target"
            >
              {copiedKey === 'target' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
            <div className="truncate text-slate-200 font-medium select-all">
              {target}
            </div>

            {isUrl(target) ? (
              <a
                href={target.startsWith('http') ? target : `https://${target}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-violet-600/20 transition cursor-pointer"
                title="Open safely in new browser tab"
              >
                <span>Open Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="shrink-0 px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-400 font-sans">
                Username Handle
              </span>
            )}
          </div>
        </div>
      )}

      {/* Additional Instructions if provided */}
      {additionalInstructions && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 relative z-10">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Additional Instructions
          </span>
          <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {additionalInstructions}
          </p>
        </div>
      )}

      {/* Custom Dynamic Ordering Fields Snapshot */}
      {customFieldEntries.length > 0 && (
        <div className="space-y-3 relative z-10 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Other Custom Service Fields
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {customFieldEntries.map(([key, value]) => {
              const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
              const label = key
                .split('_')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
              return (
                <div key={key} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
                  <div className="text-white font-medium break-words">
                    {isUrl(strVal) ? (
                      <a
                        href={strVal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:underline flex items-center space-x-1"
                      >
                        <span className="truncate">{strVal}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      strVal
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Notice: Locked / Cannot edit after payment */}
      {!isAdminView && (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            These parameters are securely locked to your order receipt. If you need any corrections, please contact support with order ref{' '}
            <strong className="text-white font-mono">{order.order_number}</strong>.
          </span>
        </div>
      )}

      {/* Admin-only Service Configuration Snapshot */}
      {isAdminView && (
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <button
            type="button"
            onClick={() => setShowConfigSnapshot(!showConfigSnapshot)}
            className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800/60 border border-slate-800 text-slate-300 text-xs font-semibold transition flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              <span>Full Raw Service Snapshot & Metadata</span>
            </div>
            {showConfigSnapshot ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showConfigSnapshot && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono pb-3 border-b border-slate-900">
                <div>
                  <span className="text-slate-500 block">Status:</span>
                  <span className="text-emerald-400 font-bold">{order.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Currency:</span>
                  <span className="text-white">{order.currency}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Subtotal:</span>
                  <span className="text-white">₹{Math.round(order.subtotal_paise / 100)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Created:</span>
                  <span className="text-slate-300">{new Date(order.created_at).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Submitted Fields Snapshot JSON:
                </span>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(
                    {
                      platform: platformName,
                      service: serviceName,
                      target: target,
                      quantity: quantity,
                      submitted_fields: snapshot,
                      item_snapshot: firstItem
                        ? {
                            name: firstItem.product_name_snapshot,
                            unit_price_paise: firstItem.unit_price_paise,
                            quantity: firstItem.quantity,
                            total_paise: firstItem.total_paise,
                          }
                        : null,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
