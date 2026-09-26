import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, ArrowLeft, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { dataService } from '../../services/store';
import { PortfolioItem } from '../../types';
import { SEO } from '../../components/common/SEO';

export const PortfolioDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const found = await dataService.getPortfolioBySlug(slug);
        setItem(found);
        if (found) {
          setActiveImage(found.thumbnail_url);
        }
      } catch (err) {
        console.error('Error loading portfolio item:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadItem();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading case study...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-24 max-w-lg mx-auto text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Case Study Not Found</h2>
        <Link
          to="/portfolio"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Portfolio</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 lg:py-20">
      <SEO
        title={`${item.title} | Case Study`}
        description={item.description}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-6">
          <Link to="/" className="hover:text-slate-200">
            Home
          </Link>
          <span>/</span>
          <Link to="/portfolio" className="hover:text-slate-200">
            Portfolio
          </Link>
          <span>/</span>
          <span className="text-indigo-400 truncate">{item.title}</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
            {item.category} • {item.client_type}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {item.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            {item.description}
          </p>
        </div>

        {/* Hero Preview Image & Gallery */}
        <div className="space-y-4 mb-10">
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl max-h-[500px]">
            <img
              src={activeImage || item.thumbnail_url}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {item.images && item.images.length > 0 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveImage(item.thumbnail_url)}
                className={`w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                  activeImage === item.thumbnail_url ? 'border-indigo-500' : 'border-slate-800 opacity-60'
                }`}
              >
                <img src={item.thumbnail_url} alt="Main" className="w-full h-full object-cover" />
              </button>
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    activeImage === img ? 'border-indigo-500' : 'border-slate-800 opacity-60'
                  }`}
                >
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Technology Architecture & Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-slate-800">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white">System Architecture & Engineering Highlights</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Designed from ground up with scalability and speed in mind. Our team worked directly with the stakeholders to design relational database schemas, construct automated workflows, and build an accessible, responsive frontend.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Independently hosted on client cloud infrastructure</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero online checkout friction; optimized for business lead generation</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% full source code ownership handed over</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.technologies.map((t, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 text-indigo-300 text-xs font-mono border border-slate-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {item.demo_url && (
              <div className="pt-4 border-t border-slate-800">
                <a
                  href={item.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold text-center transition flex items-center justify-center space-x-2"
                >
                  <span>Visit Live Deployment</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
