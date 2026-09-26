import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Send, Upload, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { ServiceItem } from '../../types';
import { dataService } from '../../services/store';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: ServiceItem | null;
  servicesList?: ServiceItem[];
}

export const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  preselectedService,
  servicesList = [],
}) => {
  const { profile } = useAuth();
  const { settings } = useSettings();

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [requirements, setRequirements] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [preferredContact, setPreferredContact] = useState('WhatsApp');
  const [referenceLinks, setReferenceLinks] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-populate when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      if (profile) {
        setClientName(profile.full_name || '');
        setClientEmail(profile.email || '');
        setClientPhone(profile.phone || '');
        setBusinessName(profile.company_name || '');
      }
      if (preselectedService) {
        setSelectedServiceId(preselectedService.id);
        setServiceName(preselectedService.name);
      } else if (servicesList.length > 0 && !selectedServiceId) {
        setSelectedServiceId(servicesList[0].id);
        setServiceName(servicesList[0].name);
      }
      setSubmittedReference(null);
      setErrorMessage('');
    }
  }, [isOpen, profile, preselectedService, servicesList]);

  const handleServiceChange = (id: string) => {
    setSelectedServiceId(id);
    const found = servicesList.find((s) => s.id === id);
    if (found) {
      setServiceName(found.name);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim() || !requirements.trim()) {
      setErrorMessage('Please fill in your name, email, phone number, and project requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalServiceName =
        serviceName ||
        servicesList.find((s) => s.id === selectedServiceId)?.name ||
        'Custom Digital Solution';

      const created = await dataService.createRequest({
        user_id: profile?.id || null,
        service_id: selectedServiceId || null,
        service_name: finalServiceName,
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        client_phone: clientPhone.trim(),
        business_name: businessName.trim() || undefined,
        requirements: requirements.trim(),
        budget_range: budgetRange || undefined,
        preferred_contact_method: preferredContact,
        reference_links: referenceLinks.trim() || undefined,
        files: files.map((f, i) => ({
          id: 'file-' + i,
          request_id: 'pending',
          file_name: f.name,
          file_url: URL.createObjectURL(f),
          file_size: f.size,
          created_at: new Date().toISOString(),
        })),
      });

      setSubmittedReference(created.reference_code);
    } catch (err: any) {
      console.error('Request submission error:', err);
      setErrorMessage('Failed to submit request. Please try again or reach us via WhatsApp directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Start Your Project</h3>
              <p className="text-xs text-slate-400">Tell us your vision — no online payment required.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {submittedReference ? (
            /* Success confirmation screen */
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 mb-4 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Request Submitted Successfully!</h4>
              <p className="text-slate-300 max-w-md mx-auto mb-6 text-sm">
                Your request has been registered in the VyapaarPro system. Our engineering team will review your requirements and reach out soon.
              </p>

              <div className="inline-block bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
                <span className="text-xs text-slate-400 block mb-1 uppercase tracking-wider">Your Reference Code</span>
                <span className="text-2xl font-mono font-bold text-indigo-400 tracking-wider">
                  {submittedReference}
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Keep this handy for all project communications.
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-left max-w-md mx-auto mb-6 text-xs text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-300">Next Steps:</p>
                <p>1. We will review your scope within 4-12 business hours.</p>
                <p>2. We will contact you via {preferredContact} to finalize deliverables.</p>
                <p>3. Payments are handled via direct invoice/bank transfer — never on this website.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hello VyapaarPro, I just submitted requirement request ${submittedReference} for "${serviceName || 'Digital Service'}". Let's discuss!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp Now</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Requirement form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-xl">
                  {errorMessage}
                </div>
              )}

              {/* Notice Banner */}
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start space-x-2">
                <span className="font-bold">Transparent Process:</span>
                <span>
                  No credit card or online checkout needed. Submitting this form creates a direct inquiry. We discuss scope & pricing before any work starts.
                </span>
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Selected Service
                </label>
                {servicesList.length > 0 ? (
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
                  >
                    {servicesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.pricing_model === 'CUSTOM_QUOTE' ? 'Custom Quote' : `Starting ₹${s.price.toLocaleString('en-IN')}`})
                      </option>
                    ))}
                    <option value="other">Other / Custom Digital Solution</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g. Business Website, Mobile App"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Your Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="rajesh@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Business / Brand Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Kumar Enterprises"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Detailed Requirements <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Describe your goals, desired features, number of pages or products, target audience, and any specific preferences..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Preferences: Budget & Preferred Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Estimated Budget Range (Optional)
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Flexible / Discuss with team</option>
                    <option value="Under ₹15,000">Under ₹15,000</option>
                    <option value="₹15,000 - ₹35,000">₹15,000 - ₹35,000</option>
                    <option value="₹35,000 - ₹75,000">₹35,000 - ₹75,000</option>
                    <option value="₹75,000 - ₹1,50,000">₹75,000 - ₹1,50,000</option>
                    <option value="Above ₹1,50,000">Enterprise (₹1,50,000+)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Preferred Contact Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['WhatsApp', 'Phone Call', 'Email'].map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPreferredContact(method)}
                        className={`py-2 text-xs font-medium rounded-xl border transition ${
                          preferredContact === method
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reference Links & File Uploads */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Reference Links / Competitor Websites (Optional)
                </label>
                <input
                  type="text"
                  value={referenceLinks}
                  onChange={(e) => setReferenceLinks(e.target.value)}
                  placeholder="e.g. https://apple.com, https://mycompetitor.in"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Attach Documents / Brief (Optional)
                </label>
                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer bg-slate-950/50 transition">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-400">
                    Click to attach PDF, docx, or screenshot references
                  </span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                </label>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="text-xs text-indigo-300 bg-slate-950 px-2 py-1 rounded flex justify-between items-center"
                      >
                        <span>{f.name}</span>
                        <span className="text-slate-500">{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Submitting Request...</span>
                  ) : (
                    <>
                      <span>Submit Requirement Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  By submitting, you agree to receive a consultation call/message from VyapaarPro.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
