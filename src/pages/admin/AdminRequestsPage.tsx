import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Filter,
  Search,
  ArrowRight,
  MessageSquare,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { ServiceRequest, RequestStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const AdminRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getRequests(); // Admin sees all
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const statuses = [
    'All',
    'New',
    'Contacted',
    'Discussing',
    'Approved',
    'In Progress',
    'Completed',
    'Cancelled',
  ];

  const filtered = requests.filter((r) => {
    if (selectedStatus !== 'All' && r.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.reference_code.toLowerCase().includes(q) ||
        r.client_name.toLowerCase().includes(q) ||
        r.client_email.toLowerCase().includes(q) ||
        r.client_phone.toLowerCase().includes(q) ||
        r.service_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <SEO title="Service Requests Management | VyapaarPro Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Service Requests (Leads & Inquiries)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review incoming project requirements, log internal progress notes, and initialize project workspaces.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, client name, phone or service..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <span className="text-xs text-slate-400 self-center">
            Total: <strong>{filtered.length}</strong> inquiries
          </span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-800/80">
          {statuses.map((s) => {
            const count =
              s === 'All' ? requests.length : requests.filter((r) => r.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  selectedStatus === s
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Internal Payment</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-violet-400">
                    <Link to={`/admin/requests/${req.id}`} className="hover:underline">
                      {req.reference_code}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white block">{req.client_name}</span>
                    <span className="text-[11px] text-slate-400">{req.business_name || 'Individual'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-200 max-w-[200px] truncate">
                    {req.service_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    <span className="block text-slate-300">{req.client_phone}</span>
                    <span className="text-[10px]">{req.preferred_contact_method}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={req.status} type="request" />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={req.payment_status} type="payment" />
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/admin/requests/${req.id}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium space-x-1"
                    >
                      <span>Manage</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
