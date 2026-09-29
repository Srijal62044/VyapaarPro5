import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, Ticket, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { aiSupportService } from '../../services/aiSupportService';
import { SupportTicketCategory, SupportTicketPriority } from '../../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: SupportTicketCategory;
  defaultSubject?: string;
  defaultOrderId?: string;
  onTicketCreated?: (ticket: any) => void;
}

const CATEGORIES: SupportTicketCategory[] = [
  'General',
  'Service',
  'Store',
  'Payment',
  'Order',
  'Delivery',
  'Technical',
  'Other',
];

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'General',
  defaultSubject = '',
  defaultOrderId = '',
  onTicketCreated,
}) => {
  const { user, profile } = useAuth();

  const [subject, setSubject] = useState(defaultSubject);
  const [category, setCategory] = useState<SupportTicketCategory>(defaultCategory);
  const [priority, setPriority] = useState<SupportTicketPriority>('normal');
  const [orderId, setOrderId] = useState(defaultOrderId);
  const [message, setMessage] = useState('');

  // Guest fields if user not logged in
  const [guestName, setGuestName] = useState(profile?.full_name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(profile?.phone || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdTicket, setCreatedTicket] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!subject.trim()) {
      setErrorMsg('Please enter a ticket subject.');
      return;
    }

    if (!message.trim()) {
      setErrorMsg('Please describe your issue or requirement.');
      return;
    }

    if (!user && !guestEmail.trim()) {
      setErrorMsg('Please provide your email address so our team can contact you.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await aiSupportService.createTicket({
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority,
        order_id: orderId.trim() || undefined,
        guest_name: guestName.trim() || undefined,
        guest_email: guestEmail.trim() || undefined,
        guest_phone: guestPhone.trim() || undefined,
      });

      if (res.success && res.ticket) {
        setCreatedTicket(res.ticket);
        if (onTicketCreated) onTicketCreated(res.ticket);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCreatedTicket(null);
    setSubject('');
    setMessage('');
    setOrderId('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto text-slate-100">
        <button
          onClick={handleReset}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {createdTicket ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-1">
                Ticket Created #{createdTicket.ticket_number}
              </span>
              <h3 className="text-2xl font-black text-white">Support Ticket Submitted</h3>
              <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                Your ticket has been assigned to our human support team. We will review your query and reply promptly.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Subject:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">{createdTicket.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="text-indigo-300 font-medium">{createdTicket.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {createdTicket.status}
                </span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
              <Ticket className="w-4 h-4" />
              <span>VyapaarPro Human Help Desk</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">Create Support Ticket</h3>
            <p className="text-xs text-slate-400 mt-1">
              Need personal assistance or custom project review? Submit a ticket directly to our engineers.
            </p>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low (General Query)</option>
                    <option value="normal">Normal</option>
                    <option value="high">High (Active Order)</option>
                    <option value="urgent">Urgent (Payment Issue)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Order #VP-ORD-1234 inquiry or Custom Feature Request"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Order Reference (Optional)
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. VP-ORD-XXXX or Transaction ID"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Guest details if user is not logged in */}
              {!user && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Your Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      WhatsApp / Mobile (Optional)
                    </label>
                    <input
                      type="text"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Message / Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what you need help with. Please do NOT include passwords, OTPs, or payment PINs."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
