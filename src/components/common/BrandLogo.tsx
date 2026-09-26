import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  variant?: 'default' | 'admin' | 'client' | 'monochrome' | 'simple';
  customLogoUrl?: string;
  linkTo?: string | null;
  className?: string;
  textClassName?: string;
  imgClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  variant = 'default',
  customLogoUrl,
  linkTo = '/',
  className = '',
  textClassName = '',
  imgClassName = '',
}) => {
  const { settings } = useSettings();
  const [imgError, setImgError] = useState(false);

  // Active logo source: passed prop or settings
  const logoUrl = (customLogoUrl !== undefined ? customLogoUrl : settings.logo_url)?.trim();
  const appName = settings.name || 'VyapaarPro';

  // Size mapping
  const sizeConfig = {
    xs: {
      iconBox: 'w-6 h-6 rounded-md',
      iconSvg: 'w-3.5 h-3.5',
      titleText: 'text-sm font-bold',
      subText: 'text-[9px]',
      gap: 'space-x-1.5',
      imgHeight: 'h-6',
    },
    sm: {
      iconBox: 'w-8 h-8 rounded-lg',
      iconSvg: 'w-4 h-4',
      titleText: 'text-base font-bold',
      subText: 'text-[10px]',
      gap: 'space-x-2',
      imgHeight: 'h-8',
    },
    md: {
      iconBox: 'w-10 h-10 rounded-xl',
      iconSvg: 'w-5 h-5',
      titleText: 'text-xl font-extrabold',
      subText: 'text-[10px]',
      gap: 'space-x-3',
      imgHeight: 'h-10',
    },
    lg: {
      iconBox: 'w-12 h-12 rounded-2xl',
      iconSvg: 'w-6 h-6',
      titleText: 'text-2xl font-extrabold',
      subText: 'text-xs',
      gap: 'space-x-3.5',
      imgHeight: 'h-12',
    },
    xl: {
      iconBox: 'w-16 h-16 rounded-2xl',
      iconSvg: 'w-8 h-8',
      titleText: 'text-3xl font-extrabold',
      subText: 'text-sm',
      gap: 'space-x-4',
      imgHeight: 'h-16',
    },
  }[size];

  // Default subtitle based on variant if not provided
  const resolvedSubtitle =
    subtitle !== undefined
      ? subtitle
      : variant === 'admin'
      ? 'Operations Admin'
      : variant === 'client'
      ? 'Client Workspace'
      : 'Digital Services Agency';

  // Subtitle color
  const subtitleColor =
    variant === 'admin'
      ? 'text-violet-400'
      : variant === 'client'
      ? 'text-indigo-400'
      : 'text-slate-400';

  // Icon container gradient
  const iconContainerClass =
    variant === 'admin'
      ? 'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 shadow-violet-600/30'
      : variant === 'client'
      ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 shadow-indigo-600/30'
      : 'bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-500 shadow-indigo-600/30';

  // Render the logo icon / image
  const renderIcon = () => {
    if (logoUrl && !imgError) {
      return (
        <div className={`relative flex items-center justify-center shrink-0 ${sizeConfig.iconBox} overflow-hidden bg-slate-900 border border-slate-700/60 shadow-md`}>
          <img
            src={logoUrl}
            alt={`${appName} Logo`}
            onError={() => setImgError(true)}
            className={`max-w-full max-h-full object-contain ${imgClassName}`}
          />
        </div>
      );
    }

    // High-tech custom vector geometric monogram for VyapaarPro
    return (
      <div
        className={`${sizeConfig.iconBox} ${iconContainerClass} flex items-center justify-center text-white shadow-lg shrink-0 group-hover:scale-105 transition-transform duration-300`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeConfig.iconSvg}`}
        >
          {/* Outer hexagonal shield guide */}
          <path
            d="M20 4L34 12V28L20 36L6 28V12L20 4Z"
            fill="currentColor"
            fillOpacity="0.15"
          />
          {/* Stylized 'V' - Left wing and anchor */}
          <path
            d="M10 13L20 31L23 25L15 13H10Z"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Stylized 'P' - Overlapping ascending bridge & loop */}
          <path
            d="M18 9H27C29.7614 9 32 11.2386 32 14C32 16.7614 29.7614 19 27 19H22V27H18V9ZM22 15H26.5C27.3284 15 28 14.3284 28 13.5C28 12.6716 27.3284 12 26.5 12H22V15Z"
            fill="#A5F3FC"
          />
          {/* Sparkle nexus dot */}
          <circle cx="20" cy="20" r="2" fill="#F43F5E" />
        </svg>
      </div>
    );
  };

  // Render text branding
  const renderText = () => {
    if (!showText) return null;

    // Check if appName contains standard "VyapaarPro" or custom name
    const isStandardVyapaar = appName.toLowerCase().startsWith('vyapaar');

    return (
      <div className={`flex flex-col text-left leading-tight ${textClassName}`}>
        {isStandardVyapaar ? (
          <span className={`${sizeConfig.titleText} tracking-tight text-white flex items-center`}>
            <span>Vyapaar</span>
            <span className="text-indigo-400 ml-0.5">
              {appName.slice(7) || 'Pro'}
            </span>
          </span>
        ) : (
          <span className={`${sizeConfig.titleText} tracking-tight text-white`}>
            {appName}
          </span>
        )}

        {resolvedSubtitle && (
          <span
            className={`${sizeConfig.subText} font-medium ${subtitleColor} block tracking-wider uppercase -mt-0.5`}
          >
            {resolvedSubtitle}
          </span>
        )}
      </div>
    );
  };

  const content = (
    <div className={`flex items-center ${sizeConfig.gap} ${className}`}>
      {renderIcon()}
      {renderText()}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex items-center group transition">
        {content}
      </Link>
    );
  }

  return content;
};
