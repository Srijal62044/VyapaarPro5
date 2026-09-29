import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Search, Filter, Sparkles, SlidersHorizontal, ArrowUpDown, Share2, ArrowRight } from 'lucide-react';
import { dataService } from '../../services/store';
import { ServiceCategory, ServiceItem } from '../../types';
import { ServiceCard } from '../../components/common/ServiceCard';
import { SEO } from '../../components/common/SEO';

interface OutletContextType {
  onOpenGetStarted: (service?: ServiceItem) => void;
}

export const ServicesPage: React.FC = () => {
  const { onOpenGetStarted } = useOutletContext<OutletContextType>();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      setIsLoading(true);
      try {
        const [cats, srvs] = await Promise.all([
          dataService.getCategories(),
          dataService.getServices(true), // Only published
        ]);
        setCategories(cats);
        setServices(srvs);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, []);

  // Filter and sort
  const filteredServices = services
    .filter((s) => {
      if (selectedCategory !== 'all' && s.category_id !== selectedCategory) return false;
      if (onlyFeatured && !s.featured) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.short_description.toLowerCase().includes(q) ||
          (s.category_name && s.category_name.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      }
      if (sortBy === 'price-asc') {
        return a.price - b.price;
      }
      if (sortBy === 'price-desc') {
        return b.price - a.price;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div className="py-12 lg:py-20">
      <SEO
        title="Digital Services Catalogue | Websites, Apps, Branding & Solutions"
        description="Browse all digital services engineered by VyapaarPro. High-converting business websites, custom web apps, mobile solutions, and branding."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Engineering Catalogue</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Explore Digital Services
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Select an engineering service for websites, custom web apps, and mobile solutions, or switch to our Social Media Growth Store for instant automated followers, views, and likes.
          </p>
        </div>

        {/* Social Media Store Cross-Navigation Card */}
        <div className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-slate-900 border border-violet-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <span>Looking for Social Media Growth Services?</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                  Instant Processing
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Instagram followers/likes, YouTube subscribers/views, Telegram members, and 10+ platforms with dynamic ordering fields.
              </p>
            </div>
          </div>
          <Link
            to="/store"
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition shrink-0"
          >
            <span>Open Social Media Store</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services, technologies, or keywords..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Filter pills & sort */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Featured toggle */}
              <button
                onClick={() => setOnlyFeatured(!onlyFeatured)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center space-x-1.5 ${
                  onlyFeatured
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>⭐ Popular Only</span>
              </button>

              {/* Sort By Dropdown */}
              <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-300 text-xs py-1.5 pr-2 focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-slate-900">Sort: Featured</option>
                  <option value="price-asc" className="bg-slate-900">Price: Low to High</option>
                  <option value="price-desc" className="bg-slate-900">Price: High to Low</option>
                  <option value="name" className="bg-slate-900">Name: A to Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              All Categories ({services.length})
            </button>
            {categories.map((cat) => {
              const count = services.filter((s) => s.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  {cat.name} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-6 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredServices.length}</strong> of{' '}
            {services.length} services
          </span>
          {(searchQuery || selectedCategory !== 'all' || onlyFeatured) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setOnlyFeatured(false);
              }}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Service Cards Grid */}
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onGetStarted={(s) => onOpenGetStarted(s)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No services match your criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Try adjusting your search query, clearing filters, or requesting a custom digital solution.
            </p>
            <button
              onClick={() => onOpenGetStarted()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Request Custom Solution
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
