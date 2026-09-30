import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  Upload,
  Image as ImageIcon,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { StoreProduct, StoreCategory, StoreProductStatus } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { SEO } from '../../components/common/SEO';

export const AdminStoreProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [priceRupees, setPriceRupees] = useState<number>(499);
  const [comparePriceRupees, setComparePriceRupees] = useState<number | ''>('');
  const [status, setStatus] = useState<StoreProductStatus>('DRAFT');
  const [featured, setFeatured] = useState(false);

  // Uploaded paths & info
  const [thumbnailPath, setThumbnailPath] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [productFilePath, setProductFilePath] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState<number | null>(null);
  const [mimeType, setMimeType] = useState('');

  // Delivery configuration fields
  const [accessLink, setAccessLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [accessInfo, setAccessInfo] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Upload progress states
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  useEffect(() => {
    async function loadInit() {
      try {
        const cats = await storeDataService.getCategories(false, 'DIGITAL_PRODUCT');
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }

        if (!isNew && id) {
          const product = await storeDataService.getProductById(id);
          if (product) {
            setName(product.name);
            setSlug(product.slug);
            setCategoryId(product.category_id || (cats[0]?.id || ''));
            setShortDescription(product.short_description);
            setDescription(product.description);
            setPriceRupees(Math.round(product.price_paise / 100));
            setComparePriceRupees(
              product.compare_at_price_paise
                ? Math.round(product.compare_at_price_paise / 100)
                : ''
            );
            setStatus(product.status);
            setFeatured(product.featured);
            setThumbnailPath(product.thumbnail_path || '');
            setThumbnailUrl(product.thumbnail_url || '');
            setProductFilePath(product.product_file_path || '');
            setFileName(product.file_name || '');
            setFileSizeBytes(product.file_size_bytes || null);
            setMimeType(product.mime_type || '');
            setAccessLink(product.access_link || '');
            setInstructions(product.instructions || '');
            setAccessInfo(product.access_info || '');
            setLicenseKey(product.license_key || '');
            setDeliveryNotes(product.delivery_notes || '');
          }
        }
      } catch (err) {
        console.error('Failed to load product data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInit();
  }, [id, isNew]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (isNew) {
      // Auto-generate slug
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generated);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumb(true);
    setErrorMessage('');
    try {
      const result = await storeDataService.uploadThumbnail(file);
      setThumbnailPath(result.path);
      setThumbnailUrl(result.url);
    } catch (err: any) {
      console.error('Thumbnail upload failed:', err);
      setErrorMessage(err.message || 'Thumbnail upload failed');
    } finally {
      setIsUploadingThumb(false);
    }
  };

  const handleProductFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setErrorMessage('');
    try {
      const result = await storeDataService.uploadProductFile(file);
      setProductFilePath(result.path);
      setFileName(result.fileName);
      setFileSizeBytes(result.fileSizeBytes);
      setMimeType(result.mimeType);
    } catch (err: any) {
      console.error('File upload failed:', err);
      setErrorMessage(err.message || 'Product file upload failed');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Product name is required.');
      return;
    }
    if (!slug.trim()) {
      setErrorMessage('Product slug is required.');
      return;
    }
    if (!shortDescription.trim()) {
      setErrorMessage('Short description is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Full product description is required.');
      return;
    }
    if (priceRupees < 0) {
      setErrorMessage('Price cannot be negative.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        category_id: categoryId || 'cat-digital',
        platform: 'digital',
        name: name.trim(),
        slug: slug.toLowerCase().trim(),
        short_description: shortDescription.trim(),
        description: description.trim(),
        price_paise: Math.round(priceRupees * 100),
        compare_at_price_paise:
          comparePriceRupees !== '' ? Math.round(Number(comparePriceRupees) * 100) : null,
        thumbnail_path: thumbnailPath || null,
        product_file_path: productFilePath || null,
        file_name: fileName || null,
        file_size_bytes: fileSizeBytes || null,
        mime_type: mimeType || null,
        access_link: accessLink.trim() || null,
        instructions: instructions.trim() || null,
        access_info: accessInfo.trim() || null,
        license_key: licenseKey.trim() || null,
        delivery_notes: deliveryNotes.trim() || null,
        status,
        featured,
      };

      if (isNew) {
        await storeDataService.createProduct(payload as any);
        setSuccessMessage('Product created successfully!');
        setTimeout(() => navigate('/admin/store/products'), 1000);
      } else if (id) {
        await storeDataService.updateProduct(id, payload);
        setSuccessMessage('Product updated successfully!');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading product editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <SEO title={isNew ? 'New Digital Product | VyapaarPro Admin' : `Edit ${name} | VyapaarPro Admin`} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/store/products"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isNew ? 'Create New Digital Product' : `Edit: ${name}`}
            </h1>
            <p className="text-xs text-slate-400">
              Configure product details, digital downloadable package, and INR pricing.
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || isUploadingThumb || isUploadingFile}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Product</span>
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Core Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Package className="w-4 h-4 text-violet-400" />
            <span>Product Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Next.js SaaS Starter Boilerplate"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Slug (URL Identifier) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="nextjs-saas-starter"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StoreProductStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="DRAFT">DRAFT (Hidden from public store)</option>
                <option value="PUBLISHED">PUBLISHED (Live in store)</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Short Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary displayed on product cards..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Product Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed deliverables, technical stack, documentation guide, and features included..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-violet-600 focus:ring-violet-500 h-4 w-4"
            />
            <label htmlFor="featured" className="text-xs text-slate-300 cursor-pointer">
              Mark as Featured Product (Highlights with special badge)
            </label>
          </div>
        </div>

        {/* Card 2: Pricing (Paise) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Pricing (INR)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selling Price (₹ INR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={priceRupees}
                onChange={(e) => setPriceRupees(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Stored precisely as {Math.round(priceRupees * 100)} paise
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Compare-at Price (₹ INR, Optional Strike-through)
              </label>
              <input
                type="number"
                min="0"
                value={comparePriceRupees}
                onChange={(e) =>
                  setComparePriceRupees(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="e.g. 999"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Media & Digital File Upload */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Product Media & Digital Download Assets</span>
          </h2>

          {/* Thumbnail Uploader */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Product Thumbnail Preview Image
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleThumbnailUpload}
                  disabled={isUploadingThumb}
                  className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Recommended: 16:9 ratio (PNG, JPG, WEBP). Max 10MB.
                </p>
              </div>
            </div>
          </div>

          {/* Digital File Uploader (Private Bucket) */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <label className="block text-xs font-semibold text-slate-300">
                Downloadable Product File (Secured in Private Storage)
              </label>
            </div>
            <p className="text-[11px] text-slate-400">
              Upload the actual package customers receive upon verified payment (e.g. .ZIP archive, code bundle, PDF asset).
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {fileName ? (
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{fileName}</span>
                    </span>
                    {fileSizeBytes && (
                      <span className="text-[10px] text-slate-500 block">
                        {(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB • {mimeType}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">No digital file attached yet.</span>
                )}
              </div>

              <input
                type="file"
                accept=".zip,.pdf,.json,.png,.jpg"
                onChange={handleProductFileUpload}
                disabled={isUploadingFile}
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Product Delivery & Post-Purchase Fulfillment Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Product Delivery & Post-Purchase Details</span>
            </h2>
            <span className="text-[11px] text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Only shown after manual payment approval
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Configure the specific access details, links, credentials, or instructions sent to the customer upon verified payment. These are automatically included in the customer's portal and the WhatsApp delivery dispatch.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Access / Download Link (Optional)
              </label>
              <input
                type="url"
                value={accessLink}
                onChange={(e) => setAccessLink(e.target.value)}
                placeholder="https://drive.google.com/... or https://notion.site/..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Direct external repository, Figma link, Google Drive, Notion page, or web portal.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                License / Access Key / Serial Code (Optional)
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="VP-LIC-XXXX-YYYY-ZZZZ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Software license key, activation token, or coupon code.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Access Credentials & Account Details (Optional)
            </label>
            <textarea
              rows={3}
              value={accessInfo}
              onChange={(e) => setAccessInfo(e.target.value)}
              placeholder="Portal: https://app.example.com&#10;Username: [Provided in portal]&#10;Default Workspace ID: ws_98241"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Confidential access parameters, portal URLs, or workspace IDs.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Product Setup & Access Instructions (Optional)
            </label>
            <textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="1. Extract the downloaded .zip package.&#10;2. Run `npm install` inside the project folder.&#10;3. Copy .env.example to .env and configure your keys.&#10;4. Start the app with `npm run dev`."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Step-by-step instructions displayed directly in the customer receipt.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Additional Delivery Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="Thank you for choosing VyapaarPro. For custom installation support, ping us on WhatsApp."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Appended directly to the WhatsApp dispatch and customer order confirmation.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Link
            to="/admin/store/products"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving || isUploadingThumb || isUploadingFile}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isNew ? 'Create Product' : 'Update Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
