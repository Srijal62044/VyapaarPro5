import React from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  Clock,
  Flame,
  Zap,
} from 'lucide-react';
import { StoreProduct } from '../../types';

interface StoreProductCardProps {
  product: StoreProduct;
  onBuyNow?: (product: StoreProduct) => void;
}

export const getPlatformBadge = (platform?: string | null) => {
  switch (platform?.toLowerCase()) {
    case 'instagram':
      return {
        label: 'Instagram',
        bg: 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 text-pink-300 border-pink-500/30',
      };
    case 'youtube':
      return {
        label: 'YouTube',
        bg: 'bg-red-500/15 text-red-400 border-red-500/30',
      };
    case 'facebook':
      return {
        label: 'Facebook',
        bg: 'bg-blue-600/15 text-blue-400 border-blue-500/30',
      };
    case 'twitter':
      return {
        label: 'X / Twitter',
        bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      };
    case 'telegram':
      return {
        label: 'Telegram',
        bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      };
    case 'tiktok':
      return {
        label: 'TikTok',
        bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
      };
    case 'threads':
      return {
        label: 'Threads',
        bg: 'bg-slate-800 text-slate-200 border-slate-700',
      };
    case 'snapchat':
      return {
        label: 'Snapchat',
        bg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      };
    case 'pinterest':
      return {
        label: 'Pinterest',
        bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      };
    case 'linkedin':
      return {
        label: 'LinkedIn',
        bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      };
    case 'discord':
      return {
        label: 'Discord',
        bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      };
    case 'spotify':
      return {
        label: 'Spotify',
        bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      };
    default:
      return {
        label: 'Digital Product',
        bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      };
  }
};

export const StoreProductCard: React.FC<StoreProductCardProps> = ({ product, onBuyNow }) => {
  const priceRupees = Math.round(product.price_paise / 100);
  const compareRupees = product.compare_at_price_paise
    ? Math.round(product.compare_at_price_paise / 100)
    : null;

  const discountPercent =
    compareRupees && compareRupees > priceRupees
      ? Math.round(((compareRupees - priceRupees) / compareRupees) * 100)
      : null;

  const badge = getPlatformBadge(product.platform);

  return (
    <div className="group bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-950/20">
      <div>
        {/* Thumbnail preview */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
          {product.thumbnail_url ? (
            <img
              src={product.thumbnail_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 text-slate-500 p-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                {product.platform ? (
                  <Flame className="w-6 h-6 text-indigo-400" />
                ) : (
                  <Download className="w-6 h-6 text-indigo-400" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-300">{badge.label}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md border ${badge.bg}`}
            >
              {product.category_name || badge.label}
            </span>
            {product.featured && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-slate-950 backdrop-blur-md flex items-center space-x-1 shadow-md">
                <Sparkles className="w-3 h-3" />
                <span>Featured</span>
              </span>
            )}
          </div>

          {discountPercent && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-500 text-slate-950 shadow-md">
                {discountPercent}% OFF
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
            <Link to={`/store/${product.slug}`}>{product.name}</Link>
          </h3>

          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center space-x-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{product.delivery_time_info || 'Instant Processing'}</span>
            </span>
            {product.min_quantity && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Min: {product.min_quantity.toLocaleString()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Price & Actions */}
      <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/60 mt-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-white">
              ₹{priceRupees.toLocaleString('en-IN')}
            </span>
            {compareRupees && compareRupees > priceRupees && (
              <span className="text-xs text-slate-500 line-through">
                ₹{compareRupees.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">Starting Package</span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/store/${product.slug}`}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Details
          </Link>
          <button
            onClick={() => (onBuyNow ? onBuyNow(product) : undefined)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
