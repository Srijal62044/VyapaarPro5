import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Download,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Share2,
  FileCode,
  Zap,
  Lock,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { StoreProduct } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { StoreCheckoutModal } from '../../components/store/StoreCheckoutModal';
import { SEO } from '../../components/common/SEO';

export const StoreDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const data = await storeDataService.getProductBySlug(slug);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name || 'VyapaarPro Digital Product',
        text: product?.short_description || '',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400">Loading product information...</p>
      </div>
    );
  }

  if (!product || product.status !== 'PUBLISHED') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Download className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Product Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This digital product may have been archived or is no longer available in the store catalogue.
          </p>
          <Link
            to="/store"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Digital Store</span>
          </Link>
        </div>
      </div>
    );
  }

  const priceRupees = Math.round(product.price_paise / 100);
  const compareRupees = product.compare_at_price_paise
    ? Math.round(product.compare_at_price_paise / 100)
    : null;

  const discountPercent =
    compareRupees && compareRupees > priceRupees
      ? Math.round(((compareRupees - priceRupees) / compareRupees) * 100)
      : null;

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <SEO
        title={`${product.name} | VyapaarPro Digital Store`}
        description={product.short_description}
        ogImage={product.thumbnail_url || undefined}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-8">
          <Link to="/store" className="hover:text-white transition flex items-center space-x-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Store</span>
          </Link>
          <span>/</span>
          {product.category_name && (
            <>
              <Link
                to={`/store?category=${product.category_id}`}
                className="hover:text-white transition"
              >
                {product.category_name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-slate-200 truncate">{product.name}</span>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Media & Description (7 Cols) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Product Thumbnail Viewer */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
              {product.thumbnail_url ? (
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-8 text-center">
                  <Download className="w-12 h-12 text-indigo-400 mb-3" />
                  <span className="text-sm font-semibold text-slate-300">{product.name}</span>
                  <span className="text-xs text-slate-500 mt-1">Digital Asset Package</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                {product.category_name && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 text-white backdrop-blur-md border border-slate-800">
                    {product.category_name}
                  </span>
                )}
                {product.featured && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600/90 text-white backdrop-blur-md flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Featured Asset</span>
                  </span>
                )}
              </div>
            </div>

            {/* Product Description */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <span>Product Overview & Details</span>
              </h2>

              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-line font-normal">
                {product.description}
              </div>

              {/* Digital Specifications */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Delivery Method
                  </span>
                  <span className="text-xs font-semibold text-white">Instant Download</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    File Type
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {product.mime_type ? product.mime_type.split('/').pop()?.toUpperCase() : 'ZIP / Archive'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Licensing
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">Commercial Use</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Sticky Card (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {product.name}
                </h1>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {product.short_description}
                </p>
              </div>

              {/* Price Display */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Total Investment</span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-3xl font-black text-white">
                      ₹{priceRupees.toLocaleString('en-IN')}
                    </span>
                    {compareRupees && compareRupees > priceRupees && (
                      <span className="text-sm text-slate-500 line-through">
                        ₹{compareRupees.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {discountPercent && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              {/* Purchase Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Buy Now • Instant Download</span>
                </button>

                <button
                  onClick={handleShare}
                  className="w-full py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isCopied ? 'Link Copied!' : 'Share Digital Product'}</span>
                </button>
              </div>

              {/* Deliverable Checkmarks */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Instant file download link sent to your email & customer dashboard</span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Encrypted payment processed via FamGateway</span>
                </div>
                <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>100% full source & asset usage rights included</span>
                </div>
              </div>

              {/* Payment Support Footer */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Zero recurring fees. One-time payment for perpetual access.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <StoreCheckoutModal
        product={product}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
};
