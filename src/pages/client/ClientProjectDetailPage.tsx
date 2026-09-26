import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Server,
  FileCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { dataService } from '../../services/store';
import { ProjectItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const ClientProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { settings } = useSettings();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [activeTab, setActiveTab] = useState<'milestones' | 'deliverables' | 'updates'>('milestones');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      if (!id || !profile) return;
      setIsLoading(true);
      try {
        const found = await dataService.getProjectById(id, profile.id);
        setProject(found);
      } catch (err) {
        console.error('Failed to load project details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [id, profile]);

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading project workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-white mb-2">Project Not Accessible</h2>
        <p className="text-xs text-slate-400 mb-6">
          This project record is not accessible or belongs to another client.
        </p>
        <Link
          to="/app/projects"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <SEO title={`${project.title} (${project.reference_code}) | Project Workspace`} />

      <Link
        to="/app/projects"
        className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Projects</span>
      </Link>

      {/* Project Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3 mb-1.5">
              <span className="font-mono text-xs font-bold text-indigo-400">
                {project.reference_code}
              </span>
              <StatusBadge status={project.status} type="project" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{project.title}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed max-w-2xl">
              {project.description || 'Bespoke software development & independent deployment.'}
            </p>
          </div>

          <a
            href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              `Hello VyapaarPro engineering, I have a question regarding project ${project.reference_code} ("${project.title}").`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold shrink-0 transition"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Chat With Lead Engineer</span>
          </a>
        </div>

        {/* Progress & Timeline Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Overall Progress</span>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-2 rounded-full"
                  style={{ width: `${project.progress_percentage}%` }}
                />
              </div>
              <span className="font-bold text-white text-sm">{project.progress_percentage}%</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Sprint Started</span>
            <span className="text-xs font-semibold text-white">
              {project.start_date || 'In Consultation'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">Target Production Rollout</span>
            <span className="text-xs font-semibold text-white">
              {project.expected_completion || 'Milestone Sprints'}
            </span>
          </div>
        </div>

        {/* Independent Deployment Notice */}
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-slate-300 flex items-start space-x-3">
          <Server className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block mb-0.5">Separate Production Architecture</span>
            Upon milestone completion, your website or application is deployed directly to your own server or cloud domain. Full source code repository access and documentation are provided.
          </div>
        </div>
      </div>

      {/* Workspace Tabs: Milestones, Deliverables, Updates */}
      <div className="space-y-4">
        <div className="flex border-b border-slate-800 space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('milestones')}
            className={`pb-3 transition cursor-pointer border-b-2 flex items-center space-x-2 ${
              activeTab === 'milestones'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Milestones ({project.milestones?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('deliverables')}
            className={`pb-3 transition cursor-pointer border-b-2 flex items-center space-x-2 ${
              activeTab === 'deliverables'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Deliverables & URLs ({project.deliverables?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`pb-3 transition cursor-pointer border-b-2 flex items-center space-x-2 ${
              activeTab === 'updates'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Progress Updates ({project.updates?.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: Milestones */}
        {activeTab === 'milestones' && (
          <div className="space-y-3">
            {project.milestones && project.milestones.length > 0 ? (
              project.milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        m.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : m.status === 'In Progress'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{m.title}</h4>
                      {m.description && (
                        <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    {m.completed_date && (
                      <span className="text-[11px] text-emerald-400">
                        Completed {m.completed_date}
                      </span>
                    )}
                    {m.due_date && !m.completed_date && (
                      <span className="text-[11px] text-slate-400">Target: {m.due_date}</span>
                    )}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        m.status === 'Completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : m.status === 'In Progress'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-6 text-center">
                Milestones being formulated with the engineering team.
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Deliverables */}
        {activeTab === 'deliverables' && (
          <div className="space-y-3">
            {project.deliverables && project.deliverables.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.deliverables.map((del) => (
                  <div
                    key={del.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span>{del.title}</span>
                      </h4>
                      {del.description && (
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {del.description}
                        </p>
                      )}
                    </div>

                    <a
                      href={del.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
                    >
                      <span>Open Link / Download</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
                <FileCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  Deliverables will appear here as each milestone is cleared (e.g. Figma files, staging preview links, production domains).
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Updates */}
        {activeTab === 'updates' && (
          <div className="space-y-3">
            {project.updates && project.updates.length > 0 ? (
              project.updates.map((up) => (
                <div
                  key={up.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{up.title}</h4>
                    <span className="text-[11px] text-slate-500">
                      {new Date(up.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{up.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-6 text-center">
                No sprint updates posted yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
