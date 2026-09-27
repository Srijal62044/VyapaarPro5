import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Save,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { StoreCategory } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { SEO } from '../../components/common/SEO';

export const AdminStoreCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalSlug, setModalSlug] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalOrder, setModalOrder] = useState<number>(0);
  const [modalActive, setModalActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await storeDataService.getCategories(false);
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setModalName('');
    setModalSlug('');
    setModalDesc('');
    setModalOrder(categories.length + 1);
    setModalActive(true);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: StoreCategory) => {
    setEditingCategory(cat);
    setModalName(cat.name);
    setModalSlug(cat.slug);
    setModalDesc(cat.description || '');
    setModalOrder(cat.sort_order || 0);
    setModalActive(cat.is_active);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setModalName(val);
    if (!editingCategory) {
      setModalSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSaving(true);

    try {
      if (!modalName.trim()) throw new Error('Category name is required.');
      if (!modalSlug.trim()) throw new Error('Category slug is required.');

      if (editingCategory) {
        await storeDataService.updateCategory(editingCategory.id, {
          name: modalName.trim(),
          slug: modalSlug.toLowerCase().trim(),
          description: modalDesc.trim() || undefined,
          sort_order: modalOrder,
          is_active: modalActive,
        });
        setSuccessMessage('Category updated successfully!');
      } else {
        await storeDataService.createCategory({
          name: modalName.trim(),
          slug: modalSlug.toLowerCase().trim(),
          description: modalDesc.trim() || undefined,
          sort_order: modalOrder,
          is_active: modalActive,
        });
        setSuccessMessage('Category created successfully!');
      }

      setIsModalOpen(false);
      loadCategories();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to save category:', err);
      setErrorMessage(err.message || 'Error saving category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (cat: StoreCategory) => {
    try {
      await storeDataService.updateCategory(cat.id, { is_active: !cat.is_active });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !cat.is_active } : c))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update category status');
    }
  };

  const handleDeleteCategory = async (cat: StoreCategory) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      await storeDataService.deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setSuccessMessage('Category deleted.');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Store Categories | VyapaarPro Admin" description="Manage store taxonomy and product categories." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <Link to="/admin/store" className="hover:text-white">Store</Link>
            <span>/</span>
            <span className="text-violet-400">Categories</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Layers className="w-6 h-6 text-violet-400" />
            <span>Store Categories</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadCategories}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading categories...</p>
        </div>
      ) : categories.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Slug</th>
                <th className="py-3 px-4 font-semibold">Sort Order</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white block">{c.name}</span>
                    {c.description && (
                      <span className="text-[11px] text-slate-400">{c.description}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{c.slug}</td>
                  <td className="py-3.5 px-4 text-slate-300">{c.sort_order}</td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        c.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-slate-800"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-md mx-auto">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Categories Created Yet</h3>
          <p className="text-xs text-slate-400">
            Create product categories to organize your digital assets for public store customers.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Category</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">
                {editingCategory ? 'Edit Store Category' : 'New Store Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Starter Kits"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Slug <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalSlug}
                  onChange={(e) => setModalSlug(e.target.value)}
                  placeholder="starter-kits"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  placeholder="Brief description for SEO & filters..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={modalOrder}
                    onChange={(e) => setModalOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="flex items-center pt-5 space-x-2">
                  <input
                    type="checkbox"
                    id="modalActive"
                    checked={modalActive}
                    onChange={(e) => setModalActive(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-violet-600 focus:ring-violet-500 h-4 w-4"
                  />
                  <label htmlFor="modalActive" className="text-slate-300 cursor-pointer">
                    Active in Store
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
