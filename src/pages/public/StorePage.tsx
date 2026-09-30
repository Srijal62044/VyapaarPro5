import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  Download,
  ShieldCheck,
  Zap,
  PackageOpen,
  Share2,
  Code,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { StoreCategory, StoreProduct, isDigitalProduct, isSocialService, CatalogCategoryType } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { StoreProductCard } from '../../components/store/StoreProductCard';
import { StoreCheckoutModal } from '../../components/store/StoreCheckoutModal';
import { SEO } from '../../components/common/SEO';

interface SocialPlatformOption {
  id: string;
  name: string;
  icon?: string;
}

const SOCIAL_PLATFORMS: SocialPlatformOption[] = [
  { id: 'all', name: 'All Platforms' },
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
];

export const StorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const typeParam = searchParams.get('type') || searchParams.get('category');
  const platformParam = searchParams.get('platform');

  // Determine initial active primary category tab
  const initialCategoryType: CatalogCategoryType =
    typeParam === 'digital' || typeParam === 'digital-products' || typeParam === 'software'
      ? 'DIGITAL_PRODUCT'
      : 'SOCIAL_SERVICE';

  const [activeCategoryType, setActiveCategoryType] = useState<CatalogCategoryType>(initialCategoryType);
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<string>(platformParam || 'all');
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [isLoading, setIsLoading] = useState(true);

  // Selected product for direct modal checkout
  const [checkoutProduct, setCheckoutProduct] = useState<StoreProduct | null>(null);

  useEffect(() => {
    async function loadStoreCatalogue() {
      setIsLoading(true);
      try {
        const prods = await storeDataService.getProducts({ includeAllStatuses: false });
        setAllProducts(prods);
      } catch (err) {
        console.error('Failed to load store catalogue:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoreCatalogue();
  }, []);

  // Sync state from searchParams on back/forward navigation
  useEffect(() => {
    if (typeParam === 'digital' || typeParam === 'digital-products' || typeParam === 'software') {
      setActiveCategoryType('DIGITAL_PRODUCT');
    } else if (typeParam === 'social' || platformParam) {
      setActiveCategoryType('SOCIAL_SERVICE');
      if (platformParam) {
        setSelectedSocialPlatform(platformParam);
      }
    }
  }, [typeParam, platformParam]);

  // Handle Primary Tab Switching (Social Media Services vs Digital Products)
  const handleSwitchCategoryType = (type: CatalogCategoryType) => {
    setActiveCategoryType(type);
    setSearchQuery('');
    const newParams = new URLSearchParams(searchParams);

    if (type === 'DIGITAL_PRODUCT') {
      newParams.set('type', 'digital');
      newParams.delete('platform');
    } else {
      newParams.set('type', 'social');
      if (selectedSocialPlatform !== 'all') {
        newParams.set('platform', selectedSocialPlatform);
      } else {
        newParams.delete('platform');
      }
    }
    setSearchParams(newParams);
  };

  // Handle Social Platform Sub-Filter
  const handleSelectSocialPlatform = (platId: string) => {
    setSelectedSocialPlatform(platId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', 'social');
    if (platId === 'all') {
      newParams.delete('platform');
    } else {
      newParams.set('platform', platId);
    }
    setSearchParams(newParams);
  };

  // STRICT SEPARATION: Separate master lists
  const socialServicesList = useMemo(
    () => allProducts.filter(isSocialService),
    [allProducts]
  );

  const digitalProductsList = useMemo(
    () => allProducts.filter(isDigitalProduct),
    [allProducts]
  );

  // Filter products based on active category type
  const displayedProducts = useMemo(() => {
    let list = activeCategoryType === 'SOCIAL_SERVICE' ? socialServicesList : digitalProductsList;

    // Platform filtering only applies when viewing Social Media Services
    if (activeCategoryType === 'SOCIAL_SERVICE' && selectedSocialPlatform !== 'all') {
      const target = selectedSocialPlatform.toLowerCase().replace(/^cat-/, '');
      list = list.filter((p) => {
        const plat = (p.platform || '').toLowerCase();
        const cat = (p.category_id || '').toLowerCase().replace(/^cat-/, '');
        const catName = (p.category_name || '').toLowerCase();
        const slug = (p.slug || '').toLowerCase();

        return (
          plat === target ||
          (target === 'twitter' && (plat === 'x' || plat === 'twitter')) ||
          (target === 'x' && (plat === 'x' || plat === 'twitter')) ||
          cat === target ||
          catName.includes(target) ||
          slug.startsWith(target) ||
          slug.includes(target)
        );
      });
    }

    // Search query within active category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.short_description.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.platform && p.platform.toLowerCase().includes(q)) ||
          (p.service_type && p.service_type.toLowerCase().includes(q))
      );
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price_paise - b.price_paise;
      if (sortBy === 'price_desc') return b.price_paise - a.price_paise;
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });
  }, [
    activeCategoryType,
    socialServicesList,
    digitalProductsList,
    selectedSocialPlatform,
    searchQuery,
    sortBy,
  ]);

  return (
    <div className="min-h-screen">
      <SEO
        title={
          activeCategoryType === 'SOCIAL_SERVICE'
            ? 'Social Media Growth Services | VyapaarPro'
            : 'Digital Products & Software Templates | VyapaarPro'
        }
        description="High-retention social media growth packages and production-grade developer software kits with instant automated processing."
      />

      {/* 1. HERO HEADER SECTION */}
      <section className="relative overflow-hidden pt-12 pb-14 lg:pt-20 lg:pb-20 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950 border-b border-slate-900">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-gradient-to-tr from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Header Category Tag */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {activeCategoryType === 'SOCIAL_SERVICE'
                  ? 'Social Media Marketing & Growth Packages'
                  : 'Digital Products, Code & SaaS Templates'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
              VyapaarPro{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-sky-400">
                {activeCategoryType === 'SOCIAL_SERVICE' ? 'Social Services' : 'Digital Store'}
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-lg text-slate-300 leading-relaxed font-normal">
              {activeCategoryType === 'SOCIAL_SERVICE'
                ? 'Accelerate your social presence across Instagram, YouTube, Facebook, X, Telegram, and TikTok with high-retention, safe delivery.'
                : 'Accelerate your development with production-ready full-stack boilerplates, SaaS starter kits, and developer tools.'}
            </p>

            {/* Value Props Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-300">
                  {activeCategoryType === 'SOCIAL_SERVICE' ? 'Instant Order Pacing' : 'Instant File Delivery'}
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300">
                  {activeCategoryType === 'SOCIAL_SERVICE' ? '100% Non-Drop & Safe' : 'Verified Commercial License'}
                </span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Download className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-300">Direct Tracking & Receipts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRIMARY CATEGORY TABS (MANDATORY SEPARATION) */}
      <section className="bg-slate-950 border-b border-slate-900 sticky top-16 sm:top-20 z-30 backdrop-blur-xl bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-3 py-3 overflow-x-auto scrollbar-none">
            {/* Category 1 Tab: Social Media Services */}
            <button
              onClick={() => handleSwitchCategoryType('SOCIAL_SERVICE')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap shadow-sm ${
                activeCategoryType === 'SOCIAL_SERVICE'
                  ? 'bg-gradient-to-r from-pink-600 via-indigo-600 to-violet-600 text-white shadow-indigo-600/30'
                  : 'bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Social Media Services</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeCategoryType === 'SOCIAL_SERVICE' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {socialServicesList.length}
              </span>
            </button>

            {/* Category 2 Tab: Digital Products */}
            <button
              onClick={() => handleSwitchCategoryType('DIGITAL_PRODUCT')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center space-x-2 cursor-pointer whitespace-nowrap shadow-sm ${
                activeCategoryType === 'DIGITAL_PRODUCT'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-purple-600/30'
                  : 'bg-slate-900/80 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Digital Products & Code</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                activeCategoryType === 'DIGITAL_PRODUCT' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {digitalProductsList.length}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. CATALOGUE CONTROLS & PRODUCT GRID */}
      <section className="py-10 lg:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search & Sort Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeCategoryType === 'SOCIAL_SERVICE'
                  ? 'Search social services (e.g. Instagram Followers, YouTube Views)...'
                  : 'Search digital products (e.g. Next.js SaaS Starter, Templates)...'
              }
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

        {/* Sub-Platform Filter Pills (Displayed strictly for Social Media Services) */}
        {activeCategoryType === 'SOCIAL_SERVICE' && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            {SOCIAL_PLATFORMS.map((plat) => {
              const isSelected = selectedSocialPlatform === plat.id;
              const count =
                plat.id === 'all'
                  ? socialServicesList.length
                  : socialServicesList.filter((p) => (p.platform || '').toLowerCase() === plat.id).length;

              return (
                <button
                  key={plat.id}
                  onClick={() => handleSelectSocialPlatform(plat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{plat.name}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Digital Products Filter Pill Header (Displayed strictly for Digital Products) */}
        {activeCategoryType === 'DIGITAL_PRODUCT' && (
          <div className="flex items-center space-x-2 pb-4 mb-8">
            <span className="px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 text-white shadow-md shadow-violet-600/20 flex items-center space-x-1.5">
              <Code className="w-3.5 h-3.5" />
              <span>Full-Stack Templates & SaaS Boilerplates ({digitalProductsList.length})</span>
            </span>
          </div>
        )}

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
        ) : displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProducts.map((product) => (
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
            <h3 className="text-lg font-bold text-white">No Items Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No items matched your search "${searchQuery}" in ${
                    activeCategoryType === 'SOCIAL_SERVICE' ? 'Social Media Services' : 'Digital Products'
                  }.`
                : activeCategoryType === 'SOCIAL_SERVICE'
                ? 'No services available for the selected platform yet.'
                : 'No digital products available in this category yet.'}
            </p>
            {(searchQuery || (activeCategoryType === 'SOCIAL_SERVICE' && selectedSocialPlatform !== 'all')) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSocialPlatform('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Clear Filters
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
