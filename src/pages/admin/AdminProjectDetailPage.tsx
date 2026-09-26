import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  ExternalLink,
  Clock,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { InternalPaymentStatus, ProjectItem, ProjectMilestone, ProjectStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SEO } from '../../components/common/SEO';

export const AdminProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<ProjectItem | null>(null);
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [progress, setProgress] = useState(10);
  const [expectedCompletion, setExpectedCompletion] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<InternalPaymentStatus>('Not Discussed');

  // Milestone adder
  const [newMTitle, setNewMTitle] = useState('');
  const [newMDesc, setNewMDesc] = useState('');
  const [newMDue, setNewMDue] = useState('');

  // Update adder
  const [newUpTitle, setNewUpTitle] = useState('');
  const [newUpMsg, setNewUpMsg] = useState('');

  // Deliverable adder
  const [newDelTitle, setNewDelTitle] = useState('');
  const [newDelUrl, setNewDelUrl] = useState('');
  const [newDelDesc, setNewDelDesc] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadProject = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const found = await dataService.getProjectById(id);
      setProject(found);
      if (found) {
        setStatus(found.status);
        setProgress(found.progress_percentage);
        setExpectedCompletion(found.expected_completion || '');
        setNotes(found.notes || '');
        setPaymentStatus(found.internal_payment_status);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleSaveMain = async () => {
    if (!project) return;
    setIsSaving(true);
    try {
      await dataService.updateProject(project.id, {
        status,
        progress_percentage: progress,
        expected_completion: expectedCompletion || undefined,
        notes,
        internal_payment_status: paymentStatus,
      });
      setNotice('Project parameters updated successfully.');
      loadProject();
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMilestone = async (m: ProjectMilestone) => {
    if (!project) return;
    const nextStatus = m.status === 'Completed' ? 'Pending' : 'Completed';
    await dataService.updateProjectMilestone(project.id, m.id, { status: nextStatus });
    loadProject();
  };

  const handleAddMilestone = async () => {
    if (!project || !newMTitle.trim()) return;
    await dataService.addProjectMilestone(project.id, {
      title: newMTitle.trim(),
      description: newMDesc.trim() || undefined,
      due_date: newMDue || undefined,
      status: 'Pending',
      display_order: (project.milestones?.length || 0) + 1,
    });
    setNewMTitle('');
    setNewMDesc('');
    setNewMDue('');
    loadProject();
  };

  const handleAddUpdate = async () => {
    if (!project || !newUpTitle.trim() || !newUpMsg.trim()) return;
    await dataService.addProjectUpdate(project.id, newUpTitle.trim(), newUpMsg.trim());
    setNewUpTitle('');
    setNewUpMsg('');
    loadProject();
  };

  const handleAddDeliverable = async () => {
    if (!project || !newDelTitle.trim() || !newDelUrl.trim()) return;
    await dataService.addProjectDeliverable(
      project.id,
      newDelTitle.trim(),
      newDelUrl.trim(),
      newDelDesc.trim() || undefined
    );
    setNewDelTitle('');
    setNewDelUrl('');
    setNewDelDesc('');
    loadProject();
  };

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-slate-400">Loading project workspace...</div>;
  }

  if (!project) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
        <Link to="/admin/projects" className="text-xs text-violet-400">
          Back to all projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <SEO title={`Admin Manage: ${project.title} (${project.reference_code})`} />

      <div className="flex items-center justify-between">
        <Link
          to="/admin/projects"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects List</span>
        </Link>
        <span className="text-xs font-mono font-bold text-violet-400">
          {project.reference_code}
        </span>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Project Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Client: <strong className="text-slate-200">{project.client_name}</strong>
              {project.client_email && ` (${project.client_email})`}
            </p>
          </div>
          <StatusBadge status={status} type="project" />
        </div>

        {/* Project Controls Form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="Planning">Planning</option>
              <option value="Design">Design</option>
              <option value="Development">Development</option>
              <option value="Testing">Testing</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Progress %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Completion</label>
            <input
              type="date"
              value={expectedCompletion}
              onChange={(e) => setExpectedCompletion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>
        </div>

        {/* Internal Payment Invoicing Status (Section 2) */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-violet-400 uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Confidential Internal Payment Record (Private)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Offline Invoicing Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as InternalPaymentStatus)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="Not Discussed">Not Discussed</option>
                <option value="Pending">Pending</option>
                <option value="Partially Received">Partially Received</option>
                <option value="Received">Received</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Internal Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Invoice numbers, bank transaction reference, etc."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveMain}
          disabled={isSaving}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Project Status & Notes</span>
        </button>
      </div>

      {/* Milestones Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Project Milestones (Section 13)</span>
        </h3>

        {/* Existing Milestones */}
        <div className="space-y-2">
          {project.milestones?.map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={m.status === 'Completed'}
                  onChange={() => handleToggleMilestone(m)}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <div>
                  <span
                    className={`font-semibold ${
                      m.status === 'Completed' ? 'line-through text-slate-500' : 'text-white'
                    }`}
                  >
                    {m.title}
                  </span>
                  {m.description && (
                    <span className="block text-[11px] text-slate-400">{m.description}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {m.due_date && <span className="text-slate-400 text-[11px]">Due: {m.due_date}</span>}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    m.status === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Milestone Form */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={newMTitle}
            onChange={(e) => setNewMTitle(e.target.value)}
            placeholder="New Milestone Title..."
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
          <input
            type="text"
            value={newMDesc}
            onChange={(e) => setNewMDesc(e.target.value)}
            placeholder="Description..."
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
          <div className="flex space-x-2">
            <input
              type="date"
              value={newMDue}
              onChange={(e) => setNewMDue(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <button
              onClick={handleAddMilestone}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Deliverables Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-indigo-400" />
          <span>Deliverables & Client Access URLs</span>
        </h3>

        <div className="space-y-2">
          {project.deliverables?.map((del) => (
            <div
              key={del.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-white">{del.title}</span>
                <a
                  href={del.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-indigo-400 font-mono text-[11px] truncate max-w-md hover:underline"
                >
                  {del.url}
                </a>
              </div>
              <a
                href={del.url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={newDelTitle}
            onChange={(e) => setNewDelTitle(e.target.value)}
            placeholder="Deliverable Title (e.g. Staging Link)..."
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
          <input
            type="url"
            value={newDelUrl}
            onChange={(e) => setNewDelUrl(e.target.value)}
            placeholder="https://..."
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
          />
          <div className="flex space-x-2">
            <input
              type="text"
              value={newDelDesc}
              onChange={(e) => setNewDelDesc(e.target.value)}
              placeholder="Notes..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <button
              onClick={handleAddDeliverable}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Progress Updates Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <Clock className="w-4 h-4 text-violet-400" />
          <span>Post Sprint Updates (Visible to Client)</span>
        </h3>

        <div className="space-y-2">
          {project.updates?.map((up) => (
            <div key={up.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400 mb-1">
                <span className="font-bold text-white">{up.title}</span>
                <span className="text-[10px]">{new Date(up.created_at).toLocaleString()}</span>
              </div>
              <p className="text-slate-300">{up.message}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-800 space-y-2">
          <input
            type="text"
            value={newUpTitle}
            onChange={(e) => setNewUpTitle(e.target.value)}
            placeholder="Update Headline (e.g. Rate Calculator Staging Ready)..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
          <div className="flex space-x-2">
            <textarea
              rows={2}
              value={newUpMsg}
              onChange={(e) => setNewUpMsg(e.target.value)}
              placeholder="Message to client explaining progress or review instructions..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
            <button
              onClick={handleAddUpdate}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold self-end"
            >
              Post Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
