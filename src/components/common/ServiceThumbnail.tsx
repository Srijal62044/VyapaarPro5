import React, { useState, useEffect } from 'react';
import {
  Share2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Flame,
  Globe,
  Video,
  Send,
  MessageCircle,
  Twitter,
  Music,
} from 'lucide-react';

interface ServiceThumbnailProps {
  src?: string | null;
  alt: string;
  platform?: string | null;
  className?: string;
  imageClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'responsive';
  aspectRatio?: 'video' | 'square' | 'wide' | 'auto';
}

function getPlatformIcon(platform?: string | null) {
  const p = (platform || '').toLowerCase();
  switch (p) {
    case 'instagram':
      return <Flame className="w-1/2 h-1/2 text-pink-400" />;
    case 'youtube':
      return <Video className="w-1/2 h-1/2 text-red-400" />;
    case 'telegram':
      return <Send className="w-1/2 h-1/2 text-cyan-400" />;
    case 'twitter':
    case 'x':
      return <Twitter className="w-1/2 h-1/2 text-sky-400" />;
    case 'threads':
      return <MessageCircle className="w-1/2 h-1/2 text-emerald-400" />;
    case 'spotify':
      return <Music className="w-1/2 h-1/2 text-emerald-400" />;
    case 'facebook':
    case 'linkedin':
      return <Globe className="w-1/2 h-1/2 text-blue-400" />;
    default:
      return <Share2 className="w-1/2 h-1/2 text-violet-400" />;
  }
}

function getPlatformGradient(platform?: string | null) {
  const p = (platform || '').toLowerCase();
  switch (p) {
    case 'instagram':
      return 'from-pink-950/60 via-purple-950/40 to-slate-950 text-pink-300 border-pink-500/20';
    case 'youtube':
      return 'from-red-950/60 via-slate-900 to-slate-950 text-red-300 border-red-500/20';
    case 'telegram':
      return 'from-cyan-950/60 via-sky-950/40 to-slate-950 text-cyan-300 border-cyan-500/20';
    case 'twitter':
    case 'x':
      return 'from-sky-950/60 via-slate-900 to-slate-950 text-sky-300 border-sky-500/20';
    case 'spotify':
      return 'from-emerald-950/60 via-slate-900 to-slate-950 text-emerald-300 border-emerald-500/20';
    default:
      return 'from-violet-950/60 via-indigo-950/40 to-slate-950 text-violet-300 border-violet-500/20';
  }
}

export const ServiceThumbnail: React.FC<ServiceThumbnailProps> = ({
  src,
  alt,
  platform,
  className = '',
  imageClassName = '',
  size = 'responsive',
  aspectRatio = 'video',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error state whenever src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const hasValidUrl = Boolean(src && typeof src === 'string' && src.trim().length > 0 && !hasError);

  // Aspect ratio classes
  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : '';

  // Size sizing classes for table thumbnails
  const sizeClass =
    size === 'xs'
      ? 'w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg'
      : size === 'sm'
      ? 'w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl'
      : size === 'md'
      ? 'w-24 h-24 rounded-xl'
      : size === 'lg'
      ? 'w-full max-h-[380px] rounded-2xl'
      : 'w-full h-full';

  return (
    <div
      className={`relative overflow-hidden bg-slate-950 flex items-center justify-center select-none ${aspectClass} ${sizeClass} ${className}`}
    >
      {hasValidUrl ? (
        <>
          <img
            src={src!.trim()}
            alt={alt || 'Service thumbnail'}
            onError={() => {
              setHasError(true);
            }}
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${imageClassName}`}
            loading="lazy"
            crossOrigin="anonymous"
          />
          {!isLoaded && !hasError && (
            <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-slate-600 animate-spin" />
            </div>
          )}
        </>
      ) : (
        /* Default Clean Placeholder */
        <div
          className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br border ${getPlatformGradient(
            platform
          )} p-3 text-center`}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center shadow-inner mb-1.5">
            {getPlatformIcon(platform)}
          </div>
          {size !== 'xs' && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 line-clamp-1">
              {platform || 'VyapaarPro Service'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
