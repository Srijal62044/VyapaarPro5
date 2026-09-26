import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  CheckCircle,
  ExternalLink,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { ContactMessage, ContactMessageStatus } from '../../types';
import { SEO } from '../../components/common/SEO';

export const AdminMessagesPage: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getContactMessages();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleSelectMessage = async (msg: ContactMessage) => {
    setSelectedMsg(msg);
    setAdminNotes(msg.admin_notes || '');
    if (msg.status === 'Unread') {
      await dataService.updateContactMessage(msg.id, { status: 'Read' });
      loadMessages();
    }
  };

  const handleUpdateStatus = async (status: ContactMessageStatus) => {
    if (!selectedMsg) return;
    await dataService.updateContactMessage(selectedMsg.id, {
      status,
      admin_notes: adminNotes.trim() || undefined,
    });
    setSelectedMsg({ ...selectedMsg, status, admin_notes: adminNotes.trim() || undefined });
    loadMessages();
  };

  const filtered = messages.filter((m) => {
    if (statusFilter !== 'All' && m.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.reference_code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <SEO title="Inquiries & Messages | VyapaarPro Admin" />

      <div>
        <h1 className="text-2xl font-bold text-white">Contact Inquiries & Messages</h1>
        <p className="text-xs text-slate-400 mt-1">
          Messages received from public contact forms. Follow up via WhatsApp or official email.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, sender name, email or subject..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex space-x-1">
          {['All', 'Unread', 'Read', 'Replied', 'Archived'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                statusFilter === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List (Left 2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
          {filtered.length > 0 ? (
            filtered.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={`p-4 cursor-pointer transition flex items-start justify-between gap-4 ${
                  selectedMsg?.id === msg.id
                    ? 'bg-violet-950/20 border-l-4 border-violet-500'
                    : msg.status === 'Unread'
                    ? 'bg-slate-900/90 font-semibold'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-violet-400 font-bold">
                      {msg.reference_code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        msg.status === 'Unread'
                          ? 'bg-sky-500/20 text-sky-400'
                          : msg.status === 'Replied'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {msg.status}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{msg.subject}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1">{msg.message}</p>
                  <p className="text-[11px] text-slate-500">
                    From: <span className="text-slate-300">{msg.name}</span> ({msg.email})
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No inquiries found.</div>
          )}
        </div>

        {/* Selected Message Reader (Right 1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          {selectedMsg ? (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <span className="font-mono text-xs text-violet-400 font-bold block mb-1">
                  {selectedMsg.reference_code}
                </span>
                <h3 className="text-base font-bold text-white">{selectedMsg.subject}</h3>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Received: {new Date(selectedMsg.created_at).toLocaleString()}
                </span>
              </div>

              <div className="space-y-1.5 p-3 bg-slate-950 rounded-xl">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Sender</span>
                  <span className="text-white font-semibold">{selectedMsg.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Email</span>
                  <span className="text-indigo-400">{selectedMsg.email}</span>
                </div>
                {selectedMsg.phone && (
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Phone</span>
                    <span className="text-slate-200">{selectedMsg.phone}</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-semibold block mb-1 uppercase tracking-wider text-[10px]">
                  Message Body
                </span>
                <div className="p-3 bg-slate-950 rounded-xl text-slate-200 leading-relaxed whitespace-pre-wrap border border-slate-800">
                  {selectedMsg.message}
                </div>
              </div>

              {/* Direct Reply Shortcuts */}
              <div className="pt-2 flex flex-col gap-2">
                {selectedMsg.phone && (
                  <a
                    href={`https://wa.me/${selectedMsg.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hello ${selectedMsg.name}, this is VyapaarPro following up regarding your message "${selectedMsg.subject}".`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-center font-semibold transition"
                  >
                    Reply on WhatsApp
                  </a>
                )}
                <a
                  href={`mailto:${selectedMsg.email}?subject=${encodeURIComponent(
                    `Re: ${selectedMsg.subject} [${selectedMsg.reference_code}]`
                  )}`}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-center font-semibold transition"
                >
                  Reply via Email
                </a>
              </div>

              {/* Status & Notes */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <label className="block text-slate-400 text-[10px] uppercase font-bold">
                  Internal Follow-Up Notes
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record call outcome or meeting dates..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />

                <div className="flex space-x-1.5 pt-1">
                  <button
                    onClick={() => handleUpdateStatus('Replied')}
                    className="flex-1 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold"
                  >
                    Mark Replied
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Archived')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Select an inquiry on the left to read and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
