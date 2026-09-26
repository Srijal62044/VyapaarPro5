import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Star, Sparkles, Check } from 'lucide-react';
import { ServiceItem } from '../../types';

interface ServiceCardProps {
  service: ServiceItem;
  onGetStarted: (service: ServiceItem) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onGetStarted }) => {
  const formatPrice = () => {
    if (service.pricing_model === 'CUSTOM_QUOTE') {
      return (
        <div>
          <span className="text-base font-bold text-indigo-400">Custom Quote</span>
          <span className="block text-[11px] text-slate-400">Discussed after scope review</span>
        </div>
      );
    }
    if (service.pricing_model === 'FIXED') {
      return (
        <div>
          <span className="text-xs text-slate-400 block font-normal">Fixed Price</span>
          <span className="text-lg font-bold text-white">₹{service.price.toLocaleString('en-IN')}</span>
        </div>
      );
    }
    // STARTING_FROM
    return (
      <div>
        <span className="text-xs text-slate-400 block font-normal">Starting from</span>
        <span className="text-lg font-bold text-white">₹{service.price.toLocaleString('en-IN')}</span>
      </div>
    );
  };

  return (
    <div className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col h-full">
      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-950">
        <img
          src={service.thumbnail_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-950/80 text-indigo-300 border border-indigo-500/20 backdrop-blur-md">
            {service.category_name || 'Service'}
          </span>
        </div>

        {/* Featured Tag */}
        {service.featured && (
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center space-x-1">
              <Star className="w-3 h-3 fill-amber-400" />
              <span>Popular</span>
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
            {service.name}
          </h3>
          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {service.short_description}
          </p>

          {/* Key Deliverables teaser */}
          {service.deliverables && service.deliverables.length > 0 && (
            <div className="mt-3.5 space-y-1.5 border-t border-slate-800/80 pt-3">
              {service.deliverables.slice(0, 2).map((del, i) => (
                <div key={i} className="flex items-center text-xs text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
                  <span className="truncate">{del}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & Timeline bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-end justify-between">
          {formatPrice()}

          {service.timeline && (
            <div className="flex items-center text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>{service.timeline}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to={`/services/${service.slug}`}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-medium text-center transition flex items-center justify-center space-x-1"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <button
            onClick={() => onGetStarted(service)}
            className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium text-center transition shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Get Started</span>
          </button>
        </div>
      </div>
    </div>
  );
};
