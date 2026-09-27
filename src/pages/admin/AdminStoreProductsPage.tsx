import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { StoreProduct, StoreCategory, StoreProductStatus } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { SEO } from '../../components/common/SEO';

export const AdminStoreProductsPage: React.FC = () => {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        storeDataService.getProducts({ includeAllStatuses: true }),
        storeDataService.getCategories(false),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load store products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (product: StoreProduct) => {
    const nextStatus: StoreProductStatus =
      product.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await storeDataService.updateProduct(product.id, { status: nextStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Error updating status');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete or archive product "${name}"?`)) {
      return;
    }
    try {
      await storeDataService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error('Failed to delete product:', err);
      alert(err.message || 'Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'all' && p.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.short_description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <SEO title="Digital Store Products | VyapaarPro Admin" description="Manage digital templates, prices, and downloads." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <Link to="/admin/store" className="hover:text-white">Store</Link>
            <span>/</span>
            <span className="text-violet-400">Products</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Package className="w-6 h-6 text-violet-400" />
            <span>Store Products Catalogue</span>
          </h1>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/store/products/new"
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title, slug..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto overflow-x-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading products...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">File Attached</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProducts.map((p) => {
                  const priceRupees = Math.round(p.price_paise / 100);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-8 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                            {p.thumbnail_url ? (
                              <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-600">
                                No Img
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white block hover:text-violet-300">
                              <Link to={`/admin/store/products/${p.id}`}>{p.name}</Link>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">/store/{p.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {p.category_name || '—'}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white">₹{priceRupees.toLocaleString('en-IN')}</span>
                      </td>

                      {/* File Attached */}
                      <td className="py-3.5 px-4">
                        {p.product_file_path ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Attached</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-400">No file</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : p.status === 'ARCHIVED'
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                        >
                          {p.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/store/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                            title="View on Live Store"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/admin/store/products/${p.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-slate-800"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-md mx-auto">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Products Found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'No products match your current filter criteria.'
              : 'You have not added any digital products to the store yet.'}
          </p>
          <Link
            to="/admin/store/products/new"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Product</span>
          </Link>
        </div>
      )}
    </div>
  );
};
