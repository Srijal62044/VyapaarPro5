import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  Globe,
  Smartphone,
  Palette,
  Wrench,
  Search,
  Server,
  Shield,
  CreditCard,
  MapPin,
  Briefcase,
  ExternalLink,
  Code2,
  Terminal,
  Cpu,
  User,
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useSettings } from '../../contexts/SettingsContext';

export const AboutPage: React.FC = () => {
  const { settings } = useSettings();
  const dev = settings.developer;

  const coreCapabilities = [
    { title: 'Business Websites', desc: 'Corporate websites, brand hubs, and company portals tailored to convert leads.' },
    { title: 'Portfolio Websites', desc: 'Sleek, high-impact portfolios for creators, consultants, and professionals.' },
    { title: 'E-Commerce Websites', desc: 'Custom digital storefronts with catalog, cart flows, and ordering systems.' },
    { title: 'High-Converting Landing Pages', desc: 'Targeted single-page funnels engineered for marketing campaigns.' },
    { title: 'Booking & Appointment Websites', desc: 'Scheduling and appointment workflows for service providers.' },
    { title: 'Custom Web Applications', desc: 'Full-stack software MVPs, dashboards, client portals, and bespoke tools.' },
    { title: 'Android Applications', desc: 'Snappy native-feel Android apps for utility, business, or client engagement.' },
    { title: 'Progressive Web Apps (PWAs)', desc: 'Installable, fast-loading web applications with offline capabilities.' },
    { title: 'UI/UX Interface Design', desc: 'Clean wireframes, design systems, and responsive Figma prototypes.' },
    { title: 'Logo & Brand Identity', desc: 'Vector logos, color palettes, typography guidelines, and brand kits.' },
    { title: 'Social Media Creatives', desc: 'Professional visual assets and banners for digital marketing channels.' },
    { title: 'Digital Catalogues & QR Menus', desc: 'Interactive menus and product brochures for restaurants and retail.' },
    { title: 'SEO & Search Presence Setup', desc: 'On-page optimization, Google Search Console, and business profiles.' },
    { title: 'Domain & Cloud Hosting Setup', desc: 'Domain configuration, SSL certificates, DNS, and server deployment.' },
    { title: 'Business Email Setup', desc: 'Custom domain email setups with Google Workspace or business mail.' },
    { title: 'API & 3rd-Party Integrations', desc: 'Connecting WhatsApp Business, SMS gateways, CRMs, and webhooks.' },
    { title: 'Website Maintenance', desc: 'Security updates, performance monitoring, backups, and content changes.' },
    { title: 'App & Website Bug Fixing', desc: 'Resolving frontend layout issues, backend errors, and database bugs.' },
    { title: 'Custom Digital Solutions', desc: 'Tailored automation scripts, internal tooling, and unique software ideas.' },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Explore Services',
      description: 'Browse our catalog of digital engineering, design, and web development capabilities.',
    },
    {
      step: '02',
      title: 'Submit Requirements',
      description: 'Share your project brief, preferred features, timeline goals, and reference ideas.',
    },
    {
      step: '03',
      title: 'Discuss Requirements',
      description: 'We connect directly with you (via WhatsApp, email, or call) to clarify scope and technical architecture.',
    },
    {
      step: '04',
      title: 'Finalize Scope & Pricing',
      description: 'We agree on precise deliverables, milestones, turnaround timeline, and mutual payment terms.',
    },
    {
      step: '05',
      title: 'Project Development Begins',
      description: 'Active design and engineering starts with milestone tracking and progress updates.',
    },
    {
      step: '06',
      title: 'Review & Revisions',
      description: 'You review staging previews, test functionality, and request structured adjustments.',
    },
    {
      step: '07',
      title: 'Final Delivery & Handover',
      description: 'Production deployment to your server/domain with complete source code handover.',
    },
  ];

  return (
    <div className="py-12 lg:py-20 text-slate-200">
      <SEO
        title="About VyapaarPro | Digital Services & Solutions"
        description="Learn about VyapaarPro, a dedicated digital services platform providing custom websites, applications, branding, and technical solutions for businesses and creators."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 lg:space-y-24">
        {/* Hero Section */}
        <section className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Solutions & Engineering</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            About VyapaarPro
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            VyapaarPro is a digital services platform and independent engineering studio providing practical, reliable, and accessible digital solutions for individuals, creators, startups, shops, businesses, and organizations.
          </p>
        </section>

        {/* What is VyapaarPro? */}
        <section className="p-6 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">What is VyapaarPro?</h2>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            VyapaarPro is a client-focused digital agency platform where customers can explore a diverse range of digital services, submit their custom project requirements, discuss technical needs directly with a developer, and receive tailored digital solutions built to modern standards.
          </p>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Rather than forcing one-size-fits-all templates or opaque marketplace markups, VyapaarPro emphasizes clear technical communication, milestone-based execution, clean codebases, and independent deployments where the client retains full ownership of their software and digital assets.
          </p>
        </section>

        {/* Services We Provide */}
        <section className="space-y-6">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Comprehensive Digital Capabilities
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              We design, build, and deploy modern digital products across the web, mobile, and design spectrum.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {coreCapabilities.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center space-x-2 text-indigo-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-6">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Scope and Availability Notice */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200 leading-relaxed">
            <strong>Service Scope & Availability Notice:</strong> Every business requirement is unique. Mention of any service does not imply that every feature is automatically available without prior consultation. Project availability, technical scope, delivery timelines, and pricing vary according to the specific requirements finalized for each project.
          </div>
        </section>

        {/* How We Work */}
        <section className="space-y-6">
          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How We Work
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              A transparent, step-by-step engagement process from initial concept to live deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md inline-block">
                    Step {step.step}
                  </span>
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Transparent Payment Model */}
        <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Transparent & Manual Payment Arrangements
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            VyapaarPro currently does <strong>not</strong> process online credit card checkouts, payment gateway fees, or automated transactions directly through this website.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            All commercial payment arrangements, milestone schedules, and invoicing details are discussed, mutually agreed upon, and finalized manually between VyapaarPro and the client through standard direct channels (such as official bank transfer, UPI, or corporate invoice). This protects clients from recurring subscription lock-ins and hidden platform charges.
          </p>
        </section>

        {/* ABOUT THE DEVELOPER SECTION */}
        <section id="developer" className="p-6 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800 space-y-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center space-x-4 sm:space-x-5">
              {dev?.avatar_url ? (
                <img
                  src={dev.avatar_url}
                  alt={dev.name || 'Developer Avatar'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-700 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg shadow-indigo-600/20 shrink-0">
                  {dev?.name ? dev.name.split(' ').map((n) => n[0]).join('').substring(0, 2) : 'SK'}
                </div>
              )}
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>About the Developer</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {dev?.name || 'SRIJAL KUMAR'}
                </h2>
                <p className="text-xs sm:text-sm text-indigo-300 font-medium mt-0.5">
                  {dev?.role || 'Founder & Developer, VyapaarPro'}
                </p>
              </div>
            </div>

            {/* Location Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span className="font-semibold">{dev?.location || 'BIHAR, INDIA'}</span>
            </div>
          </div>

          {/* Bio & Intro */}
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p>
              {dev?.bio ||
                'Founder and software developer behind VyapaarPro. Dedicated to building practical, accessible, and high-performance digital solutions for clients ranging from creators and local shops to growing startups and businesses. Focused on direct collaboration, clean architecture, and transparent milestone delivery.'}
            </p>
            <p className="text-slate-400 text-xs">
              VyapaarPro was started with a clear mission: to make modern digital engineering straightforward, dependable, and free from corporate overhead. Whether you need a crisp landing page, an e-commerce platform, or a custom full-stack web application, the goal is always delivering robust software tailored to your real-world operations.
            </p>
          </div>

          {/* Developer Focus Areas */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Primary Technical Focus
            </h3>
            <div className="flex flex-wrap gap-2">
              {(dev?.focus || [
                'Web Development',
                'Android / App Development',
                'UI/UX Design',
                'Digital Products',
                'Custom Software Solutions',
              ]).map((focusItem, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 flex items-center space-x-1.5"
                >
                  <Cpu className="w-3 h-3 text-indigo-400" />
                  <span>{focusItem}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Optional Configured Developer Links (Only shown if configured) */}
          {(dev?.github || dev?.linkedin || dev?.instagram || dev?.twitter) && (
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-400 font-medium">Developer Profiles:</span>
              {dev?.github && (
                <a
                  href={dev.github}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition flex items-center space-x-1"
                >
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {dev?.linkedin && (
                <a
                  href={dev.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition flex items-center space-x-1"
                >
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {dev?.instagram && (
                <a
                  href={dev.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition flex items-center space-x-1"
                >
                  <span>Instagram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {dev?.twitter && (
                <a
                  href={dev.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 transition flex items-center space-x-1"
                >
                  <span>Twitter / X</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </section>

        {/* CTA Footer Section */}
        <section className="text-center py-8 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Have a Project in Mind?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Get in touch to discuss your ideas, request technical advice, or receive a project estimate.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/contact"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
            >
              <span>Contact VyapaarPro</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/services"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition"
            >
              <span>Explore All Services</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};
