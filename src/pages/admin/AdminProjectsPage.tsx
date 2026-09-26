import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, ArrowRight, Search, CheckCircle } from 'lucide-react';
import { dataService } from '../../services/store';
import { ProjectItem, ProjectStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const AdminProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // New Project Quick Creator Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getProjects(); // Admin sees all
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await dataService.createProject({
      title: newTitle.trim(),
      client_name: newClientName.trim() || 'Client',
      client_email: newClientEmail.trim() || undefined,
      description: newDesc.trim(),
      status: 'Planning',
      progress_percentage: 10,
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewClientName('');
    setNewClientEmail('');
    setNewDesc('');
    loadProjects();
  };

  const statuses = [
    'All',
    'Planning',
    'Design',
    'Development',
    'Testing',
    'Review',
    'Completed',
    'On Hold',
    'Cancelled',
  ];

  const filtered = projects.filter((p) => {
    if (selectedStatus !== 'All' && p.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.reference_code.toLowerCase().includes(q) ||
        (p.client_name && p.client_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <SEO title="Project Management | VyapaarPro Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Workspaces & Sprints</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage milestones, updates, deliverables, and confidential payment stages.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-600/20 transition self-start sm:self-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Project</span>
        </button>
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
              placeholder="Search by title, reference code or client..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
            />
          </div>

          <span className="text-xs text-slate-400 self-center">
            Total: <strong>{filtered.length}</strong> projects
          </span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-800/80">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                selectedStatus === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Project Title</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Internal Invoicing</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filtered.map((prj) => (
                <tr key={prj.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-violet-400">
                    <Link to={`/admin/projects/${prj.id}`} className="hover:underline">
                      {prj.reference_code}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <span className="block">{prj.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Target: {prj.expected_completion || 'TBD'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {prj.client_name || 'Client'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={prj.status} type="project" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full"
                          style={{ width: `${prj.progress_percentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-slate-300">
                        {prj.progress_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={prj.internal_payment_status} type="payment" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/admin/projects/${prj.id}`}
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

      {/* Quick Launch Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Launch Dedicated Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Project Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Kaveri Handlooms E-Commerce Store"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Client Name / Business</label>
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Ananya Iyer (Kaveri Handlooms)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Client Email</label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Scope Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Project goals, milestones, tech requirements..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl"
                >
                  Launch Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
