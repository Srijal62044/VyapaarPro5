import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, FolderKanban, FileText, CheckCircle } from 'lucide-react';
import { dataService } from '../../services/store';
import { ProjectItem, ServiceRequest, UserProfile } from '../../types';
import { SEO } from '../../components/common/SEO';

export const AdminClientsPage: React.FC = () => {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [c, r, p] = await Promise.all([
          dataService.getClients(),
          dataService.getRequests(),
          dataService.getProjects(),
        ]);
        setClients(c);
        setRequests(r);
        setProjects(p);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.company_name && c.company_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <SEO title="Client Directory | VyapaarPro Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Directory & Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered client accounts and prospective organizations.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, email, company, phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Client Name</th>
                <th className="py-3.5 px-4">Company</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4">Requests</th>
                <th className="py-3.5 px-4">Projects</th>
                <th className="py-3.5 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filtered.map((client) => {
                const clientReqs = requests.filter(
                  (r) => r.user_id === client.id || r.client_email.toLowerCase() === client.email.toLowerCase()
                );
                const clientPrjs = projects.filter(
                  (p) => p.client_id === client.id || p.client_email?.toLowerCase() === client.email.toLowerCase()
                );

                return (
                  <tr key={client.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center text-xs">
                          {client.full_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <span className="font-semibold text-white block">{client.full_name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{client.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {client.company_name || 'Individual'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="block text-slate-200">{client.email}</span>
                      <span className="text-[10px]">{client.phone || 'No phone'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {clientReqs.length} req
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {clientPrjs.length} prj
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Detail Drawer Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Client Profile Inspection</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">Full Name</span>
                <span className="text-sm font-bold text-white">{selectedClient.full_name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase">Email</span>
                  <span className="text-slate-200">{selectedClient.email}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase">Phone</span>
                  <span className="text-slate-200">{selectedClient.phone || 'N/A'}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">Company</span>
                <span className="text-slate-200">{selectedClient.company_name || 'Individual'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">Role Authorization</span>
                <span className="font-semibold text-violet-400 uppercase">{selectedClient.role}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedClient(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
