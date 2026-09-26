import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Search,
  CheckCircle,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { ServiceItem } from '../../types';
import { SEO } from '../../components/common/SEO';

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getServices(false); // all, including unpublished
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleTogglePublished = async (service: ServiceItem) => {
    await dataService.saveService({ ...service, published: !service.published });
    setActionNotice(`Service "${service.name}" ${!service.published ? 'Published' : 'Unpublished'}`);
    loadServices();
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleToggleFeatured = async (service: ServiceItem) => {
    await dataService.saveService({ ...service, featured: !service.featured });
    setActionNotice(`Service "${service.name}" ${!service.featured ? 'Featured' : 'Unfeatured'}`);
    loadServices();
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleDelete = async (service: ServiceItem) => {
    if (window.confirm(`Are you sure you want to delete service "${service.name}"?`)) {
      await dataService.deleteService(service.id);
      setActionNotice(`Service "${service.name}" deleted.`);
      loadServices();
      setTimeout(() => setActionNotice(''), 3000);
    }
  };

  const filtered = services.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.category_name && s.category_name.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <SEO title="Service Catalogue Management | VyapaarPro Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Service Catalogue Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, edit, price, publish/unpublish, and feature agency services. Changes appear immediately on the public website.
          </p>
        </div>

        <Link
          to="/admin/services/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-600/20 transition self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </Link>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search service title or category..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Pricing Model</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Featured</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filtered.map((service) => (
                <tr key={service.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center space-x-3">
                      <img
                        src={service.thumbnail_url || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'}
                        alt={service.name}
                        className="w-8 h-8 rounded-lg object-cover shrink-0 bg-slate-950"
                      />
                      <div>
                        <span className="block">{service.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">/{service.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {service.category_name || 'General'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-300">
                      {service.pricing_model}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    {service.pricing_model === 'CUSTOM_QUOTE'
                      ? 'Quote Based'
                      : `₹${service.price.toLocaleString('en-IN')}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleTogglePublished(service)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center space-x-1 cursor-pointer ${
                        service.published
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {service.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{service.published ? 'Published' : 'Draft'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleFeatured(service)}
                      className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${
                        service.featured ? 'text-amber-400' : 'text-slate-600'
                      }`}
                      title={service.featured ? 'Featured on homepage' : 'Not featured'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link
                      to={`/admin/services/${service.id}`}
                      className="inline-flex p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Edit Service"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(service)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
