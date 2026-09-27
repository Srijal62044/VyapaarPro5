import React, { useEffect } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, ogImage, canonicalUrl }) => {
  const { settings } = useSettings();

  useEffect(() => {
    const appName = settings?.name || 'VyapaarPro';
    const pageTitle = title ? (title.includes(appName) ? title : `${title} | ${appName}`) : `${appName} | Digital Services Agency`;
    const pageDesc = description || settings?.tagline || 'High-performance digital engineering & agency platform.';

    document.title = pageTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', pageDesc);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', pageDesc);

    if (ogImage) {
      let ogImgMeta = document.querySelector('meta[property="og:image"]');
      if (!ogImgMeta) {
        ogImgMeta = document.createElement('meta');
        ogImgMeta.setAttribute('property', 'og:image');
        document.head.appendChild(ogImgMeta);
      }
      ogImgMeta.setAttribute('content', ogImage);
    }

    if (canonicalUrl) {
      let canonicalLink = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);
    }

    const iconUrl = settings?.favicon_url || settings?.logo_url;
    if (iconUrl) {
      let linkIcon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!linkIcon) {
        linkIcon = document.createElement('link');
        linkIcon.rel = 'icon';
        document.head.appendChild(linkIcon);
      }
      linkIcon.href = iconUrl;
    }
  }, [title, description, ogImage, canonicalUrl, settings]);

  return null;
};
