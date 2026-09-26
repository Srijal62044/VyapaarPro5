import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { dataService } from '../../services/store';
import { PortfolioItem } from '../../types';
import { SEO } from '../../components/common/SEO';

export const AdminPortfolioEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Websites');
  const [clientType, setClientType] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [published, setPublished] = useState(true);

  const [technologies, setTechnologies] = useState<string[]>(['React', 'TypeScript', 'PostgreSQL']);
  const [newTech, setNewTech] = useState('');

  const [images, setImages] = useState<string[]>([]);
  const [newImage, setNewImage] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadItem() {
      if (!isNew && id) {
        const item = await dataService.getPortfolioBySlug(id);
        const itemById = item || (await dataService.getPortfolio(false)).find((p) => p.id === id);
        if (itemById) {
          setTitle(itemById.title);
          setSlug(itemById.slug);
          setDescription(itemById.description);
          setCategory(itemById.category);
          setClientType(itemById.client_type || '');
          setThumbnailUrl(itemById.thumbnail_url);
          setDemoUrl(itemById.demo_url || '');
          setPublished(itemById.published);
          if (itemById.technologies) setTechnologies(itemById.technologies);
          if (itemById.images) setImages(itemById.images);
        }
      }
    }
    loadItem();
  }, [id, isNew]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  const handleAddTech = () => {
    if (newTech.trim()) {
      setTechnologies([...technologies, newTech.trim()]);
      setNewTech('');
    }
  };

  const handleRemoveTech = (t: string) => {
    setTechnologies(technologies.filter((tech) => tech !== t));
  };

  const handleAddImage = () => {
    if (newImage.trim()) {
      setImages([...images, newImage.trim()]);
      setNewImage('');
    }
  };

  const handleRemoveImage = (img: string) => {
    setImages(images.filter((i) => i !== img));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !description.trim()) {
      setErrorMsg('Please fill in title, slug, and description.');
      return;
    }

    setIsSaving(true);
    try {
      await dataService.savePortfolio({
        id: isNew ? undefined : id,
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        category,
        client_type: clientType.trim() || undefined,
        thumbnail_url:
          thumbnailUrl.trim() ||
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        demo_url: demoUrl.trim() || undefined,
        published,
        technologies,
        images,
      });

      navigate('/admin/portfolio');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save case study.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <SEO title={isNew ? 'New Case Study | VyapaarPro Admin' : `Edit ${title}`} />

      <Link
        to="/admin/portfolio"
        className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Case Studies</span>
      </Link>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">
          {isNew ? 'Create New Portfolio Case Study' : `Edit: ${title}`}
        </h1>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Project Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Apex Logistics Freight Portal"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Slug <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              >
                <option value="Websites">Websites</option>
                <option value="Apps & Web Apps">Apps & Web Apps</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Design & Branding">Design & Branding</option>
                <option value="Business Solutions">Business Solutions</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Client / Project Type</label>
              <input
                type="text"
                value={clientType}
                onChange={(e) => setClientType(e.target.value)}
                placeholder="e.g. B2B Freight Logistics"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Case Study Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Background, problem solved, results achieved..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Live URL (Optional)</label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>
          </div>

          {/* Tech Stack Tags */}
          <div className="space-y-2 pt-2">
            <label className="block text-slate-300 font-medium">Technologies Stack</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Add technology (e.g. Next.js, Node.js, Tailwind)..."
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {technologies.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded bg-slate-950 text-indigo-300 font-mono border border-slate-800 flex items-center space-x-1.5"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(t)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-slate-800 text-violet-600 focus:ring-0"
              />
              <span>Published Live on Public Portfolio</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
            <Link to="/admin/portfolio" className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl"
            >
              {isSaving ? 'Saving...' : 'Save Case Study'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
