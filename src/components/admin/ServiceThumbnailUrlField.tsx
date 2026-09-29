import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { validateThumbnailUrl } from '../../utils/thumbnailValidation';
import { ServiceThumbnail } from '../common/ServiceThumbnail';

interface ServiceThumbnailUrlFieldProps {
  value: string;
  onChange: (url: string) => void;
  platform?: string | null;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const ServiceThumbnailUrlField: React.FC<ServiceThumbnailUrlFieldProps> = ({
  value,
  onChange,
  platform,
  label = 'Thumbnail URL',
  placeholder = 'https://example.com/service-thumbnail.jpg',
  disabled = false,
}) => {
  const [showPreview, setShowPreview] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate whenever value changes
  useEffect(() => {
    setLoadError(false);
    setIsLoaded(false);

    if (!value || !value.trim()) {
      setValidationError(null);
      return;
    }

    const res = validateThumbnailUrl(value);
    if (!res.isValid) {
      setValidationError(res.error || 'Invalid URL format');
    } else {
      setValidationError(null);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    onChange(raw);
  };

  const handleRemove = () => {
    onChange('');
    setLoadError(false);
    setIsLoaded(false);
    setValidationError(null);
  };

  const hasValue = Boolean(value && value.trim().length > 0);
  const isHttps = hasValue && value.trim().toLowerCase().startsWith('https://');

  return (
    <div className="space-y-2.5">
      {/* Label and Actions */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-violet-400" />
          <span>{label}</span>
          <span className="text-[10px] lowercase text-slate-400 font-normal">
            (external link only)
          </span>
        </label>

        <div className="flex items-center space-x-2">
          {hasValue && (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition flex items-center space-x-1 cursor-pointer"
            >
              {showPreview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
            </button>
          )}

          {hasValue && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition flex items-center space-x-1 cursor-pointer"
              title="Remove Thumbnail URL"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove</span>
            </button>
          )}
        </div>
      </div>

      {/* Input Group */}
      <div className="relative">
        <input
          type="url"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-950 border text-xs text-white placeholder-slate-500 focus:outline-none transition ${
            validationError
              ? 'border-rose-500/80 focus:border-rose-500'
              : hasValue
              ? 'border-violet-500/50 focus:border-violet-500'
              : 'border-slate-800 focus:border-violet-500'
          }`}
        />

        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {validationError ? (
            <span title={validationError}>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </span>
          ) : hasValue && !loadError ? (
            <span title="Valid external URL">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </span>
          ) : null}
        </div>
      </div>

      {/* Guidance Text */}
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Paste a direct HTTPS image URL from any external hosting service (e.g. Unsplash, Cloudinary, Imgur, or your CDN).
        <span className="text-violet-300 ml-1">
          No files are uploaded or stored in Supabase.
        </span>
      </p>

      {/* Validation Error Message */}
      {validationError && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <span className="font-semibold block">URL Validation Error</span>
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* Image Preview Area */}
      {showPreview && (
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <span>Preview</span>
              {hasValue && isHttps && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  HTTPS Verified
                </span>
              )}
            </span>

            {hasValue && (
              <a
                href={value.trim()}
                target="_blank"
                rel="noreferrer noopener"
                className="text-violet-400 hover:text-violet-300 flex items-center space-x-1 transition text-[10px]"
              >
                <span>Open external link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="relative aspect-video max-w-sm mx-auto rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
            {hasValue && !validationError ? (
              <>
                <img
                  src={value.trim()}
                  alt="Thumbnail Preview"
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    loadError ? 'hidden' : isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onError={() => {
                    setLoadError(true);
                  }}
                  onLoad={() => {
                    setIsLoaded(true);
                    setLoadError(false);
                  }}
                  crossOrigin="anonymous"
                />

                {!isLoaded && !loadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-500 text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2 text-violet-400" />
                    <span>Loading preview...</span>
                  </div>
                )}

                {loadError && (
                  <div className="p-4 text-center space-y-1">
                    <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-amber-300">
                      Unable to load image preview.
                    </p>
                    <p className="text-[10px] text-slate-400 max-w-xs">
                      The image could not be loaded directly by your browser (e.g. invalid image file, CORS headers, or network error). You can still save this URL.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900/50">
                <ImageIcon className="w-8 h-8 text-slate-600 mb-1.5" />
                <span className="text-xs text-slate-400 font-medium">Default Placeholder</span>
                <span className="text-[10px] text-slate-600 mt-0.5">
                  Enter a URL above to display custom service thumbnail.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
