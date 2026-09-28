import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  FileCode,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  ExternalLink,
  PackageOpen,
} from 'lucide-react';
import { StoreDownload } from '../../types';
import { storeDataService } from '../../services/storeDataService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { SEO } from '../../components/common/SEO';

export const ClientDownloadsPage: React.FC = () => {
  const { profile } = useAuth();
  const [downloads, setDownloads] = useState<StoreDownload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDownloads() {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        const data = await storeDataService.getCustomerDownloads(profile.id);
        setDownloads(data);
      } catch (err) {
        console.error('Failed to load downloads:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDownloads();
  }, [profile?.id]);

  const handleDownloadFile = async (item: StoreDownload) => {
    setDownloadError(null);
    setDownloadingId(item.id);

    try {
      // Get current auth session token
      const session = (await supabase?.auth.getSession())?.data.session;
      const token = session?.access_token || 'local-preview-token';

      const res = await fetch(`/api/store/download?downloadId=${item.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.downloadUrl) {
        throw new Error(data.error || 'Failed to generate secure download link');
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName || item.file_name || 'download.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment count locally
      setDownloads((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, download_count: (d.download_count || 0) + 1 } : d))
      );
    } catch (err: any) {
      console.error('Download error:', err);
      setDownloadError(err.message || 'Could not download file. Please contact support.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="My Digital Downloads | VyapaarPro Workspace" description="Access and download your purchased digital products." />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Download className="w-6 h-6 text-indigo-400" />
            <span>Digital Downloads Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access, download, and manage all your purchased templates, codebases, and digital assets.
          </p>
        </div>

        <Link
          to="/store"
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition self-start sm:self-auto"
        >
          Browse More Products
        </Link>
      </div>

      {downloadError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your purchased downloads...</p>
        </div>
      ) : downloads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {downloads.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active License</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{item.product_name || 'Digital Product'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.file_name ? `File: ${item.file_name}` : 'Digital Asset Package'}
                  </p>

                  {/* Access Link & License Badges */}
                  {(item.product?.access_link || item.product?.license_key) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.product?.access_link && (
                        <a
                          href={item.product.access_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Access Link</span>
                        </a>
                      )}
                      {item.product?.license_key && (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-mono font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                          <span>Key: {item.product.license_key}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 space-y-1">
                  <p className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Purchased: {new Date(item.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  </p>
                  <p>Downloaded: {item.download_count || 0} times</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                {item.order_id && (
                  <Link
                    to={`/app/orders/${item.order_id}`}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    View Receipt
                  </Link>
                )}

                <button
                  onClick={() => handleDownloadFile(item)}
                  disabled={downloadingId === item.id}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {downloadingId === item.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Secure Link...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <PackageOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Downloads Available</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            When you purchase digital products, boilerplate kits, or templates from the store, your secure download links will appear here immediately.
          </p>
          <Link
            to="/store"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Digital Store</span>
          </Link>
        </div>
      )}
    </div>
  );
};
