import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  Plus,
  Search,
  SlidersHorizontal,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  RefreshCw,
  Clock,
  Sparkles,
  Zap,
  Save,
  Eye,
  ShieldCheck,
  ChevronRight,
  Filter,
  ArrowUp,
  ArrowDown,
  Layers,
  Settings2,
  ListPlus,
  HelpCircle,
} from 'lucide-react';
import {
  StoreProduct,
  StoreProductStatus,
  StoreCategory,
  SocialServiceFieldConfig,
  SocialFieldType,
  isSocialService,
} from '../../types';
import { storeDataService, isValidUUID } from '../../services/storeDataService';
import { getDefaultFieldsForService } from '../../services/socialServiceFields';
import { SEO } from '../../components/common/SEO';
import { ServiceThumbnail } from '../../components/common/ServiceThumbnail';
import { ServiceThumbnailUrlField } from '../../components/admin/ServiceThumbnailUrlField';
import { validateThumbnailUrl } from '../../utils/thumbnailValidation';

interface PlatformOption {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
}

const PLATFORMS: PlatformOption[] = [
  { id: 'all', name: 'All Platforms', color: 'text-white', badgeBg: 'bg-slate-800' },
  { id: 'instagram', name: 'Instagram', color: 'text-pink-400', badgeBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { id: 'youtube', name: 'YouTube', color: 'text-red-400', badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { id: 'facebook', name: 'Facebook', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'twitter', name: 'X / Twitter', color: 'text-sky-400', badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { id: 'telegram', name: 'Telegram', color: 'text-cyan-400', badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { id: 'tiktok', name: 'TikTok', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { id: 'threads', name: 'Threads', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'snapchat', name: 'Snapchat', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'pinterest', name: 'Pinterest', color: 'text-red-400', badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { id: 'linkedin', name: 'LinkedIn', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'discord', name: 'Discord', color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'spotify', name: 'Spotify', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
];

export const AdminStoreSocialServicesPage: React.FC = () => {
  const [services, setServices] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PUBLISHED' | 'DRAFT'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Quick edit state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  // Modal State for Add / Full Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalService, setModalService] = useState<Partial<StoreProduct> | null>(null);
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        storeDataService.getSocialServices({ includeAllStatuses: true }),
        storeDataService.getCategories(false, 'SOCIAL_SERVICE'),
      ]);
      setServices(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load social services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Status Toggle
  const handleToggleStatus = async (service: StoreProduct) => {
    const nextStatus: StoreProductStatus = service.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await storeDataService.updateProduct(service.id, { status: nextStatus });
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, status: nextStatus } : s))
      );
      showFeedback('success', `Service "${service.name}" is now ${nextStatus === 'PUBLISHED' ? 'Active in Store' : 'Inactive (Draft)'}`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to toggle status');
    }
  };

  // Quick Price Save
  const handleSavePrice = async (service: StoreProduct) => {
    const val = parseFloat(editingPriceValue);
    if (isNaN(val) || val < 0) {
      showFeedback('error', 'Please enter a valid price');
      return;
    }
    const newPricePaise = Math.round(val * 100);
    setIsSavingPrice(true);
    try {
      await storeDataService.updateProduct(service.id, { price_paise: newPricePaise });
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, price_paise: newPricePaise } : s))
      );
      setEditingPriceId(null);
      showFeedback('success', `Price for "${service.name}" updated to ₹${val}`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to update price');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Delete service
  const handleDelete = async (service: StoreProduct) => {
    if (!window.confirm(`Are you sure you want to delete "${service.name}"?`)) return;
    try {
      await storeDataService.deleteProduct(service.id);
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      showFeedback('success', `Deleted service "${service.name}"`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to delete service');
    }
  };

  // Duplicate service
  const handleDuplicate = async (service: StoreProduct) => {
    try {
      const copyPayload: Omit<StoreProduct, 'id' | 'created_at' | 'updated_at'> = {
        category_id: service.category_id,
        name: `${service.name} (Copy)`,
        slug: `${service.slug}-copy-${Date.now().toString().slice(-4)}`,
        short_description: service.short_description,
        description: service.description,
        price_paise: service.price_paise,
        compare_at_price_paise: service.compare_at_price_paise,
        platform: service.platform,
        service_type: service.service_type,
        min_quantity: service.min_quantity,
        max_quantity: service.max_quantity,
        delivery_time_info: service.delivery_time_info,
        instructions: service.instructions,
        access_info: service.access_info,
        delivery_notes: service.delivery_notes,
        thumbnail_url: service.thumbnail_url || null,
        status: 'DRAFT',
        featured: false,
        sort_order: (service.sort_order || 0) + 1,
      };

      const created = await storeDataService.createProduct(copyPayload);
      setServices((prev) => [created, ...prev]);
      showFeedback('success', `Duplicated "${service.name}" as a draft`);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to duplicate service');
    }
  };

  // Open Edit / Add Modal
  const openEditModal = (service?: StoreProduct) => {
    if (service) {
      const defaultFields = getDefaultFieldsForService(service);
      const fields =
        service.ordering_fields && service.ordering_fields.length > 0
          ? [...service.ordering_fields]
          : defaultFields;

      // Find matching category from categories list
      const matchedCat = categories.find(
        (c) => c.id === service.category_id || c.slug === service.platform
      );

      setModalService({
        ...service,
        category_id: matchedCat?.id || (isValidUUID(service.category_id) ? service.category_id : null),
        category_name: matchedCat?.name || service.category_name,
        name: service.name || '',
        slug: service.slug || '',
        platform: service.platform || 'instagram',
        service_type: service.service_type || '',
        short_description: service.short_description || '',
        description: service.description || service.short_description || '',
        price_paise: service.price_paise !== undefined ? service.price_paise : 0,
        compare_at_price_paise: service.compare_at_price_paise || null,
        min_quantity: service.min_quantity !== undefined ? service.min_quantity : 100,
        max_quantity: service.max_quantity !== undefined ? service.max_quantity : 10000,
        delivery_time_info: service.delivery_time_info || '',
        instructions: service.instructions || '',
        access_info: service.access_info || '',
        delivery_notes: service.delivery_notes || '',
        thumbnail_url: service.thumbnail_url || '',
        ordering_fields: fields,
        status: service.status || 'PUBLISHED',
        featured: Boolean(service.featured),
      });
    } else {
      const initialPlat = selectedPlatform !== 'all' ? selectedPlatform.replace(/^cat-/, '') : 'instagram';
      const matchedCat = categories.find((c) => c.slug === initialPlat);
      const initialFields = getDefaultFieldsForService({
        platform: initialPlat,
        service_type: 'followers',
        name: 'New Service',
      });
      setModalService({
        name: '',
        slug: '',
        platform: initialPlat,
        category_id: matchedCat?.id || null,
        category_name: matchedCat?.name,
        service_type: 'followers',
        short_description: '',
        description: '',
        price_paise: 19900,
        compare_at_price_paise: 39900,
        thumbnail_url: '',
        min_quantity: 100,
        max_quantity: 10000,
        delivery_time_info: 'Instant • 10-30 Mins',
        instructions: 'Provide direct link/username.',
        access_info: 'Natural high-retention delivery pacing.',
        delivery_notes: '100% safe & password-free.',
        status: 'PUBLISHED',
        featured: false,
        sort_order: 10,
        ordering_fields: initialFields,
      });
    }
    setIsModalOpen(true);
  };

  // Dynamic ordering field helpers
  const handleAddField = () => {
    if (!modalService) return;
    const currentFields = modalService.ordering_fields || [];
    const newField: SocialServiceFieldConfig = {
      field_key: `field_${Date.now().toString().slice(-4)}`,
      label: 'Target URL / Username',
      field_type: 'url',
      placeholder: 'https://...',
      help_text: '',
      required: true,
      display_order: currentFields.length + 1,
    };
    setModalService({
      ...modalService,
      ordering_fields: [...currentFields, newField],
    });
  };

  const handleUpdateField = (index: number, updates: Partial<SocialServiceFieldConfig>) => {
    if (!modalService || !modalService.ordering_fields) return;
    const nextFields = [...modalService.ordering_fields];
    nextFields[index] = { ...nextFields[index], ...updates };
    setModalService({
      ...modalService,
      ordering_fields: nextFields,
    });
  };

  const handleDeleteField = (index: number) => {
    if (!modalService || !modalService.ordering_fields) return;
    const nextFields = modalService.ordering_fields.filter((_, idx) => idx !== index);
    setModalService({
      ...modalService,
      ordering_fields: nextFields,
    });
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!modalService || !modalService.ordering_fields) return;
    const fields = [...modalService.ordering_fields];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;
    fields.forEach((f, idx) => {
      f.display_order = idx + 1;
    });
    setModalService({
      ...modalService,
      ordering_fields: fields,
    });
  };

  const handleResetToPlatformDefaults = () => {
    if (!modalService) return;
    const defaults = getDefaultFieldsForService(modalService as any);
    setModalService({
      ...modalService,
      ordering_fields: defaults,
    });
    showFeedback('success', `Reset fields to standard platform defaults for ${modalService.platform || 'service'}`);
  };

  // Save Modal Form
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalService || !modalService.name || !modalService.slug) {
      showFeedback('error', 'Please fill in service name and unique slug');
      return;
    }

    // Validate external thumbnail URL if provided
    if (modalService.thumbnail_url && modalService.thumbnail_url.trim()) {
      const validation = validateThumbnailUrl(modalService.thumbnail_url);
      if (!validation.isValid) {
        showFeedback('error', validation.error || 'Invalid thumbnail image URL');
        return;
      }
      modalService.thumbnail_url = validation.sanitizedUrl || null;
    } else {
      modalService.thumbnail_url = null;
    }

    setIsSavingModal(true);
    try {
      if (modalService.id) {
        // Update existing
        const updated = await storeDataService.updateProduct(modalService.id, modalService);
        setServices((prev) =>
          prev.map((s) => (s.id === updated.id || s.slug === updated.slug ? { ...s, ...updated } : s))
        );
        showFeedback('success', `Saved service "${updated.name}" with ${updated.ordering_fields?.length || 0} ordering field(s)`);
      } else {
        // Create new
        const created = await storeDataService.createProduct(modalService as any);
        setServices((prev) => [created, ...prev]);
        showFeedback('success', `Created new service "${created.name}"`);
      }
      setIsModalOpen(false);
      setModalService(null);
    } catch (err: any) {
      showFeedback('error', err.message || 'Failed to save service');
    } finally {
      setIsSavingModal(false);
    }
  };

  // Filtered services
  const filteredServices = services.filter((s) => {
    // Strictly ensure only social services are evaluated
    if (!isSocialService(s)) return false;

    if (selectedPlatform !== 'all') {
      const target = selectedPlatform.toLowerCase().replace(/^cat-/, '');
      const plat = (s.platform || '').toLowerCase();
      const cat = (s.category_id || '').toLowerCase().replace(/^cat-/, '');
      const catName = (s.category_name || '').toLowerCase();
      const slug = (s.slug || '').toLowerCase();

      const matches =
        plat === target ||
        (target === 'twitter' && (plat === 'x' || plat === 'twitter')) ||
        (target === 'x' && (plat === 'x' || plat === 'twitter')) ||
        cat === target ||
        catName.includes(target) ||
        slug.startsWith(target) ||
        slug.includes(target);

      if (!matches) return false;
    }
    if (statusFilter !== 'all' && s.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.short_description.toLowerCase().includes(q) ||
        (s.platform && s.platform.toLowerCase().includes(q)) ||
        (s.service_type && s.service_type.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = services.filter((s) => s.status === 'PUBLISHED').length;
  const draftCount = services.filter((s) => s.status !== 'PUBLISHED').length;
  const platformsCount = new Set(services.map((s) => s.platform).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <SEO
        title="Social Media Services Management | VyapaarPro Admin"
        description="Manage social media growth services, live pricing, platform catalogs, and delivery limits."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <Link to="/admin/store" className="hover:text-white">Store</Link>
            <span>/</span>
            <span className="text-violet-400 font-semibold">Social Media Services</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center space-x-2">
            <Share2 className="w-6 h-6 text-violet-400" />
            <span>Social Media Growth Services</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pre-populated live database catalog for Instagram, YouTube, Facebook, X, Telegram, TikTok, and more.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={loadServices}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Refresh Services Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 border transition ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Catalog Services</span>
          <p className="text-2xl font-black text-white">{services.length}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Editable in database</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Active on Store</span>
          <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Visible to customers</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">Draft / Disabled</span>
          <p className="text-2xl font-black text-amber-400">{draftCount}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Hidden from store</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 block mb-1">Platforms Supported</span>
          <p className="text-2xl font-black text-violet-300">{platformsCount}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Social & content networks</span>
        </div>
      </div>

      {/* Platform Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {PLATFORMS.map((plat) => {
          const isSelected = selectedPlatform === plat.id;
          const count = plat.id === 'all'
            ? services.length
            : services.filter((s) => s.platform === plat.id || s.category_id?.includes(plat.id)).length;

          return (
            <button
              key={plat.id}
              onClick={() => setSelectedPlatform(plat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{plat.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-violet-800 text-violet-200' : 'bg-slate-800 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Status Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, platform, type..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="PUBLISHED">Active (Published)</option>
            <option value="DRAFT">Disabled (Draft)</option>
          </select>

          <Link
            to="/store"
            target="_blank"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center space-x-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Public Store</span>
          </Link>
        </div>
      </div>

      {/* Services Table / Cards */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading social media services catalog...</p>
        </div>
      ) : filteredServices.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Platform & Service</th>
                  <th className="px-5 py-3.5">Price (₹)</th>
                  <th className="px-5 py-3.5">Limits & Speed</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredServices.map((service) => {
                  const priceRupees = Math.round(service.price_paise / 100);
                  const isEditingPrice = editingPriceId === service.id;
                  const platformConfig = PLATFORMS.find((p) => p.id === (service.platform || 'digital'));

                  return (
                    <tr key={service.id} className="hover:bg-slate-800/40 transition">
                      {/* 1. Thumbnail, Platform & Title */}
                      <td className="px-5 py-4 max-w-sm">
                        <div className="flex items-start space-x-3.5">
                          <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mt-0.5">
                            <ServiceThumbnail
                              src={service.thumbnail_url}
                              alt={service.name}
                              platform={service.platform}
                              size="xs"
                              aspectRatio="square"
                              className="w-full h-full"
                            />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${platformConfig?.badgeBg || 'bg-slate-800 text-slate-300'}`}>
                                {service.platform || 'General'}
                              </span>
                              {service.featured && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-white font-semibold text-sm leading-snug line-clamp-1">{service.name}</p>
                            <p className="text-slate-400 text-[11px] line-clamp-1">{service.short_description}</p>
                            <div className="flex items-center space-x-2 pt-1 text-[10px] text-slate-400">
                              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300 font-mono">
                                <Layers className="w-3 h-3 text-indigo-400" />
                                <span>{(service.ordering_fields && service.ordering_fields.length) || getDefaultFieldsForService(service).length} Fields</span>
                              </span>
                              {service.min_quantity && (
                                <span>Min: {service.min_quantity.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Price with Instant Edit */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isEditingPrice ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              value={editingPriceValue}
                              onChange={(e) => setEditingPriceValue(e.target.value)}
                              className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-violet-500 text-white font-bold text-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSavePrice(service)}
                              disabled={isSavingPrice}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                              title="Save Price"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPriceId(null)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              title="Cancel"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div>
                              <p className="text-sm font-extrabold text-white">₹{priceRupees}</p>
                              {service.compare_at_price_paise && (
                                <p className="text-[10px] text-slate-500 line-through">
                                  ₹{Math.round(service.compare_at_price_paise / 100)}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEditingPriceId(service.id);
                                setEditingPriceValue(priceRupees.toString());
                              }}
                              className="p-1 text-slate-500 hover:text-violet-400 transition cursor-pointer"
                              title="Quick edit price"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 3. Limits & Speed */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="space-y-1 text-[11px]">
                          <p className="text-slate-300">
                            Min: <span className="font-semibold text-white">{service.min_quantity ?? '1'}</span> • Max:{' '}
                            <span className="font-semibold text-white">
                              {service.max_quantity ? service.max_quantity.toLocaleString() : 'Unlimited'}
                            </span>
                          </p>
                          <p className="text-slate-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span>{service.delivery_time_info || 'Instant Processing'}</span>
                          </p>
                        </div>
                      </td>

                      {/* 4. Status Toggle */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(service)}
                          className={`px-3 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                            service.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {service.status === 'PUBLISHED' ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>ACTIVE</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              <span>INACTIVE</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 5. Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openEditModal(service)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-violet-600/20 text-slate-300 hover:text-violet-300 transition cursor-pointer"
                            title="Edit Service Details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(service)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 transition cursor-pointer"
                            title="Duplicate Service"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Delete Service"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <p className="text-slate-400 text-xs">No services found matching the selected platform or search filters.</p>
          <button
            onClick={() => {
              setSelectedPlatform('all');
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && modalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-violet-400 font-bold uppercase tracking-wider block">
                  {modalService.id ? 'Edit Service' : 'New Service Specification'}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {modalService.id ? `Edit ${modalService.name}` : 'Add Social Media Growth Service'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Platform */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Platform *
                  </label>
                  <select
                    value={modalService.platform || 'instagram'}
                    onChange={(e) => {
                      const plat = e.target.value;
                      const matchedCat = categories.find((c) => c.slug === plat);
                      setModalService({
                        ...modalService,
                        platform: plat,
                        category_id: matchedCat?.id || null,
                        category_name: matchedCat?.name,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  >
                    {PLATFORMS.filter((p) => p.id !== 'all').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Service Type
                  </label>
                  <input
                    type="text"
                    value={modalService.service_type || ''}
                    onChange={(e) => setModalService({ ...modalService, service_type: e.target.value })}
                    placeholder="e.g. followers, likes, views, subscribers"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Service Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Service Title *
                </label>
                <input
                  type="text"
                  value={modalService.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoSlug = !modalService.id ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : modalService.slug;
                    setModalService({ ...modalService, name, slug: autoSlug });
                  }}
                  placeholder="e.g. Instagram Followers (HQ Real & Non-Drop)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Unique Slug *
                </label>
                <input
                  type="text"
                  value={modalService.slug || ''}
                  onChange={(e) => setModalService({ ...modalService, slug: e.target.value.toLowerCase().trim() })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Pricing in Rupees */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Price in INR (₹) *
                  </label>
                  <input
                    type="number"
                    value={modalService.price_paise !== undefined ? Math.round(modalService.price_paise / 100) : ''}
                    onChange={(e) =>
                      setModalService({
                        ...modalService,
                        price_paise: Math.round(parseFloat(e.target.value || '0') * 100),
                      })
                    }
                    required
                    min="1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Compare At Price in INR (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    value={modalService.compare_at_price_paise ? Math.round(modalService.compare_at_price_paise / 100) : ''}
                    onChange={(e) =>
                      setModalService({
                        ...modalService,
                        compare_at_price_paise: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null,
                      })
                    }
                    placeholder="e.g. 399"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Quantities & Speed */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Min Quantity
                  </label>
                  <input
                    type="number"
                    value={modalService.min_quantity || ''}
                    onChange={(e) => setModalService({ ...modalService, min_quantity: parseInt(e.target.value) || 1 })}
                    placeholder="100"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Max Quantity
                  </label>
                  <input
                    type="number"
                    value={modalService.max_quantity || ''}
                    onChange={(e) => setModalService({ ...modalService, max_quantity: parseInt(e.target.value) || 10000 })}
                    placeholder="100000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Delivery Speed
                  </label>
                  <input
                    type="text"
                    value={modalService.delivery_time_info || ''}
                    onChange={(e) => setModalService({ ...modalService, delivery_time_info: e.target.value })}
                    placeholder="Instant • 10-30 Mins"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Short Description
                </label>
                <input
                  type="text"
                  value={modalService.short_description || ''}
                  onChange={(e) => setModalService({ ...modalService, short_description: e.target.value })}
                  placeholder="High-quality non-drop Instagram followers with profile photos and bios."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Thumbnail URL (External Image Link Only - Zero Supabase Storage) */}
              <ServiceThumbnailUrlField
                value={modalService.thumbnail_url || ''}
                onChange={(url) => setModalService({ ...modalService, thumbnail_url: url })}
                platform={modalService.platform}
                label="Thumbnail URL"
                placeholder="https://example.com/service-thumbnail.jpg"
              />

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Instructions for Customer
                </label>
                <textarea
                  rows={2}
                  value={modalService.instructions || ''}
                  onChange={(e) => setModalService({ ...modalService, instructions: e.target.value })}
                  placeholder="1. Provide your public profile link.\n2. Ensure account is set to PUBLIC."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Service Description
                </label>
                <textarea
                  rows={3}
                  value={modalService.description || ''}
                  onChange={(e) => setModalService({ ...modalService, description: e.target.value })}
                  placeholder="Comprehensive service details, feature highlights, and terms."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Access Info & Delivery Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Access Info / Delivery Pacing
                  </label>
                  <input
                    type="text"
                    value={modalService.access_info || ''}
                    onChange={(e) => setModalService({ ...modalService, access_info: e.target.value })}
                    placeholder="e.g. Natural high-retention delivery pacing."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Delivery Notes / Guarantee Info
                  </label>
                  <input
                    type="text"
                    value={modalService.delivery_notes || ''}
                    onChange={(e) => setModalService({ ...modalService, delivery_notes: e.target.value })}
                    placeholder="e.g. 100% safe & password-free."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* 3. DYNAMIC ORDERING FIELDS CONFIGURATION BUILDER */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-violet-400" />
                      <span>Customer Ordering Fields Configuration</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fields dynamically displayed to customers at checkout (URLs, handles, instructions).
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleResetToPlatformDefaults}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1"
                      title="Load recommended default fields for this platform & service"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-400" />
                      <span>Load Defaults</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 shadow-sm"
                    >
                      <ListPlus className="w-3 h-3" />
                      <span>Add Field</span>
                    </button>
                  </div>
                </div>

                {/* Field List Cards */}
                {modalService.ordering_fields && modalService.ordering_fields.length > 0 ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {modalService.ordering_fields.map((field, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3 relative group"
                      >
                        {/* Header of Field */}
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                              {field.label || 'Untitled Field'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-900 text-slate-400 border border-slate-800">
                              {field.field_type}
                            </span>
                            {field.required && (
                              <span className="text-[9px] font-bold text-rose-400">Required</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleMoveField(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Move up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveField(idx, 'down')}
                              disabled={idx === (modalService.ordering_fields?.length || 0) - 1}
                              className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                              title="Move down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteField(idx)}
                              className="p-1 rounded text-rose-400 hover:text-rose-300 cursor-pointer ml-1"
                              title="Delete field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Field Configuration Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Label */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Field Label *
                            </label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                              placeholder="e.g. Instagram Profile Link or Username"
                              required
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          {/* Field Type */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Field Type *
                            </label>
                            <select
                              value={field.field_type}
                              onChange={(e) => handleUpdateField(idx, { field_type: e.target.value as any })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                            >
                              <option value="url">URL (Link)</option>
                              <option value="text">Text (Single Line / Username)</option>
                              <option value="textarea">Long Text (Textarea / Multi-line)</option>
                              <option value="number">Number</option>
                              <option value="select">Dropdown / Select</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                          </div>

                          {/* Field Key */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Internal Key (name) *
                            </label>
                            <input
                              type="text"
                              value={field.field_key}
                              onChange={(e) => handleUpdateField(idx, { field_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                              placeholder="target_url"
                              required
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          {/* Placeholder */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Placeholder Text
                            </label>
                            <input
                              type="text"
                              value={field.placeholder || ''}
                              onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                              placeholder="https://instagram.com/username"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          {/* Validation Rule */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Validation Rule
                            </label>
                            <select
                              value={field.validation_rule || 'none'}
                              onChange={(e) => handleUpdateField(idx, { validation_rule: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                            >
                              <option value="none">Standard Check</option>
                              <option value="url">Valid Web URL (http/https)</option>
                              <option value="instagram_profile">Instagram Profile / Handle</option>
                              <option value="youtube_channel">YouTube Channel Link</option>
                              <option value="twitter_handle">X / Twitter Handle</option>
                            </select>
                          </div>

                          {/* Help Text */}
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Help Text / Hint for Customer
                            </label>
                            <input
                              type="text"
                              value={field.help_text || ''}
                              onChange={(e) => handleUpdateField(idx, { help_text: e.target.value })}
                              placeholder="Ensure account is public during processing. No passwords required."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-violet-500"
                            />
                          </div>

                          {/* Required Toggle */}
                          <div className="flex items-center pt-5">
                            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                                className="rounded border-slate-800 bg-slate-900 text-violet-600 focus:ring-violet-500"
                              />
                              <span className="font-semibold text-white">Compulsory Field</span>
                            </label>
                          </div>

                          {/* If select: Dropdown Options */}
                          {field.field_type === 'select' && (
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                Dropdown Options (Comma-separated)
                              </label>
                              <input
                                type="text"
                                value={field.options ? field.options.join(', ') : ''}
                                onChange={(e) =>
                                  handleUpdateField(idx, {
                                    options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                                  })
                                }
                                placeholder="Like, Love, Care, Wow, Haha"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
                    <p className="text-xs text-slate-400">No custom ordering fields configured for this service.</p>
                    <button
                      type="button"
                      onClick={handleResetToPlatformDefaults}
                      className="px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 text-xs font-semibold hover:bg-violet-600/30 transition cursor-pointer"
                    >
                      Click to load recommended fields for {modalService.platform || 'this platform'}
                    </button>
                  </div>
                )}
              </div>

              {/* Status & Featured */}
              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalService.status === 'PUBLISHED'}
                    onChange={(e) =>
                      setModalService({
                        ...modalService,
                        status: e.target.checked ? 'PUBLISHED' : 'DRAFT',
                      })
                    }
                    className="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                  />
                  <span>Active & Live in Store (Published)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!modalService.featured}
                    onChange={(e) =>
                      setModalService({
                        ...modalService,
                        featured: e.target.checked,
                      })
                    }
                    className="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-500"
                  />
                  <span>Featured Badge</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingModal}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition cursor-pointer"
                >
                  {isSavingModal ? 'Saving Service...' : 'Save & Publish Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
