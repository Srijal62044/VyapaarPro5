import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { dataService } from '../../services/store';
import { PortfolioItem } from '../../types';
import { SEO } from '../../components/common/SEO';

export const PortfolioPage: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      setIsLoading(true);
      try {
        const data = await dataService.getPortfolio(true);
        setItems(data);
      } catch (err) {
        console.error('Failed to load portfolio items:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <div className="py-12 lg:py-20">
      <SEO
        title="Portfolio & Client Case Studies | VyapaarPro Agency"
        description="Explore custom web applications, e-commerce stores, business websites, and digital solutions deployed by VyapaarPro."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Proven Engineering Case Studies</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Our Work & Client Deployments
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Every project represents bespoke business logic, clean responsive user interfaces, and independently deployed production code.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer capitalize ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'all' ? 'All Case Studies' : cat}
            </button>
          ))}
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition duration-300 flex flex-col"
            >
              <div className="relative h-64 w-full overflow-hidden bg-slate-950">
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 text-white backdrop-blur-md border border-slate-800">
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                    {item.client_type}
                  </span>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition mt-1">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 font-mono"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <Link
                    to={`/portfolio/${item.slug}`}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <span>View Project Architecture</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  {item.demo_url && (
                    <a
                      href={item.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                    >
                      <span>Live Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
