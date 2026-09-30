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
  Code,
  FileCode,
  Share2,
} from 'lucide-react';
import { StoreProduct, StoreCategory, StoreProductStatus, isDigitalProduct } from '../../types';
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
        storeDataService.getDigitalProducts({ includeAllStatuses: true }),
        storeDataService.getCategories(false, 'DIGITAL_PRODUCT'),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load digital store products:', err);
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
            <span className="text-violet-400">Digital Products</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Code className="w-6 h-6 text-violet-400" />
            <span>Digital Products & Software Catalogue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Exclusive catalogue for downloadable files, source code templates, and SaaS starter boilerplates.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/admin/store/social-services"
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Share2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Social Services</span>
          </Link>
          <Link
            to="/admin/store/products/new"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Digital Product</span>
          </Link>
        </div>
      </div>

      {/* Category Type Notice Bar */}
      <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 text-xs text-purple-300">
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 font-bold uppercase text-[10px]">
            Digital Products Scope
          </span>
          <span>Only downloadable digital files and code items appear here. Social media services are managed separately.</span>
        </div>
        <span className="text-xs font-mono font-bold text-purple-300">
          {products.length} Item{products.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search digital products by title, slug..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto overflow-x-auto">
          {/* Category Filter */}
          {categories.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Digital Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

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
          <p className="text-xs text-slate-400">Loading digital products...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Product Name</th>
                  <th className="py-3 px-4 font-semibold">Catalog Category</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">File / Delivery Access</th>
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
                                <Code className="w-4 h-4 text-purple-400" />
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Digital Product
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white">₹{priceRupees.toLocaleString('en-IN')}</span>
                      </td>

                      {/* File Attached */}
                      <td className="py-3.5 px-4">
                        {p.file_name || p.product_file_path ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{p.file_name || 'Attached ZIP'}</span>
                          </span>
                        ) : p.access_link ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] text-sky-400 font-mono">
                            <ExternalLink className="w-3 h-3" />
                            <span>Access URL</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-400">License / Notes</span>
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
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="View on Storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/admin/store/products/${p.id}`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition cursor-pointer"
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
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
          <Package className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Digital Products Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No products matched your search query.'
              : 'Add your first full-stack digital product, SaaS starter kit, or code boilerplate.'}
          </p>
          <Link
            to="/admin/store/products/new"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Digital Product</span>
          </Link>
        </div>
      )}
    </div>
  );
};
