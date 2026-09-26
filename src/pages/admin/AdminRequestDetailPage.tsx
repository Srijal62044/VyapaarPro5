import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  FolderPlus,
  Save,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { InternalPaymentStatus, RequestStatus, ServiceRequest } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const AdminRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [status, setStatus] = useState<RequestStatus>('New');
  const [internalNotes, setInternalNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<InternalPaymentStatus>('Not Discussed');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReq() {
      if (!id) return;
      setIsLoading(true);
      try {
        const found = await dataService.getRequestById(id);
        setRequest(found);
        if (found) {
          setStatus(found.status);
          setInternalNotes(found.internal_notes || '');
          setPaymentStatus(found.payment_status);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReq();
  }, [id]);

  const handleSave = async () => {
    if (!request) return;
    setIsSaving(true);
    try {
      await dataService.updateRequestStatus(request.id, status, internalNotes, paymentStatus);
      setNotice('Request changes and internal notes saved.');
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToProject = async () => {
    if (!request) return;
    if (window.confirm(`Initialize dedicated project workspace for "${request.service_name}"?`)) {
      const created = await dataService.createProject({
        request_id: request.id,
        client_id: request.user_id,
        client_name: `${request.client_name} (${request.business_name || 'Individual'})`,
        client_email: request.client_email,
        title: `${request.service_name} - ${request.client_name}`,
        description: request.requirements,
        service_id: request.service_id,
        internal_payment_status: paymentStatus,
      });

      // Update request status to Approved / In Progress
      await dataService.updateRequestStatus(
        request.id,
        'In Progress',
        `${internalNotes}\n[Converted to Project ${created.reference_code}]`,
        paymentStatus
      );

      navigate(`/admin/projects/${created.id}`);
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading request specifications...</div>;
  }

  if (!request) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Request Not Found</h2>
        <Link to="/admin/requests" className="text-xs text-violet-400">
          Back to all requests
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <SEO title={`Admin Manage Request: ${request.reference_code}`} />

      <div className="flex items-center justify-between">
        <Link
          to="/admin/requests"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Requests List</span>
        </Link>

        <button
          onClick={handleConvertToProject}
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Convert to Project Workspace</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Request Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono text-sm font-bold text-violet-400">
                {request.reference_code}
              </span>
              <StatusBadge status={status} type="request" />
            </div>
            <h1 className="text-2xl font-bold text-white">{request.service_name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Created: {new Date(request.created_at).toLocaleString()}
            </p>
          </div>

          {/* Quick Contact Buttons */}
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/${request.client_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hello ${request.client_name}, this is VyapaarPro contacting you regarding your request ${request.reference_code} for "${request.service_name}".`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Client</span>
            </a>
            <a
              href={`tel:${request.client_phone}`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Phone</span>
            </a>
            <a
              href={`mailto:${request.client_email}?subject=${encodeURIComponent(
                `VyapaarPro Service Inquiry: ${request.reference_code}`
              )}`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </a>
          </div>
        </div>

        {/* Client Metadata Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">Customer Name</span>
            <span className="text-xs font-bold text-white">{request.client_name}</span>
            <span className="text-[11px] text-slate-400 block">{request.business_name || 'Individual'}</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">Contact Method</span>
            <span className="text-xs font-semibold text-white">{request.preferred_contact_method}</span>
            <span className="text-[11px] text-slate-400 block">{request.client_phone}</span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-0.5">Budget Expectation</span>
            <span className="text-xs font-semibold text-indigo-400">
              {request.budget_range || 'Flexible'}
            </span>
            <span className="text-[11px] text-slate-400 block truncate">{request.client_email}</span>
          </div>
        </div>

        {/* Requirements Body */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Submitted Requirements & Scope
          </h3>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {request.requirements}
          </div>
        </div>

        {request.reference_links && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Reference Links
            </h3>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-400 font-mono break-all">
              {request.reference_links}
            </div>
          </div>
        )}

        {/* Status & Internal Payments Controls (Admin Only) */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Admin Status & Internal Invoicing (Private)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RequestStatus)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Discussing">Discussing</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Internal Payment Status (Offline Invoicing Record)
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as InternalPaymentStatus)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              >
                <option value="Not Discussed">Not Discussed</option>
                <option value="Pending">Pending</option>
                <option value="Partially Received">Partially Received</option>
                <option value="Received">Received</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Never visible to customer. Internal audit only.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Internal Admin Notes (Private)
            </label>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Record call notes, discussed scope, payment invoice numbers, or follow-up tasks..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Internal Updates'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
