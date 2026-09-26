import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Clock,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { dataService } from '../../services/store';
import { ServiceRequest } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const ClientRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { settings } = useSettings();

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRequest() {
      if (!id || !profile) return;
      setIsLoading(true);
      try {
        // Enforce user_id restriction
        const found = await dataService.getRequestById(id, profile.id);
        setRequest(found);
      } catch (err) {
        console.error('Failed to load request:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRequest();
  }, [id, profile]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading request details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-white mb-2">Request Not Accessible</h2>
        <p className="text-xs text-slate-400 mb-6">
          This service request either does not exist or belongs to another client account.
        </p>
        <Link
          to="/app/requests"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Return to My Requests</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <SEO title={`Request ${request.reference_code} | VyapaarPro`} />

      <Link
        to="/app/requests"
        className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Requests</span>
      </Link>

      {/* Main Request Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono text-sm font-bold text-indigo-400">
                {request.reference_code}
              </span>
              <StatusBadge status={request.status} type="request" />
            </div>
            <h1 className="text-2xl font-bold text-white">{request.service_name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Submitted on {new Date(request.created_at).toLocaleString()}
            </p>
          </div>

          <a
            href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hello VyapaarPro, I am following up on my request ${request.reference_code} for "${request.service_name}".`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold self-start sm:self-center transition"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Follow up on WhatsApp</span>
          </a>
        </div>

        {/* Requirements Details */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Detailed Requirements
          </h3>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {request.requirements}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Preferred Contact</span>
            <span className="text-xs font-semibold text-white">{request.preferred_contact_method}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Budget Expectation</span>
            <span className="text-xs font-semibold text-white">
              {request.budget_range || 'To be finalized in discussion'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Contact Phone</span>
            <span className="text-xs font-semibold text-white">{request.client_phone}</span>
          </div>
        </div>

        {request.reference_links && (
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Provided Reference Links
            </span>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-400 break-all font-mono">
              {request.reference_links}
            </div>
          </div>
        )}

        {/* Files */}
        {request.files && request.files.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Attached References
            </span>
            <div className="space-y-1.5">
              {request.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300 truncate">{file.file_name}</span>
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Explanation Timeline */}
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 space-y-2">
          <span className="font-bold text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>VyapaarPro Delivery Lifecycle</span>
          </span>
          <p className="text-slate-400 leading-relaxed">
            Once scope and milestone invoices are approved offline, your dedicated project workspace will be initialized under "Active Projects".
          </p>
        </div>
      </div>
    </div>
  );
};
