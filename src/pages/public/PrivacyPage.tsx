import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Database, Mail, Server, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useSettings } from '../../contexts/SettingsContext';

export const PrivacyPage: React.FC = () => {
  const { settings } = useSettings();
  const legal = settings.legal;

  return (
    <div className="py-12 lg:py-20 text-slate-200">
      <SEO
        title="Privacy Policy | VyapaarPro"
        description="Understand how VyapaarPro collects, uses, and safeguards your inquiry information, project requirements, and account data."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Data Transparency & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>Effective Date: <strong className="text-slate-200">{legal?.effective_date || 'January 1, 2026'}</strong></span>
            <span>•</span>
            <span>Last Updated: <strong className="text-slate-200">{legal?.last_updated || 'September 2026'}</strong></span>
          </div>
        </div>

        {/* Legal Disclaimer / Notice Banner */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3 text-xs text-slate-400 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block mb-0.5">Policy Notice:</span>
            {legal?.legal_notice ||
              'This Privacy Policy outlines how VyapaarPro handles inquiry details, project communication, and authentication records. For specific enterprise non-disclosure agreements (NDAs) or custom confidentiality contracts, terms are agreed directly per project.'}
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* 1. Introduction */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">1.</span>
              <span>Introduction & Purpose</span>
            </h2>
            <p>
              VyapaarPro operates as an independent digital engineering and design platform. We respect the confidentiality of our clients, prospective customers, and visitors. This Privacy Policy describes what information is collected when you browse our website, submit service inquiries, create an account, or communicate with us regarding software projects.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">2.</span>
              <span>Information We Collect</span>
            </h2>
            <p>
              We only collect information that is voluntarily submitted by you or reasonably necessary to operate our digital platform:
            </p>
            <ul className="space-y-2.5 pl-2">
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Account & Profile Information:</strong> If you register an account, we collect your full name, email address, password hash, and optional company or contact information.
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Service Requests & Project Briefs:</strong> When you submit a project inquiry, we collect your service requirements, timeline preferences, budget guidelines, reference links, and attached specifications.
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Direct Messages & Communications:</strong> Records of messages, emails, or WhatsApp correspondence exchanged regarding project milestones, feedback, and technical specifications.
                </span>
              </li>
              <li className="flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Technical Logs & Analytics:</strong> Standard server logs, IP addresses, browser types, and timestamp data necessary for basic security monitoring, error diagnostics, and system performance.
                </span>
              </li>
            </ul>
          </section>

          {/* 3. How We Use Information */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">3.</span>
              <span>How Information is Used</span>
            </h2>
            <p>Your information is used exclusively for practical operational purposes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Project & Quote Evaluation</span>
                <p className="text-slate-400">Reviewing your technical requirements to prepare realistic project timelines and cost estimates.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Client Portal & Milestone Updates</span>
                <p className="text-slate-400">Authenticating access to your private project dashboard and milestone progress reports.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Direct Communication</span>
                <p className="text-slate-400">Contacting you via email, phone, or WhatsApp to clarify requirements and deliver milestone updates.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">Platform Security & Audit Logs</span>
                <p className="text-slate-400">Preventing spam, unauthorized login attempts, and securing client database records.</p>
              </div>
            </div>
          </section>

          {/* 4. Payment Information Notice */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">4.</span>
              <span>No Online Payment Processing on This Website</span>
            </h2>
            <p>
              VyapaarPro does <strong>not</strong> collect credit card details, debit card numbers, CVVs, net banking credentials, or UPI PINs on this website. All financial transactions and milestone invoices are settled directly outside the platform via standard manual arrangements (e.g. corporate bank transfer or direct invoice). We do not store sensitive payment card information.
            </p>
          </section>

          {/* 5. Infrastructure, Third Parties & Storage */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">5.</span>
              <span>Infrastructure, Third-Party Providers & Storage</span>
            </h2>
            <p>
              To maintain high platform reliability, VyapaarPro utilizes industry-standard infrastructure components:
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white flex items-center space-x-2">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Database & Authentication Services</span>
                </span>
                <p className="text-slate-400">
                  When connected to remote cloud services, authenticated user accounts and project requests are stored in PostgreSQL with Row Level Security (RLS) managed through Supabase infrastructure.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white flex items-center space-x-2">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Hosting & Content Delivery</span>
                </span>
                <p className="text-slate-400">
                  Our web application is deployed via secure cloud environments with HTTPS encryption enforced across all traffic.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white flex items-center space-x-2">
                  <Lock className="w-3.5 h-3.5 text-violet-400" />
                  <span>Browser Local Storage & Cookies</span>
                </span>
                <p className="text-slate-400">
                  We use browser local storage solely for session persistence, temporary form states, and interface preferences. We do not use third-party advertising cookies or cross-site tracking trackers.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Data Security & Retention */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">6.</span>
              <span>Data Security & Reasonable Protection</span>
            </h2>
            <p>
              We implement reasonable technical and organizational safeguards designed to protect personal information against unauthorized access, loss, misuse, or alteration. These measures include encrypted database connections, access-control policies, and isolated client queries.
            </p>
            <p className="text-slate-400 text-xs">
              While we make diligent efforts to secure data, no digital storage or transmission over the Internet can be guaranteed as 100% impenetrable. We encourage clients to use strong, unique passwords for account access.
            </p>
          </section>

          {/* 7. Client Data Ownership & Sharing */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">7.</span>
              <span>Data Sharing & Non-Sale of Information</span>
            </h2>
            <p>
              VyapaarPro does <strong>not</strong> sell, rent, monetize, or trade client information, contact details, or project codebases to third-party data brokers or marketing firms. Information is shared only when strictly necessary to fulfill the project (e.g. configuring a client's designated third-party domain registrar or cloud host with their express authorization) or if mandated by lawful legal process.
            </p>
          </section>

          {/* 8. User Rights & Choices */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">8.</span>
              <span>User Rights & Inquiries</span>
            </h2>
            <p>
              You may contact us at any time to review, update, or request the deletion of your contact inquiry records or client profile data. Inquiries will be reviewed and addressed within a reasonable timeframe.
            </p>
          </section>

          {/* 9. Policy Changes & Contact */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">9.</span>
              <span>Policy Updates & Contact Information</span>
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect modifications in our services, technical infrastructure, or legal obligations. The latest version and its updated date will always be published on this page.
            </p>
            <div className="pt-2 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-white block">Official Contact Details:</span>
              <p>Agency: <strong>{settings.name || 'VyapaarPro'}</strong></p>
              <p>Official Email: <strong>{settings.email || 'kumarsrijal732@gmail.com'}</strong></p>
              <p>Direct Support: <strong>{settings.phone || '+91 98765 43210'}</strong></p>
              <p>Address: <strong>{settings.address || 'Indiranagar 100ft Road, Bangalore, Karnataka 560038'}</strong></p>
              <p className="pt-1 text-slate-400">
                You can also submit an inquiry directly via our <Link to="/contact" className="text-indigo-400 underline hover:text-indigo-300">Contact Page</Link>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
