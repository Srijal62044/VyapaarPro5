import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { dataService } from '../../services/store';
import { PricingModel, ServiceCategory, ServiceItem } from '../../types';
import { SEO } from '../../components/common/SEO';
import { ServiceThumbnailUrlField } from '../../components/admin/ServiceThumbnailUrlField';
import { validateThumbnailUrl } from '../../utils/thumbnailValidation';

export const AdminServiceEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [pricingModel, setPricingModel] = useState<PricingModel>('STARTING_FROM');
  const [price, setPrice] = useState<number>(14999);
  const [timeline, setTimeline] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);

  const [deliverables, setDeliverables] = useState<string[]>([
    'Custom Designed Interfaces',
    'Mobile Responsive Optimization',
    '1 Month Dedicated Support',
  ]);
  const [newDeliverable, setNewDeliverable] = useState('');

  const [features, setFeatures] = useState<{ id: string; title: string; description: string }[]>([
    { id: '1', title: 'High Performance', description: 'Clean architecture with 90+ PageSpeed' },
  ]);
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');

  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string }[]>([]);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const cats = await dataService.getCategories();
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }

        if (!isNew && id) {
          const s = await dataService.getServiceById(id);
          if (s) {
            setName(s.name);
            setSlug(s.slug);
            setCategoryId(s.category_id || (cats[0]?.id ?? ''));
            setShortDesc(s.short_description);
            setDescription(s.description);
            setPricingModel(s.pricing_model);
            setPrice(s.price);
            setTimeline(s.timeline || '');
            setThumbnailUrl(s.thumbnail_url || '');
            setDemoUrl(s.demo_url || '');
            setFeatured(s.featured);
            setPublished(s.published);
            if (s.deliverables) setDeliverables(s.deliverables);
            if (s.features) {
              setFeatures(
                s.features.map((f) => ({
                  id: f.id,
                  title: f.title,
                  description: f.description || '',
                }))
              );
            }
            if (s.faqs) {
              setFaqs(
                s.faqs.map((f) => ({
                  id: f.id,
                  question: f.question,
                  answer: f.answer,
                }))
              );
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, [id, isNew]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (isNew) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  const handleAddDeliverable = () => {
    if (newDeliverable.trim()) {
      setDeliverables([...deliverables, newDeliverable.trim()]);
      setNewDeliverable('');
    }
  };

  const handleRemoveDeliverable = (idx: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  const handleAddFeature = () => {
    if (newFeatureTitle.trim()) {
      setFeatures([
        ...features,
        {
          id: 'f-' + Math.random().toString(36).substring(2, 7),
          title: newFeatureTitle.trim(),
          description: newFeatureDesc.trim(),
        },
      ]);
      setNewFeatureTitle('');
      setNewFeatureDesc('');
    }
  };

  const handleRemoveFeature = (featId: string) => {
    setFeatures(features.filter((f) => f.id !== featId));
  };

  const handleAddFaq = () => {
    if (newFaqQ.trim() && newFaqA.trim()) {
      setFaqs([
        ...faqs,
        {
          id: 'faq-' + Math.random().toString(36).substring(2, 7),
          question: newFaqQ.trim(),
          answer: newFaqA.trim(),
        },
      ]);
      setNewFaqQ('');
      setNewFaqA('');
    }
  };

  const handleRemoveFaq = (faqId: string) => {
    setFaqs(faqs.filter((f) => f.id !== faqId));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !slug.trim() || !shortDesc.trim() || !description.trim()) {
      setErrorMsg('Please fill in title, slug, and descriptions.');
      return;
    }

    if (thumbnailUrl.trim()) {
      const validation = validateThumbnailUrl(thumbnailUrl.trim());
      if (!validation.isValid) {
        setErrorMsg(validation.error || 'Invalid thumbnail image URL');
        return;
      }
    }

    setIsSaving(true);
    try {
      const selectedCat = categories.find((c) => c.id === categoryId);

      const payload: Partial<ServiceItem> = {
        id: isNew ? undefined : id,
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        category_id: categoryId,
        category_name: selectedCat?.name || 'General',
        short_description: shortDesc.trim(),
        description: description.trim(),
        pricing_model: pricingModel,
        price: pricingModel === 'CUSTOM_QUOTE' ? 0 : Number(price),
        currency: 'INR',
        timeline: timeline.trim(),
        thumbnail_url: thumbnailUrl.trim() || undefined,
        demo_url: demoUrl.trim() || undefined,
        featured,
        published,
        deliverables,
        features: features.map((f, i) => ({
          id: f.id,
          service_id: id || 'pending',
          title: f.title,
          description: f.description,
          display_order: i + 1,
        })),
        faqs: faqs.map((f, i) => ({
          id: f.id,
          service_id: id || 'pending',
          question: f.question,
          answer: f.answer,
          display_order: i + 1,
        })),
      };

      await dataService.saveService(payload);
      navigate('/admin/services');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Failed to save service.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <SEO title={isNew ? 'Create New Service | VyapaarPro Admin' : `Edit ${name} | VyapaarPro Admin`} />

      <div className="flex items-center justify-between">
        <Link
          to="/admin/services"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Services List</span>
        </Link>
        <span className="text-xs font-mono text-violet-400">
          {isNew ? 'Mode: Create New' : `ID: ${id}`}
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">
          {isNew ? 'Create New Agency Service' : `Edit Service: ${name}`}
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Define pricing model, deliverables, features, and public visibility.
        </p>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl mb-6">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Service Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Full-Stack E-Commerce Website"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                URL Slug <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. ecommerce-website"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estimated Delivery Timeline
              </label>
              <input
                type="text"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g. 7 - 14 Days"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Pricing Model & Price (Section 15: FIXED, STARTING_FROM, CUSTOM_QUOTE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pricing Model <span className="text-rose-400">*</span>
              </label>
              <select
                value={pricingModel}
                onChange={(e) => setPricingModel(e.target.value as PricingModel)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="STARTING_FROM">STARTING_FROM ("Starting from ₹X")</option>
                <option value="FIXED">FIXED ("Fixed Price ₹X")</option>
                <option value="CUSTOM_QUOTE">CUSTOM_QUOTE ("Price on Discussion")</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Price (INR)
              </label>
              <input
                type="number"
                disabled={pricingModel === 'CUSTOM_QUOTE'}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 disabled:opacity-40 focus:outline-none focus:border-violet-500"
              />
              {pricingModel === 'CUSTOM_QUOTE' && (
                <span className="text-[11px] text-slate-500 block mt-1">
                  For custom quote services, "Price available after requirements discussion" is shown publicly.
                </span>
              )}
            </div>
          </div>

          {/* Short & Full Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Short Description (Card Teaser) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="1-2 sentences summarizing the value proposition..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Full Description & Scope Details <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="In-depth explanation of technical architecture, delivery methodology, and benefits..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Thumbnail URL (External Image Link Only - No Supabase Storage) */}
          <ServiceThumbnailUrlField
            value={thumbnailUrl}
            onChange={(url) => setThumbnailUrl(url)}
            label="Thumbnail URL"
            placeholder="https://example.com/service-thumbnail.jpg"
          />

          {/* Live Website Link */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Live Website / Production URL (Optional)
            </label>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://clientproject.com"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center space-x-6 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-slate-800 text-violet-600 focus:ring-0"
              />
              <span>Published on Website</span>
            </label>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded border-slate-800 text-violet-600 focus:ring-0"
              />
              <span>Featured on Homepage</span>
            </label>
          </div>

          {/* Manage Deliverables */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Deliverables Checklist
            </h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="Add deliverable (e.g. 5 Custom Web Pages)..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Add
              </button>
            </div>
            <div className="space-y-1.5">
              {deliverables.map((del, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300">{del}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(i)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Manage Features */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Technical Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newFeatureTitle}
                onChange={(e) => setNewFeatureTitle(e.target.value)}
                placeholder="Feature title..."
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFeatureDesc}
                  onChange={(e) => setNewFeatureDesc(e.target.value)}
                  placeholder="Feature description..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
                >
                  Add
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              {features.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white mr-2">{f.title}:</span>
                    <span className="text-slate-400">{f.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(f.id)}
                    className="text-slate-500 hover:text-rose-400 shrink-0 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-end space-x-3">
            <Link
              to="/admin/services"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-violet-600/20 flex items-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save & Publish Service'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
