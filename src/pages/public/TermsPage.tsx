import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, AlertCircle, CheckCircle2, Scale, Terminal } from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useSettings } from '../../contexts/SettingsContext';

export const TermsPage: React.FC = () => {
  const { settings } = useSettings();
  const legal = settings.legal;

  return (
    <div className="py-12 lg:py-20 text-slate-200">
      <SEO
        title="Terms & Conditions | VyapaarPro"
        description="Review the terms of service, project scope guidelines, milestone agreements, and code ownership conditions of VyapaarPro."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Service Terms & Governance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Terms & Conditions
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
            <span className="font-semibold text-slate-200 block mb-0.5">Operational Terms Notice:</span>
            {legal?.legal_notice ||
              'These standard terms govern the discovery, quotation, development, milestone approval, and delivery processes for digital services provided by VyapaarPro.'}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* 1. Acceptance of Terms */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">1.</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p>
              By accessing the VyapaarPro website, submitting a project requirement, or contracting digital development services through VyapaarPro, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>

          {/* 2. Nature of Digital Services */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">2.</span>
              <span>Description & Nature of Services</span>
            </h2>
            <p>
              VyapaarPro is an independent digital agency and software engineering studio. We provide bespoke services including but not limited to business websites, e-commerce systems, custom web applications, mobile applications (Android/PWAs), UI/UX design, branding, and technical maintenance.
            </p>
            <p className="text-slate-400 text-xs">
              VyapaarPro is <strong>not</strong> an automated instant SaaS or marketplace. Every project involves custom engineering and direct client consultation.
            </p>
          </section>

          {/* 3. Service Inquiries, Scope & Quotations */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">3.</span>
              <span>Service Requests, Scope & Quotations</span>
            </h2>
            <p>
              Any pricing, timelines, or feature lists displayed on our website represent general guidelines and starting estimates. Final project scope, concrete deliverables, milestone schedules, and firm quotations are established and agreed upon in writing between the client and VyapaarPro during initial discussions.
            </p>
            <p className="text-slate-400 text-xs">
              Submitting a requirement inquiry on this website does not create a binding development agreement until both parties mutually agree on the project scope and terms.
            </p>
          </section>

          {/* 4. Manual Payment Arrangements */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">4.</span>
              <span>Payment Arrangements & Invoicing</span>
            </h2>
            <p>
              VyapaarPro currently does <strong>not</strong> process online credit card transactions or payment gateways through this website.
            </p>
            <p className="text-slate-400 text-xs">
              All financial settlements and milestone invoices are executed directly outside the website via official bank transfer, UPI, or corporate invoice as specified in the agreed project quotation. Milestone schedules dictate invoice releases.
            </p>
          </section>

          {/* 5. Development Timelines & Client Responsibilities */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">5.</span>
              <span>Development Timelines & Client Responsibilities</span>
            </h2>
            <p>
              Estimated completion dates are provided in good faith based on project scope. To ensure timely delivery, the client agrees to:
            </p>
            <ul className="space-y-2 pl-2 text-xs">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Provide necessary content, assets, logos, and access credentials promptly upon request.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Review milestone previews, staging URLs, and provide consolidated feedback within agreed timeframes.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Appoint a primary point of contact for technical feedback and project sign-offs.</span>
              </li>
            </ul>
          </section>

          {/* 6. Revisions & Scope Adjustments */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">6.</span>
              <span>Revisions & Scope Adjustments</span>
            </h2>
            <p>
              Each project includes designated revision rounds to fine-tune layout, styling, and functionality as defined in the project scope. Substantial feature additions or architectural modifications requested after scope finalization will be treated as separate scope extensions with their own timeline and cost adjustments.
            </p>
          </section>

          {/* 7. Third-Party Services & Hosting */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">7.</span>
              <span>Third-Party Services, Hosting & Domains</span>
            </h2>
            <p>
              Unless explicitly agreed as an ongoing managed hosting service, client websites and applications are deployed independently on servers, cloud platforms, or domains owned and controlled by the client (such as Vercel, Supabase, Cloudflare, AWS, or the client's preferred hosting provider).
            </p>
            <p className="text-slate-400 text-xs">
              The client is responsible for third-party hosting fees, domain renewal fees, or third-party API service subscriptions (e.g. SMS gateways or maps APIs). VyapaarPro is not liable for service outages caused by third-party hosting providers.
            </p>
          </section>

          {/* 8. Intellectual Property & Code Ownership */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">8.</span>
              <span>Intellectual Property & Code Ownership</span>
            </h2>
            <p>
              <strong>Client-Provided Materials:</strong> The client retains all rights, title, and ownership in all brand assets, logos, trademarks, and text content supplied to VyapaarPro. The client warrants that they hold the legal rights to use all provided assets.
            </p>
            <p>
              <strong>Deliverable Ownership:</strong> Upon full and final settlement of agreed project milestone invoices, full ownership of custom source code, design files, schemas, and deployed software deliverables transfers entirely to the client without recurring licensing fees.
            </p>
          </section>

          {/* 9. Prohibited Uses */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">9.</span>
              <span>Prohibited Uses</span>
            </h2>
            <p>
              VyapaarPro does not build, host, or support websites or applications designed for illegal activities, financial fraud, unauthorized gambling, distribution of malicious software, harassment, copyright infringement, or deceptive marketing schemes.
            </p>
          </section>

          {/* 10. Maintenance & Post-Launch Support */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">10.</span>
              <span>Maintenance & Support Warranty</span>
            </h2>
            <p>
              Projects typically include a complimentary post-launch support window (as specified in the project agreement, typically 14 to 30 days) covering bug fixes and minor adjustments resulting from original scope requirements. Extended technical maintenance, ongoing feature development, or system upgrades are available through separate support arrangements.
            </p>
          </section>

          {/* 11. Cancellation, Termination & Refunds */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">11.</span>
              <span>Cancellation & Refund Policy</span>
            </h2>
            <p>
              Either party may cancel a project engagement in writing subject to the mutually agreed project agreement. In the event of cancellation, payments for milestones already completed, approved, and delivered are non-refundable. Any advance funds for unstarted milestones will be handled in accordance with the mutually agreed project terms.
            </p>
          </section>

          {/* 12. Limitation of Liability */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">12.</span>
              <span>Limitation of Liability</span>
            </h2>
            <p>
              To the maximum extent permitted by applicable law, VyapaarPro and its developers shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profits, data, business interruption, or third-party service downtime arising from the use or inability to use the developed software.
            </p>
          </section>

          {/* 13. Governing Law & Jurisdiction */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">13.</span>
              <span>Governing Law & Jurisdiction</span>
            </h2>
            <p>
              These Terms and any project engagements shall be governed by and construed in accordance with the laws applicable in <strong className="text-white">{legal?.governing_jurisdiction || '[Jurisdiction of Bihar / India]'}</strong>, without regard to conflict of law principles. Any disputes arising shall be subject to the exclusive jurisdiction of the competent courts in that jurisdiction.
            </p>
          </section>

          {/* 14. Contact Information */}
          <section className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <span className="text-indigo-400 font-mono">14.</span>
              <span>Contact Inquiries</span>
            </h2>
            <p>
              For questions regarding these Terms & Conditions or project contracts, please contact us:
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <p>Agency: <strong>{settings.name || 'VyapaarPro'}</strong></p>
              <p>Email: <strong>{settings.email || 'kumarsrijal732@gmail.com'}</strong></p>
              <p>Phone: <strong>{settings.phone || '+91 98765 43210'}</strong></p>
              <p>Address: <strong>{settings.address || 'Indiranagar 100ft Road, Bangalore, Karnataka 560038'}</strong></p>
              <p className="pt-1 text-slate-400">
                You can reach us online through our <Link to="/contact" className="text-indigo-400 underline hover:text-indigo-300">Contact Page</Link>.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
