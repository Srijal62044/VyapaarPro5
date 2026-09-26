import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/store';
import { ServiceRequest, RequestStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const ClientRequestsPage: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      if (!profile) return;
      setIsLoading(true);
      try {
        const data = await dataService.getRequests(profile.id);
        setRequests(data);
      } catch (err) {
        console.error('Failed to load requests:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRequests();
  }, [profile]);

  const filtered = requests.filter((r) => {
    if (selectedFilter === 'All') return true;
    return r.status === selectedFilter;
  });

  const statuses = ['All', 'New', 'Contacted', 'Discussing', 'Approved', 'In Progress', 'Completed', 'Cancelled'];

  return (
    <div className="space-y-6">
      <SEO title="My Service Requests | VyapaarPro Client Portal" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Service Requests</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track quotation submissions and scope discussions with the VyapaarPro engineering desk.
          </p>
        </div>
        <Link
          to="/services"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Service Request</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setSelectedFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
              selectedFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Requests Table / Cards */}
      {filtered.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/60 transition"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {req.reference_code}
                  </span>
                  <StatusBadge status={req.status} type="request" />
                  <span className="text-[11px] text-slate-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{req.service_name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {req.requirements}
                </p>
                {req.budget_range && (
                  <span className="inline-block text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Budget: {req.budget_range}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 self-end sm:self-center shrink-0">
                <Link
                  to={`/app/requests/${req.id}`}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center space-x-1.5 transition"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No requests found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {selectedFilter !== 'All'
              ? `No requests with status "${selectedFilter}".`
              : 'You have not submitted any service inquiries yet.'}
          </p>
          <Link
            to="/services"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            Explore Services
          </Link>
        </div>
      )}
    </div>
  );
};
