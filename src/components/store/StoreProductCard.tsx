import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Sparkles, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';
import { StoreProduct } from '../../types';

interface StoreProductCardProps {
  product: StoreProduct;
  onBuyNow?: (product: StoreProduct) => void;
}

export const StoreProductCard: React.FC<StoreProductCardProps> = ({ product, onBuyNow }) => {
  const priceRupees = Math.round(product.price_paise / 100);
  const compareRupees = product.compare_at_price_paise
    ? Math.round(product.compare_at_price_paise / 100)
    : null;

  const discountPercent =
    compareRupees && compareRupees > priceRupees
      ? Math.round(((compareRupees - priceRupees) / compareRupees) * 100)
      : null;

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
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950/40 text-slate-500 p-4 text-center">
              <Download className="w-8 h-8 text-indigo-400/60 mb-2" />
              <span className="text-xs font-medium text-slate-400">Digital Product</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {product.category_name && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 text-white backdrop-blur-md border border-slate-800">
                {product.category_name}
              </span>
            )}
            {product.featured && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-600/90 text-white backdrop-blur-md flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Featured</span>
              </span>
            )}
          </div>

          {discountPercent && (
            <div className="absolute top-3 right-3 z-10">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500 text-slate-950">
                {discountPercent}% OFF
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition line-clamp-1">
            <Link to={`/store/${product.slug}`}>{product.name}</Link>
          </h3>

          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.short_description}
          </p>

          <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Instant Digital Download Access</span>
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
          <span className="text-[10px] text-slate-400 block">One-time purchase</span>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/store/${product.slug}`}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Details
          </Link>
          <button
            onClick={() => onBuyNow ? onBuyNow(product) : undefined}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
