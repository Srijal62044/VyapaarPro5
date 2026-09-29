import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  Download,
  ShoppingBag,
  ShieldCheck,
  Zap,
  ArrowRight,
  PackageOpen,
  Share2,
  Code,
  Layers,
} from 'lucide-react';
import { StoreCategory, StoreProduct } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { StoreProductCard } from '../../components/store/StoreProductCard';
import { StoreCheckoutModal } from '../../components/store/StoreCheckoutModal';
import { SEO } from '../../components/common/SEO';

const STORE_PLATFORMS = [
  { id: 'all', name: 'All Services & Products' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'twitter', name: 'X / Twitter' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'threads', name: 'Threads' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'pinterest', name: 'Pinterest' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'discord', name: 'Discord' },
  { id: 'spotify', name: 'Spotify' },
  { id: 'digital', name: 'Digital & Software' },
];

export const StorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const platformParam = searchParams.get('platform') || searchParams.get('category') || 'all';

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>(platformParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [isLoading, setIsLoading] = useState(true);

  // Selected product for direct modal checkout
  const [checkoutProduct, setCheckoutProduct] = useState<StoreProduct | null>(null);

  useEffect(() => {
    async function loadStore() {
      setIsLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          storeDataService.getCategories(true),
          storeDataService.getProducts({ includeAllStatuses: false }),
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.error('Failed to load store catalogue:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStore();
  }, []);

  useEffect(() => {
    setSelectedPlatform(platformParam);
  }, [platformParam]);

  const handlePlatformChange = (platId: string) => {
    setSelectedPlatform(platId);
    if (platId === 'all') {
      searchParams.delete('platform');
      searchParams.delete('category');
    } else {
      searchParams.set('platform', platId);
    }
    setSearchParams(searchParams);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((p) => {
      if (selectedPlatform !== 'all') {
        const target = selectedPlatform.toLowerCase();
        const plat = (p.platform || '').toLowerCase();
        const cat = (p.category_id || '').toLowerCase();
        const slug = (p.slug || '').toLowerCase();

        const matchesPlatform =
          plat === target ||
          (target === 'twitter' && (plat === 'x' || plat === 'twitter')) ||
          (target === 'digital' && (!p.platform || plat === 'digital' || plat === 'boilerplate')) ||
          cat === target ||
          cat === `cat-${target}` ||
          slug.startsWith(target) ||
          slug.includes(target);

        if (!matchesPlatform) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.platform && p.platform.toLowerCase().includes(q)) ||
          (p.service_type && p.service_type.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price_paise - b.price_paise;
      if (sortBy === 'price_desc') return b.price_paise - a.price_paise;
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

  return (
    <div className="min-h-screen">
      <SEO
        title="Digital Store & Social Media Growth | VyapaarPro"
        description="Explore social media growth services for Instagram, YouTube, Facebook, X, Telegram, and premium digital software templates with instant delivery."
      />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950 border-b border-slate-900">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-gradient-to-tr from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Header Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Social Media Services & Digital Assets</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              VyapaarPro <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-sky-400">Digital Store</span>
            </h1>

            <p className="mt-4 text-sm sm:text-lg text-slate-300 leading-relaxed font-normal">
              High-retention social media growth packages and production-grade developer software kits with instant automated processing.
            </p>

            {/* Value Props Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-300">Instant Processing & Delivery</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300">100% Non-Drop & Safe</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Download className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-300">Direct Tracking & Downloads</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATALOGUE CONTROLS & PRODUCT GRID */}
      <section className="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search & Sort Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services (e.g. Instagram Followers, YouTube Views)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">Newest Releases</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Platform Hierarchy Pills (Dynamic from database/catalog) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {STORE_PLATFORMS.map((plat) => {
            const isSelected = selectedPlatform === plat.id;
            return (
              <button
                key={plat.id}
                onClick={() => handlePlatformChange(plat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{plat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid / Loading / Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 animate-pulse space-y-4">
                <div className="aspect-video bg-slate-800/80 rounded-xl" />
                <div className="h-4 bg-slate-800/80 rounded w-3/4" />
                <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                <div className="h-8 bg-slate-800/40 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                onBuyNow={(p) => setCheckoutProduct(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-slate-900/40 border border-slate-800/80 rounded-3xl max-w-xl mx-auto my-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Services Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No items matched your search "${searchQuery}". Try selecting "All Services & Products" or a different search term.`
                : 'No services available in this category yet. Check back soon or select another platform.'}
            </p>
            {(searchQuery || selectedPlatform !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handlePlatformChange('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Show All Services
              </button>
            )}
          </div>
        )}
      </section>

      {/* Direct Checkout Modal */}
      <StoreCheckoutModal
        product={checkoutProduct}
        isOpen={!!checkoutProduct}
        onClose={() => setCheckoutProduct(null)}
      />
    </div>
  );
};
