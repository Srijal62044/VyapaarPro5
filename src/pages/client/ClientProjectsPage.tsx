import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataService } from '../../services/store';
import { ProjectItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const ClientProjectsPage: React.FC = () => {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      if (!profile) return;
      setIsLoading(true);
      try {
        const data = await dataService.getProjects(profile.id);
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [profile]);

  const filtered = projects.filter((p) => {
    if (filter === 'active') return p.status !== 'Completed' && p.status !== 'Cancelled';
    if (filter === 'completed') return p.status === 'Completed';
    return true;
  });

  return (
    <div className="space-y-6">
      <SEO title="Active & Completed Projects | VyapaarPro Client Workspace" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dedicated Client Projects</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time engineering milestones, staging environments, and production deliverables.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filter === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({projects.filter((p) => p.status !== 'Completed' && p.status !== 'Cancelled').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filter === 'completed' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({projects.filter((p) => p.status === 'Completed').length})
          </button>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((prj) => (
            <div
              key={prj.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {prj.reference_code}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{prj.title}</h3>
                  </div>
                  <StatusBadge status={prj.status} type="project" />
                </div>

                <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {prj.description || 'Custom software development & independent cloud deployment.'}
                </p>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Completion</span>
                    <span className="font-bold text-indigo-300">{prj.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${prj.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Milestones count */}
                {prj.milestones && prj.milestones.length > 0 && (
                  <div className="mt-4 flex items-center space-x-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>
                      {prj.milestones.filter((m) => m.status === 'Completed').length} of{' '}
                      {prj.milestones.length} Milestones Cleared
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Target: {prj.expected_completion || 'Active Sprints'}
                </span>
                <Link
                  to={`/app/projects/${prj.id}`}
                  className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-semibold flex items-center space-x-1.5 transition"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">No projects in this category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Once a service request is discussed and agreed, your dedicated project space will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
