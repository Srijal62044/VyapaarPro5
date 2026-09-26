import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { SEO } from '../../components/common/SEO';
import { useSettings } from '../../contexts/SettingsContext';

const SERVICE_OPTIONS = [
  'General Inquiry & Consultation',
  'Business Website',
  'E-Commerce Website',
  'Custom Web Application / MVP',
  'Android App & PWA',
  'UI/UX Design & Branding',
  'SEO & Digital Presence Setup',
  'Website Maintenance & Bug Fixing',
  'Custom Software Solution',
];

export const ContactPage: React.FC = () => {
  const { settings } = useSettings();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedService, setSelectedService] = useState('General Inquiry & Consultation');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage('Please fill in your name, email, subject, and project details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedSubject = selectedService && selectedService !== 'General Inquiry & Consultation'
        ? `[${selectedService}] ${subject.trim()}`
        : subject.trim();

      const created = await dataService.createContactMessage({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: formattedSubject,
        message: message.trim(),
      });
      setSubmittedCode(created.reference_code);
    } catch (err: any) {
      console.error('Contact form submission error:', err);
      setErrorMessage('Failed to send message. Please reach us directly via WhatsApp or email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 lg:py-20 text-slate-200">
      <SEO
        title="Contact VyapaarPro | Digital Consultation & Inquiry"
        description="Get in touch with VyapaarPro. Connect directly via WhatsApp, phone, email, or submit your project inquiry."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct Client Consultation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Connect With Our Team
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Have a project in mind or need technical guidance? Reach out directly via WhatsApp, phone, or fill out the project inquiry form below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {/* Left Column: Direct channels */}
          <div className="space-y-6">
            {/* WhatsApp Card */}
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Instant WhatsApp Consultation</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Fastest way to share your initial requirements, wireframes, or questions with our lead engineer.
                </p>
              </div>
              <a
                href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  'Hello VyapaarPro, I would like to consult on a new project.'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition space-x-1.5 shadow-md shadow-emerald-600/20"
              >
                <span>Message on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Direct Contact Details */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Direct Agency Contacts
              </h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-500 text-[11px]">Official Email</span>
                    <a href={`mailto:${settings.email || 'kumarsrijal732@gmail.com'}`} className="font-semibold text-white hover:text-indigo-300 transition">
                      {settings.email || 'kumarsrijal732@gmail.com'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-500 text-[11px]">Phone Support</span>
                    <a href={`tel:${(settings.phone || '+91 98765 43210').replace(/[^0-9+]/g, '')}`} className="font-semibold text-white hover:text-indigo-300 transition">
                      {settings.phone || '+91 98765 43210'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-slate-500 text-[11px]">Office Address / Hub</span>
                    <span className="text-slate-300 leading-relaxed">{settings.address || 'Indiranagar 100ft Road, Bangalore, Karnataka 560038'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Operating Notice */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              <strong>Notice:</strong> We do not take automated online credit card checkouts on this platform. Project contracts and milestone invoices are issued directly via official bank transfer or UPI.
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-2">
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              {submittedCode ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Inquiry Message Received</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Thank you for reaching out. We have logged your message in our system under reference:
                  </p>
                  <div className="inline-block px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-indigo-400 font-bold text-base">
                    {submittedCode}
                  </div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    An engineer will review your project requirements and reply via email or WhatsApp within 4 to 12 hours.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSubmittedCode(null);
                        setName('');
                        setEmail('');
                        setPhone('');
                        setSubject('');
                        setMessage('');
                      }}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Send a Project Inquiry</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tell us what you are looking to build and we will provide practical feedback.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Your Full Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Rajesh Kumar"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="rajesh@example.com"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Service Category
                      </label>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      >
                        {SERVICE_OPTIONS.map((opt, i) => (
                          <option key={i} value={opt} className="bg-slate-950 text-slate-200">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Subject / Project Goal <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Corporate Website Redesign or Custom MVP"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Project Requirements & Details <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe what you want to build, target launch timeline, desired features, or reference websites..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Sending Inquiry...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Project Inquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
