import React, { useState } from 'react';
import {
  Save,
  CheckCircle,
  Database,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  Share2,
  User,
  Scale,
  MapPin,
  Terminal,
  FileText,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  Trash2,
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SEO } from '../../components/common/SEO';
import { BrandLogo } from '../../components/common/BrandLogo';

export const AdminSettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const [form, setForm] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'branding' | 'developer' | 'legal' | 'database'>('branding');

  // Synchronize form whenever settings finish loading or update
  React.useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoUploadError('Logo file must be smaller than 2MB.');
      return;
    }

    setLogoUploadError('');
    setIsUploadingLogo(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        setForm((prev) => ({
          ...prev,
          logo_url: base64Data,
        }));
      }
      setIsUploadingLogo(false);
    };
    reader.onerror = () => {
      setLogoUploadError('Failed to read image file.');
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      setLogoUploadError('Favicon file must be smaller than 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        setForm((prev) => ({
          ...prev,
          favicon_url: base64Data,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await updateSettings(form);
      if (res.success) {
        if (res.error) {
          // Informative notice if remote db warned but local persistence succeeded
          setSuccessMsg('Settings updated and active in application.');
          setErrorMsg(res.error);
        } else {
          setSuccessMsg('Agency profile and system settings saved successfully.');
          setTimeout(() => setSuccessMsg(''), 4000);
        }
      } else {
        setErrorMsg(res.error || 'Failed to update settings in database.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error updating settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <SEO title="Agency Settings & Configuration | VyapaarPro Admin" />

      <div>
        <h1 className="text-2xl font-bold text-white">Agency Profile & System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure agency brand name, contacts, developer profile, legal terms, and database migration scripts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4 sm:space-x-6 text-xs font-semibold overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('branding')}
          className={`pb-3 transition cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'branding'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Agency Branding & Contacts</span>
        </button>

        <button
          onClick={() => setActiveTab('developer')}
          className={`pb-3 transition cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'developer'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Developer Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('legal')}
          className={`pb-3 transition cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'legal'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Legal & Governance</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`pb-3 transition cursor-pointer border-b-2 flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'database'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase / Database</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: Profile & Contact Configuration */}
      {activeTab === 'branding' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Custom Brand Logo Card */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-indigo-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Brand Logo & Visual Identity</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20">
                      Live Preview & Custom Upload
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Upload your custom logo image or provide a hosted URL. It will automatically update across the website navigation, footer, and workspaces.
                  </p>
                </div>
              </div>

              {form.logo_url && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logo_url: '' })}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/20 transition shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset to Default Logo</span>
                </button>
              )}
            </div>

            {/* Live Logo Preview Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                  Header Preview (Dark)
                </span>
                <div className="py-2">
                  <BrandLogo
                    size="md"
                    variant="default"
                    customLogoUrl={form.logo_url}
                    linkTo={null}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                  Admin Sidebar Preview
                </span>
                <div className="py-2">
                  <BrandLogo
                    size="sm"
                    variant="admin"
                    customLogoUrl={form.logo_url}
                    linkTo={null}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300">
                  Active Status
                </span>
                <div className="text-center">
                  {form.logo_url ? (
                    <span className="inline-flex items-center space-x-1 text-xs text-emerald-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Custom Logo Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs text-indigo-300 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Default Vector Emblem</span>
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {form.logo_url ? 'Custom image loaded' : 'High-resolution geometric mark'}
                  </p>
                </div>
              </div>
            </div>

            {logoUploadError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{logoUploadError}</span>
              </div>
            )}

            {/* Upload & URL Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-slate-300 font-medium text-xs mb-1">
                  Upload Logo File (PNG, SVG, WebP, JPG)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="logo-file-input"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-file-input"
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-200 text-xs font-semibold cursor-pointer transition shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingLogo ? 'Processing Image...' : 'Choose Logo Image File'}</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Recommended: Square 512x512 or Horizontal 240x60 transparent PNG/SVG.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium text-xs mb-1">
                  Or Paste Hosted Logo Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={form.logo_url || ''}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports HTTPS image URLs from any CDN or image host.
                </p>
              </div>
            </div>

            {/* Favicon URL Option */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium text-xs mb-1">
                    Custom Browser Favicon URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/favicon.ico"
                    value={form.favicon_url || ''}
                    onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium text-xs mb-1">
                    Upload Favicon File (ICO, PNG)
                  </label>
                  <input
                    type="file"
                    id="favicon-file-input"
                    accept="image/x-icon,image/png,image/svg+xml"
                    onChange={handleFaviconFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="favicon-file-input"
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 text-xs font-medium cursor-pointer transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Favicon</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Agency Brand Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tagline / Mission</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Official Business Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  WhatsApp Direct Number
                </label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Agency Address / Hub Location</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Business Description (Footer & Meta)
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Footer Copyright Notice</label>
              <input
                type="text"
                value={form.footer_text}
                onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            {/* Social Links */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Agency Social Handles (Optional)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="url"
                  placeholder="LinkedIn URL (e.g. https://linkedin.com/company/...)"
                  value={form.social?.linkedin || ''}
                  onChange={(e) =>
                    setForm({ ...form, social: { ...form.social, linkedin: e.target.value } })
                  }
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
                <input
                  type="url"
                  placeholder="Twitter / X URL"
                  value={form.social?.twitter || ''}
                  onChange={(e) =>
                    setForm({ ...form, social: { ...form.social, twitter: e.target.value } })
                  }
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
                <input
                  type="url"
                  placeholder="GitHub Organization URL"
                  value={form.social?.github || ''}
                  onChange={(e) =>
                    setForm({ ...form, social: { ...form.social, github: e.target.value } })
                  }
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
                <input
                  type="url"
                  placeholder="Instagram Profile URL"
                  value={form.social?.instagram || ''}
                  onChange={(e) =>
                    setForm({ ...form, social: { ...form.social, instagram: e.target.value } })
                  }
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-violet-600/20 flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Branding Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Developer Profile Configuration */}
      {activeTab === 'developer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <h3 className="text-base font-bold text-white">Developer Profile & Introduction</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Displayed in the &ldquo;About the Developer&rdquo; section of the public /about page.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Developer Full Name</label>
                <input
                  type="text"
                  value={form.developer?.name || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      developer: {
                        ...(form.developer || {
                          name: '',
                          role: '',
                          location: '',
                          bio: '',
                          focus: [],
                        }),
                        name: e.target.value,
                      },
                    })
                  }
                  placeholder="SRIJAL KUMAR"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Developer Title / Role</label>
                <input
                  type="text"
                  value={form.developer?.role || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      developer: {
                        ...(form.developer || {
                          name: '',
                          role: '',
                          location: '',
                          bio: '',
                          focus: [],
                        }),
                        role: e.target.value,
                      },
                    })
                  }
                  placeholder="Founder & Developer, VyapaarPro"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Location / Base</label>
                <input
                  type="text"
                  value={form.developer?.location || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      developer: {
                        ...(form.developer || {
                          name: '',
                          role: '',
                          location: '',
                          bio: '',
                          focus: [],
                        }),
                        location: e.target.value,
                      },
                    })
                  }
                  placeholder="BIHAR, INDIA"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Developer Introduction / Bio
              </label>
              <textarea
                rows={4}
                value={form.developer?.bio || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    developer: {
                      ...(form.developer || {
                        name: '',
                        role: '',
                        location: '',
                        bio: '',
                        focus: [],
                      }),
                      bio: e.target.value,
                    },
                  })
                }
                placeholder="A genuine developer introduction outlining your commitment to accessible, practical digital engineering..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Developer Photo / Avatar URL (Optional)
              </label>
              <input
                type="url"
                value={form.developer?.avatar_url || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    developer: {
                      ...(form.developer || {
                        name: '',
                        role: '',
                        location: '',
                        bio: '',
                        focus: [],
                      }),
                      avatar_url: e.target.value,
                    },
                  })
                }
                placeholder="Leave blank to use a neutral initials placeholder (e.g. SK)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            {/* Developer Social Links */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Developer Social Handles (Only displayed on /about if filled)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="url"
                  placeholder="Developer GitHub URL"
                  value={form.developer?.github || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      developer: {
                        ...(form.developer || {
                          name: '',
                          role: '',
                          location: '',
                          bio: '',
                          focus: [],
                        }),
                        github: e.target.value,
                      },
                    })
                  }
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
                <input
                  type="url"
                  placeholder="Developer LinkedIn URL"
                  value={form.developer?.linkedin || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      developer: {
                        ...(form.developer || {
                          name: '',
                          role: '',
                          location: '',
                          bio: '',
                          focus: [],
                        }),
                        linkedin: e.target.value,
                      },
                    })
                  }
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
                <input
                  type="url"
                  placeholder="Developer Instagram URL"
                  value={form.developer?.instagram || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      developer: {
                        ...(form.developer || {
                          name: '',
                          role: '',
                          location: '',
                          bio: '',
                          focus: [],
                        }),
                        instagram: e.target.value,
                      },
                    })
                  }
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
                <input
                  type="url"
                  placeholder="Developer Twitter / X URL"
                  value={form.developer?.twitter || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      developer: {
                        ...(form.developer || {
                          name: '',
                          role: '',
                          location: '',
                          bio: '',
                          focus: [],
                        }),
                        twitter: e.target.value,
                      },
                    })
                  }
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-violet-600/20 flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Developer Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Legal & Governance Configuration */}
      {activeTab === 'legal' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div>
            <h3 className="text-base font-bold text-white">Legal & Governance Settings</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize jurisdiction, effective dates, and policy notices for /privacy and /terms.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Governing Jurisdiction</label>
                <input
                  type="text"
                  value={form.legal?.governing_jurisdiction || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      legal: {
                        ...(form.legal || {
                          governing_jurisdiction: '',
                          effective_date: '',
                          last_updated: '',
                          legal_notice: '',
                        }),
                        governing_jurisdiction: e.target.value,
                      },
                    })
                  }
                  placeholder="[Jurisdiction of Bihar / India]"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Effective Date</label>
                <input
                  type="text"
                  value={form.legal?.effective_date || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      legal: {
                        ...(form.legal || {
                          governing_jurisdiction: '',
                          effective_date: '',
                          last_updated: '',
                          legal_notice: '',
                        }),
                        effective_date: e.target.value,
                      },
                    })
                  }
                  placeholder="January 1, 2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Last Updated</label>
                <input
                  type="text"
                  value={form.legal?.last_updated || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      legal: {
                        ...(form.legal || {
                          governing_jurisdiction: '',
                          effective_date: '',
                          last_updated: '',
                          legal_notice: '',
                        }),
                        last_updated: e.target.value,
                      },
                    })
                  }
                  placeholder="September 2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Legal Policy Draft / Review Notice
              </label>
              <textarea
                rows={3}
                value={form.legal?.legal_notice || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    legal: {
                      ...(form.legal || {
                        governing_jurisdiction: '',
                        effective_date: '',
                        last_updated: '',
                        legal_notice: '',
                      }),
                      legal_notice: e.target.value,
                    },
                  })
                }
                placeholder="Editable template notice..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-violet-600/20 flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Legal Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Database Status & Migrations */}
      {activeTab === 'database' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl text-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Database Engine & Connection</h3>
              <p className="text-slate-400 mt-0.5">
                Target Backend: Supabase (PostgreSQL with Row Level Security).
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              }`}
            >
              {isSupabaseConfigured ? 'Connected to Remote Supabase' : 'Local Persistent Mode Active'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-white block">Environment Variable Status:</span>
            <div className="font-mono text-[11px] space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span>VITE_SUPABASE_URL:</span>
                <span className="text-slate-400">
                  {import.meta.env.VITE_SUPABASE_URL || 'Not specified (operating in local persistent mode)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VITE_SUPABASE_ANON_KEY:</span>
                <span className="text-slate-400">
                  {import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••••••••••' : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VITE_ADMIN_EMAIL:</span>
                <span className="text-violet-400 font-semibold">
                  {import.meta.env.VITE_ADMIN_EMAIL || 'kumarsrijal732@gmail.com'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white">Generated Database Migration Files</h4>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 space-y-1">
              <p className="text-emerald-400">
                1. supabase/complete_vyapaarpro_migration.sql (All-in-one production migration for Supabase SQL Editor)
              </p>
              <p className="text-indigo-400">
                2. supabase/migrations/20260926000001_initial_vyapaarpro.sql (Schema, RLS, indexes)
              </p>
              <p className="text-violet-400">
                3. supabase/migrations/20260926000003_admin_email_security.sql (Authorized single admin email lock)
              </p>
            </div>
            <p className="text-slate-400 leading-relaxed">
              To deploy or update your live Supabase project, execute <code className="text-indigo-300">supabase/complete_vyapaarpro_migration.sql</code> in the Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
