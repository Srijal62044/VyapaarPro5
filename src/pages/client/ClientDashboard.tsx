import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { dataService } from '../../services/store';
import { ServiceRequest, ProjectItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const ClientDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { settings } = useSettings();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClientData() {
      if (!profile) return;
      setIsLoading(true);
      try {
        const [reqs, prjs] = await Promise.all([
          dataService.getRequests(profile.id),
          dataService.getProjects(profile.id),
        ]);
        setRequests(reqs);
        setProjects(prjs);
      } catch (err) {
        console.error('Failed to load client data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClientData();
  }, [profile]);

  const activeProjects = projects.filter((p) => p.status !== 'Completed' && p.status !== 'Cancelled');
  const activeRequests = requests.filter((r) => r.status !== 'Completed' && r.status !== 'Cancelled');

  return (
    <div className="space-y-8">
      <SEO title="Client Workspace Overview | VyapaarPro" />

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
            Client Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {profile?.full_name || 'Client'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitor real-time milestone progress, view deliverables, and track technical service requests.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/services"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Browse New Services</span>
            </Link>
            <a
              href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hello VyapaarPro team, this is ${profile?.full_name} (${profile?.email}). Inquiring about my active projects.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct WhatsApp Desk</span>
            </a>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Active Projects</span>
            <p className="text-2xl font-bold text-white mt-1">{activeProjects.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Service Requests</span>
            <p className="text-2xl font-bold text-white mt-1">{requests.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Completed Deliveries</span>
            <p className="text-2xl font-bold text-white mt-1">
              {projects.filter((p) => p.status === 'Completed').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Active Projects Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Active Projects</h2>
          <Link to="/app/projects" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
            View All Projects →
          </Link>
        </div>

        {activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeProjects.map((prj) => (
              <div
                key={prj.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-indigo-400">
                      {prj.reference_code}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{prj.title}</h3>
                  </div>
                  <StatusBadge status={prj.status} type="project" />
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Milestone Progress</span>
                    <span className="font-bold text-indigo-300">{prj.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${prj.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Est. Delivery: {prj.expected_completion || 'In Scope'}
                  </span>
                  <Link
                    to={`/app/projects/${prj.id}`}
                    className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <span>View Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
            <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No projects currently underway.</p>
          </div>
        )}
      </div>

      {/* Recent Requests Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Service Inquiries & Requests</h2>
          <Link to="/app/requests" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
            View All ({requests.length}) →
          </Link>
        </div>

        {requests.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80">
            {requests.slice(0, 4).map((req) => (
              <div key={req.id} className="p-4 sm:p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-semibold text-indigo-400">
                      {req.reference_code}
                    </span>
                    <StatusBadge status={req.status} type="request" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">{req.service_name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-1 max-w-lg">
                    {req.requirements}
                  </p>
                </div>
                <Link
                  to={`/app/requests/${req.id}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium shrink-0 ml-4"
                >
                  Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 mb-3">No service requests submitted yet.</p>
            <Link
              to="/services"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Browse Services Catalogue
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
