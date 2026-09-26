import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Image, Plus, Edit2, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { dataService } from '../../services/store';
import { PortfolioItem } from '../../types';
import { SEO } from '../../components/common/SEO';

export const AdminPortfolioPage: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadPortfolio = async () => {
    setIsLoading(true);
    try {
      const data = await dataService.getPortfolio(false); // all
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleTogglePublish = async (item: PortfolioItem) => {
    await dataService.savePortfolio({ ...item, published: !item.published });
    loadPortfolio();
  };

  const handleDelete = async (item: PortfolioItem) => {
    if (window.confirm(`Delete case study "${item.title}"?`)) {
      await dataService.deletePortfolio(item.id);
      loadPortfolio();
    }
  };

  const filtered = items.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <SEO title="Portfolio Showcase Management | VyapaarPro Admin" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio Case Studies</h1>
          <p className="text-xs text-slate-400 mt-1">
            Showcase successful digital transformations, applications, and client outcomes.
          </p>
        </div>

        <Link
          to="/admin/portfolio/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-600/20 transition self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Case Study</span>
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search case studies..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Case Study</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Client Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center space-x-3">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-10 h-8 rounded-lg object-cover shrink-0 bg-slate-950"
                      />
                      <div>
                        <span className="block">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">/{item.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{item.category}</td>
                  <td className="py-3.5 px-4 text-slate-400">{item.client_type}</td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleTogglePublish(item)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center space-x-1 cursor-pointer ${
                        item.published
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{item.published ? 'Live' : 'Draft'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link
                      to={`/admin/portfolio/${item.id}`}
                      className="inline-flex p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
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
