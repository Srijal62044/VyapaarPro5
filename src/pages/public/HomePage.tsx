import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Code2,
  Smartphone,
  Zap,
  CheckCircle2,
  Users,
  Layers,
  ChevronRight,
  Star,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { ServiceCategory, ServiceItem, PortfolioItem } from '../../types';
import { ServiceCard } from '../../components/common/ServiceCard';
import { SEO } from '../../components/common/SEO';
import { useSettings } from '../../contexts/SettingsContext';

interface OutletContextType {
  onOpenGetStarted: (service?: ServiceItem) => void;
}

export const HomePage: React.FC = () => {
  const { onOpenGetStarted } = useOutletContext<OutletContextType>();
  const { settings } = useSettings();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [featuredServices, setFeaturedServices] = useState<ServiceItem[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, servs, ports] = await Promise.all([
          dataService.getCategories(),
          dataService.getServices(true),
          dataService.getPortfolio(true),
        ]);
        setCategories(cats);
        setFeaturedServices(servs);
        setPortfolioItems(ports);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const displayedServices =
    activeCategory === 'all'
      ? featuredServices.slice(0, 6)
      : featuredServices.filter((s) => s.category_id === activeCategory).slice(0, 6);

  const processSteps = [
    {
      num: '01',
      title: 'Discover',
      desc: 'Submit your requirement or reach us on WhatsApp. We explore your market, brand identity, and key business goals.',
    },
    {
      num: '02',
      title: 'Discuss',
      desc: 'Transparent scope consultation. We finalize technical specifications, deliverables, and milestone-based pricing directly with you.',
    },
    {
      num: '03',
      title: 'Design',
      desc: 'Modern wireframes and pixel-perfect UI prototypes. Every screen is tailored to your business aesthetics and customer journey.',
    },
    {
      num: '04',
      title: 'Develop',
      desc: 'Production-ready code engineered with React, TypeScript, Next.js, and PostgreSQL. Fast, mobile-first, and SEO-optimized.',
    },
    {
      num: '05',
      title: 'Deliver',
      desc: 'Rigorous testing followed by live deployment on your chosen cloud/domain. You receive 100% full source code ownership.',
    },
  ];

  return (
    <div>
      <SEO
        title="VyapaarPro | Digital Services Agency for Modern Businesses"
        description="We engineer high-performance business websites, custom web applications, e-commerce stores, Android/PWAs, and digital solutions."
      />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-violet-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Pill Header */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full-Stack Digital Agency & Engineering Team</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
              Transforming Business Ideas Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-sky-400">
                High-Impact Digital Reality
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              VyapaarPro provides bespoke business websites, custom web applications, mobile apps, UI/UX, and growth engineering. Transparent direct consulting with zero checkout friction.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenGetStarted()}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>Get Started</span>
              </button>
              <Link
                to="/services"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-base transition flex items-center justify-center space-x-2"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">100% Client Code Ownership</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Ultra-Fast Performance</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <Code2 className="w-5 h-5 text-sky-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Modern Tech Stack</span>
              </div>
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-slate-300 font-medium">Direct Engineering Consult</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES PREVIEW */}
      <section className="py-16 lg:py-24 bg-slate-950/60 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                Our Digital Capabilities
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Comprehensive Digital Services
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-xl">
                Expandable digital engineering catalogue. Select any service to explore detailed deliverables, timelines, or request an instant quotation.
              </p>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              <span>View All Services ({featuredServices.length})</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onGetStarted={(s) => onOpenGetStarted(s)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. WHY VYAPAARPRO */}
      <section className="py-16 lg:py-24 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">
              The Agency Advantage
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why Businesses Rely on VyapaarPro
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              We eliminate template bloat and payment gateway lock-in. Every digital asset is built to your specifications, engineered for performance, and delivered cleanly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Bespoke Production Design</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No generic template clones. We tailor visual identity, typography tokens, and responsive interactions to convey undeniable credibility in your specific niche.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Transparent Offline Invoicing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Zero arbitrary platform fees or gateway cuts. You speak directly with our engineers, agree upon scope, and settle milestone invoices through your existing bank workflow.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-indigo-500/40 transition">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-5">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Independent Deployment</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your final website or web app is not locked inside our platform. We deploy your software on your own independent server or cloud domain with full access keys handed over.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORK / PORTFOLIO SHOWCASE */}
      <section className="py-16 lg:py-24 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                Proven Track Record
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
                Featured Client Deployments
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-xl">
                Real digital solutions deployed for commercial enterprises, healthcare portals, e-commerce brands, and hospitality groups.
              </p>
            </div>
            <Link
              to="/portfolio"
              className="inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              <span>Explore All Case Studies</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {portfolioItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="group bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition duration-300 flex flex-col"
              >
                <div className="relative h-60 w-full overflow-hidden bg-slate-950">
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
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {item.technologies.slice(0, 4).map((tech, i) => (
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
                      <span>Read Case Study</span>
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
      </section>

      {/* 5. PROCESS SECTION */}
      <section className="py-16 lg:py-24 border-t border-slate-900 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">
              Structured Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              How We Work With You
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Clear expectations, constant progress visibility, and milestone milestones. No surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 lg:gap-6 relative">
            {processSteps.map((step, idx) => (
              <div
                key={step.num}
                className="relative bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-500/40 transition"
              >
                <div>
                  <div className="text-2xl font-black text-indigo-400/50 mb-3 font-mono">
                    {step.num}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
                {idx < processSteps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-slate-600 z-10">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-16 lg:py-24 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">
              Client Feedback
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Trusted by Ambitious Founders
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "VyapaarPro engineered our B2B freight web portal and quote calculator. Within 60 days, qualified corporate leads surged by 180%. Having zero checkout clutter and speaking directly with the lead engineer made all the difference."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                  RS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Rohit Sharma</h4>
                  <p className="text-[11px] text-slate-400">Managing Director, Apex Logistics</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "Our ethnic wear store had 400+ SKUs and needed high-res swatch previews with WhatsApp order confirmations. VyapaarPro delivered ahead of schedule and the store loads blazingly fast even on slow 4G."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-xs">
                  AI
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ananya Iyer</h4>
                  <p className="text-[11px] text-slate-400">Founder, Kaveri Handlooms</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex text-amber-400 space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "Their team architected our clinic queue token SaaS for 14 diagnostic centers. Clean PostgreSQL database, rock-solid stability, and we received full source code access upon completion."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-xs">
                  VS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dr. Vikram Seth</h4>
                  <p className="text-[11px] text-slate-400">Medical Director, PulseHealth</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="py-20 lg:py-28 relative overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 border-t border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Have a Digital Idea? Let's Build It.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl mx-auto">
            Get in touch directly with our engineering team. We'll analyze your requirements, review technical scope, and map out a structured milestone delivery.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenGetStarted()}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-indigo-600/25 transition cursor-pointer"
            >
              Start Project Inquiry
            </button>
            <a
              href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 font-semibold text-base transition flex items-center justify-center space-x-2"
            >
              <MessageSquare className="w-5 h-5" />
              <span>WhatsApp Us: {settings.phone}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
