import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Inbox,
  FolderKanban,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { ProjectItem, ServiceItem, ServiceRequest, UserProfile } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const AdminDashboard: React.FC = () => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminMetrics() {
      setIsLoading(true);
      try {
        const [c, r, p, s] = await Promise.all([
          dataService.getClients(),
          dataService.getRequests(),
          dataService.getProjects(),
          dataService.getServices(false),
        ]);
        setClients(c);
        setRequests(r);
        setProjects(p);
        setServices(s);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminMetrics();
  }, []);

  // Compute strictly REAL database counts as mandated in Section 14
  const totalClients = clients.length;
  const newRequests = requests.filter((r) => r.status === 'New').length;
  const activeProjects = projects.filter((p) => p.status !== 'Completed' && p.status !== 'Cancelled').length;
  const completedProjects = projects.filter((p) => p.status === 'Completed').length;
  const pendingRequests = requests.filter(
    (r) => r.status === 'New' || r.status === 'Contacted' || r.status === 'Discussing'
  ).length;

  return (
    <div className="space-y-8">
      <SEO title="Admin Operations Overview | VyapaarPro" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider block mb-1">
            Operations Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Agency Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verified database metrics, client pipeline, and active sprint statuses.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/admin/services/new"
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create New Service</span>
          </Link>
          <Link
            to="/admin/projects"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition"
          >
            Manage Projects
          </Link>
        </div>
      </div>

      {/* Real Statistics Metric Cards (Section 14: Total Clients, New Requests, Active Projects, Completed Projects, Pending Requests) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400 block">Total Clients</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{totalClients}</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-[11px] text-slate-500">Registered & prospective</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400 block">New Requests</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-sky-400">{newRequests}</span>
            <Inbox className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-[11px] text-slate-500">Uncontacted leads</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400 block">Active Projects</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-violet-400">{activeProjects}</span>
            <FolderKanban className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-[11px] text-slate-500">In development/testing</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400 block">Completed Projects</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-400">{completedProjects}</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[11px] text-slate-500">Delivered & verified</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-400 block">Pending Inquiries</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-400">{pendingRequests}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[11px] text-slate-500">In scope discussions</span>
        </div>
      </div>

      {/* Internal Invoicing Reminder Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start space-x-3 text-xs text-slate-300">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Agency Internal Finance Rules</span>
          All payment statuses recorded here (Not Discussed, Pending, Partially Received, Received) are confidential internal project management records. They are strictly hidden from public clients and stripped from public APIs.
        </div>
      </div>

      {/* Two Column Layout: Recent Requests & Recent Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Service Requests (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Service Requests</h2>
            <Link
              to="/admin/requests"
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
            >
              View All Requests ({requests.length}) →
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {requests.slice(0, 5).map((req) => (
              <div key={req.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-900/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-violet-400">
                      {req.reference_code}
                    </span>
                    <StatusBadge status={req.status} type="request" />
                    <span className="text-[10px] text-slate-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{req.service_name}</h4>
                  <p className="text-xs text-slate-400">
                    <strong className="text-slate-300">{req.client_name}</strong> • {req.client_phone} • {req.client_email}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-4">
                  <Link
                    to={`/admin/requests/${req.id}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Clients List (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Clients</h2>
            <Link
              to="/admin/clients"
              className="text-xs text-violet-400 hover:text-violet-300 font-semibold"
            >
              Directory ({clients.length}) →
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/80">
            {clients.slice(0, 5).map((cl) => {
              const clientReqs = requests.filter((r) => r.user_id === cl.id || r.client_email.toLowerCase() === cl.email.toLowerCase()).length;
              const clientPrjs = projects.filter((p) => p.client_id === cl.id || p.client_email?.toLowerCase() === cl.email.toLowerCase()).length;

              return (
                <div key={cl.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white truncate">{cl.full_name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{cl.company_name || cl.email}</p>
                    <div className="mt-1 flex space-x-2 text-[10px] text-slate-500">
                      <span>{clientReqs} requests</span>
                      <span>•</span>
                      <span>{clientPrjs} projects</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-indigo-300 border border-slate-800">
                    {cl.role}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
