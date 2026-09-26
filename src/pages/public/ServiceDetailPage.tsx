import React, { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Clock,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  ArrowLeft,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Server,
  Layers,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { ServiceItem } from '../../types';
import { SEO } from '../../components/common/SEO';
import { useSettings } from '../../contexts/SettingsContext';

interface OutletContextType {
  onOpenGetStarted: (service?: ServiceItem) => void;
}

export const ServiceDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { onOpenGetStarted } = useOutletContext<OutletContextType>();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [service, setService] = useState<ServiceItem | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadService() {
      if (!slug) return;
      setIsLoading(true);
      try {
        const found = await dataService.getServiceBySlug(slug);
        setService(found);
      } catch (err) {
        console.error('Error loading service:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadService();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading service specifications...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-24 max-w-lg mx-auto text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Service Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">
          The requested service specification may have been archived or updated.
        </p>
        <Link
          to="/services"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Browse All Services</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 lg:py-16">
      <SEO
        title={`${service.name} | Deliverables, Timeline & Pricing`}
        description={service.short_description}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-6">
          <Link to="/" className="hover:text-slate-200">
            Home
          </Link>
          <span>/</span>
          <Link to="/services" className="hover:text-slate-200">
            Services
          </Link>
          <span>/</span>
          <span className="text-indigo-400 truncate">{service.name}</span>
        </div>

        {/* Main Grid: Left Details & Right Scope/Action Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Info (2 cols) */}
          <div className="lg:col-span-2 space-y-10">
            {/* Header */}
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
                {service.category_name || 'Digital Engineering'}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                {service.name}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                {service.description}
              </p>
            </div>

            {/* Banner: Independent Deployment Notice */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-start space-x-3 text-xs text-slate-300">
              <Server className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">Independent Production Deployment</span>
                Your finished application will be deployed independently on your own dedicated server, cloud, or domain. VyapaarPro does not host your final website inside our platform. You own 100% of the code and assets.
              </div>
            </div>

            {/* Featured Image */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[420px]">
              <img
                src={service.thumbnail_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Key Features Section */}
            {service.features && service.features.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Technical Specifications & Features</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.features.map((feat) => (
                    <div
                      key={feat.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800/80"
                    >
                      <h3 className="text-sm font-bold text-white mb-1">{feat.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deliverables Checklist */}
            {service.deliverables && service.deliverables.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>What You Will Receive (Deliverables)</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.deliverables.map((del, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-200 font-medium">{del}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs Accordion */}
            {service.faqs && service.faqs.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-5">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {service.faqs.map((faq, i) => (
                    <div
                      key={faq.id}
                      className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                        className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-slate-200 hover:text-white transition cursor-pointer"
                      >
                        <span>{faq.question}</span>
                        {openFaqIndex === i ? (
                          <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                        )}
                      </button>
                      {openFaqIndex === i && (
                        <div className="px-4 pb-4 pt-1 text-xs text-slate-400 border-t border-slate-800/60 leading-relaxed">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action & Pricing Sidebar Card (1 col) */}
          <div className="space-y-6">
            <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Pricing Display */}
              <div className="border-b border-slate-800 pb-5">
                {service.pricing_model === 'CUSTOM_QUOTE' ? (
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 inline-block mb-2">
                      Custom Quote
                    </span>
                    <h3 className="text-2xl font-bold text-white">Price on Consultation</h3>
                    <p className="text-xs text-slate-400 mt-2">
                      Price available after requirements discussion. Tailored specifically for your enterprise scope.
                    </p>
                  </div>
                ) : service.pricing_model === 'FIXED' ? (
                  <div>
                    <span className="text-xs text-slate-400 block font-normal uppercase tracking-wider mb-1">
                      Fixed Package Price
                    </span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-white">
                        ₹{service.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-slate-400">INR</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      All core deliverables listed on this page included.
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs text-slate-400 block font-normal uppercase tracking-wider mb-1">
                      Starting Investment
                    </span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-extrabold text-white">
                        ₹{service.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-indigo-400 font-medium">+ Scope</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Starting price for standard scope. Custom modules may adjust final quote.
                    </p>
                  </div>
                )}
              </div>

              {/* Timeline & Metadata */}
              <div className="space-y-3 text-xs text-slate-300">
                {service.timeline && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      Estimated Timeline
                    </span>
                    <span className="font-semibold text-white">{service.timeline}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Payment Process</span>
                  <span className="font-semibold text-emerald-400">Milestone / Invoice</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Code Handover</span>
                  <span className="font-semibold text-white">100% Client Owned</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Post-Launch Support</span>
                  <span className="font-semibold text-white">Included (30 Days)</span>
                </div>
              </div>

              {/* Project Website Link if available */}
              {service.demo_url && (
                <a
                  href={service.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Visit Live Project</span>
                </a>
              )}

              {/* CTAs */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => onOpenGetStarted(service)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Get Started / Request Quote</span>
                </button>

                <a
                  href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello VyapaarPro, I am inquiring about "${service.name}". Let's discuss requirements.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold text-center transition flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Discuss via WhatsApp</span>
                </a>
              </div>

              {/* No Payment Gateway Note */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-indigo-400 inline mr-1 -mt-0.5" />
                No checkout or online card processing on this website. All project agreements and payments are processed via formal company invoices.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
