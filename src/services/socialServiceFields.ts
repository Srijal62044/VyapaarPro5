import { SocialServiceFieldConfig, StoreProduct } from '../types';

/**
 * Returns intelligent, platform- and service-type specific default ordering fields
 * when no custom fields have been explicitly configured by admin.
 */
export function getDefaultFieldsForService(product: {
  platform?: string | null;
  service_type?: string | null;
  name?: string;
  slug?: string;
}): SocialServiceFieldConfig[] {
  const plat = (product.platform || '').toLowerCase().trim();
  const stype = (product.service_type || '').toLowerCase().trim();
  const name = (product.name || '').toLowerCase();
  const slug = (product.slug || '').toLowerCase();

  // If digital product / code / template, no social media URLs needed
  if (plat === 'digital' || stype === 'boilerplate' || slug.includes('boilerplate') || slug.includes('starter')) {
    return [];
  }

  // 1. INSTAGRAM
  if (plat === 'instagram' || slug.includes('instagram')) {
    if (stype === 'followers' || name.includes('follower')) {
      return [
        {
          field_key: 'target_url',
          label: 'Instagram Profile Link or @Username',
          field_type: 'text',
          placeholder: 'https://instagram.com/username or @username',
          help_text: 'Ensure your account is public during delivery. No password required.',
          required: true,
          min_length: 3,
          max_length: 500,
          validation_rule: 'instagram_profile',
          display_order: 1,
        },
        {
          field_key: 'additional_instructions',
          label: 'Special Instructions (Optional)',
          field_type: 'textarea',
          placeholder: 'Any delivery pacing requests or account details...',
          help_text: 'Never enter account passwords, OTPs, or private tokens.',
          required: false,
          max_length: 1000,
          display_order: 2,
        },
      ];
    }

    if (stype === 'comments' || name.includes('comment')) {
      return [
        {
          field_key: 'target_url',
          label: 'Instagram Post / Reel URL',
          field_type: 'url',
          placeholder: 'https://www.instagram.com/p/... or /reel/...',
          help_text: 'Provide the direct URL to your public post or reel.',
          required: true,
          min_length: 10,
          max_length: 500,
          validation_rule: 'url',
          display_order: 1,
        },
        {
          field_key: 'custom_comments',
          label: 'Custom Comments (One per line)',
          field_type: 'textarea',
          placeholder: 'Awesome content!\nLoving this!\nGreat insights!',
          help_text: 'Enter custom comments you would like posted, or leave blank for organic positive comments.',
          required: false,
          max_length: 2000,
          display_order: 2,
        },
      ];
    }

    if (stype === 'views' || name.includes('view') || name.includes('reel')) {
      return [
        {
          field_key: 'target_url',
          label: 'Instagram Reel or Video Link',
          field_type: 'url',
          placeholder: 'https://www.instagram.com/reel/...',
          help_text: 'Direct link to the reel or video you want to boost.',
          required: true,
          min_length: 10,
          max_length: 500,
          validation_rule: 'url',
          display_order: 1,
        },
      ];
    }

    // Likes, saves, shares
    return [
      {
        field_key: 'target_url',
        label: 'Instagram Post / Reel URL',
        field_type: 'url',
        placeholder: 'https://www.instagram.com/p/... or /reel/...',
        help_text: 'Direct link to your post, photo, carousel, or reel.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // 2. YOUTUBE
  if (plat === 'youtube' || slug.includes('youtube')) {
    if (stype === 'subscribers' || name.includes('subscriber')) {
      return [
        {
          field_key: 'target_url',
          label: 'YouTube Channel Link',
          field_type: 'url',
          placeholder: 'https://youtube.com/@yourchannel or /channel/...',
          help_text: 'Provide full channel link. Ensure subscriber count is public.',
          required: true,
          min_length: 10,
          max_length: 500,
          validation_rule: 'youtube_channel',
          display_order: 1,
        },
      ];
    }

    if (name.includes('shorts')) {
      return [
        {
          field_key: 'target_url',
          label: 'YouTube Shorts URL',
          field_type: 'url',
          placeholder: 'https://youtube.com/shorts/...',
          help_text: 'Direct link to your published YouTube Short.',
          required: true,
          min_length: 10,
          max_length: 500,
          validation_rule: 'url',
          display_order: 1,
        },
      ];
    }

    if (name.includes('watch') || name.includes('hour')) {
      return [
        {
          field_key: 'target_url',
          label: 'YouTube Video Link (30+ or 60+ min video recommended)',
          field_type: 'url',
          placeholder: 'https://www.youtube.com/watch?v=...',
          help_text: 'Link to a long video on your channel to log watch hours.',
          required: true,
          min_length: 10,
          max_length: 500,
          validation_rule: 'url',
          display_order: 1,
        },
      ];
    }

    // Default YouTube Views/Likes
    return [
      {
        field_key: 'target_url',
        label: 'YouTube Video / Shorts Link',
        field_type: 'url',
        placeholder: 'https://www.youtube.com/watch?v=... or /shorts/...',
        help_text: 'Direct link to the video. Ensure embedding and country restrictions are open.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // 3. FACEBOOK
  if (plat === 'facebook' || slug.includes('facebook')) {
    if (stype === 'followers' || name.includes('follower') || name.includes('page')) {
      return [
        {
          field_key: 'target_url',
          label: 'Facebook Page URL',
          field_type: 'url',
          placeholder: 'https://facebook.com/yourpage',
          help_text: 'Direct link to your public Facebook Business Page or Creator Profile.',
          required: true,
          min_length: 10,
          max_length: 500,
          validation_rule: 'url',
          display_order: 1,
        },
      ];
    }

    if (name.includes('reaction') || name.includes('like')) {
      return [
        {
          field_key: 'target_url',
          label: 'Facebook Post URL',
          field_type: 'url',
          placeholder: 'https://facebook.com/.../posts/...',
          help_text: 'Direct link to the public post.',
          required: true,
          min_length: 10,
          max_length: 500,
          validation_rule: 'url',
          display_order: 1,
        },
        {
          field_key: 'reaction_type',
          label: 'Preferred Reaction',
          field_type: 'select',
          options: ['Like 👍', 'Love ❤️', 'Care 🤗', 'Wow 😮', 'Haha 😂', 'Mixed Reactions'],
          help_text: 'Select your preferred reaction emoji.',
          required: false,
          display_order: 2,
        },
      ];
    }

    return [
      {
        field_key: 'target_url',
        label: 'Facebook Video or Reel URL',
        field_type: 'url',
        placeholder: 'https://facebook.com/watch/?v=... or reel URL',
        help_text: 'Public video link.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // 4. X / TWITTER
  if (plat === 'twitter' || plat === 'x' || slug.includes('twitter')) {
    if (stype === 'followers' || name.includes('follower')) {
      return [
        {
          field_key: 'target_url',
          label: 'X (Twitter) Profile URL or @Handle',
          field_type: 'text',
          placeholder: 'https://x.com/username or @username',
          help_text: 'Ensure profile is set to public.',
          required: true,
          min_length: 2,
          max_length: 500,
          validation_rule: 'twitter_handle',
          display_order: 1,
        },
      ];
    }

    return [
      {
        field_key: 'target_url',
        label: 'Tweet / Post URL',
        field_type: 'url',
        placeholder: 'https://x.com/username/status/123456789',
        help_text: 'Direct link to the specific tweet.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // 5. TELEGRAM
  if (plat === 'telegram' || slug.includes('telegram')) {
    if (stype === 'members' || name.includes('member')) {
      return [
        {
          field_key: 'target_url',
          label: 'Public Telegram Channel / Group Link',
          field_type: 'text',
          placeholder: 'https://t.me/yourchannel or @channelname',
          help_text: 'Must be a public channel or group.',
          required: true,
          min_length: 4,
          max_length: 500,
          display_order: 1,
        },
      ];
    }

    return [
      {
        field_key: 'target_url',
        label: 'Telegram Post Link',
        field_type: 'text',
        placeholder: 'https://t.me/yourchannel/1234',
        help_text: 'Direct link to the specific post broadcast.',
        required: true,
        min_length: 6,
        max_length: 500,
        display_order: 1,
      },
    ];
  }

  // 6. TIKTOK
  if (plat === 'tiktok' || slug.includes('tiktok')) {
    if (stype === 'followers' || name.includes('follower')) {
      return [
        {
          field_key: 'target_url',
          label: 'TikTok Profile Link or @Username',
          field_type: 'text',
          placeholder: 'https://www.tiktok.com/@username or @username',
          help_text: 'Ensure account is public.',
          required: true,
          min_length: 2,
          max_length: 500,
          display_order: 1,
        },
      ];
    }

    return [
      {
        field_key: 'target_url',
        label: 'TikTok Video URL',
        field_type: 'url',
        placeholder: 'https://www.tiktok.com/@username/video/...',
        help_text: 'Direct link to the video.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // 7. THREADS
  if (plat === 'threads' || slug.includes('threads')) {
    if (stype === 'followers' || name.includes('follower')) {
      return [
        {
          field_key: 'target_url',
          label: 'Threads Profile Link or @Username',
          field_type: 'text',
          placeholder: 'https://www.threads.net/@username',
          help_text: 'Public Threads profile.',
          required: true,
          min_length: 2,
          max_length: 500,
          display_order: 1,
        },
      ];
    }

    return [
      {
        field_key: 'target_url',
        label: 'Threads Post Link',
        field_type: 'url',
        placeholder: 'https://www.threads.net/@username/post/...',
        help_text: 'Direct link to the thread post.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // 8. SNAPCHAT
  if (plat === 'snapchat' || slug.includes('snapchat')) {
    return [
      {
        field_key: 'target_url',
        label: 'Snapchat Public Profile or Story Link',
        field_type: 'text',
        placeholder: 'https://www.snapchat.com/add/username or @username',
        help_text: 'Public profile or Spotlight link.',
        required: true,
        min_length: 3,
        max_length: 500,
        display_order: 1,
      },
    ];
  }

  // 9. PINTEREST
  if (plat === 'pinterest' || slug.includes('pinterest')) {
    return [
      {
        field_key: 'target_url',
        label: 'Pinterest Profile or Pin URL',
        field_type: 'url',
        placeholder: 'https://pinterest.com/username or /pin/...',
        help_text: 'Link to your profile or specific pin.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // 10. LINKEDIN
  if (plat === 'linkedin' || slug.includes('linkedin')) {
    return [
      {
        field_key: 'target_url',
        label: 'LinkedIn Profile / Company Page URL',
        field_type: 'url',
        placeholder: 'https://www.linkedin.com/in/... or /company/...',
        help_text: 'Public LinkedIn personal profile, creator profile, or company page.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // 11. DISCORD
  if (plat === 'discord' || slug.includes('discord')) {
    return [
      {
        field_key: 'target_url',
        label: 'Permanent Discord Server Invite Link',
        field_type: 'url',
        placeholder: 'https://discord.gg/yourinvite',
        help_text: 'Must be set to "Never Expire" with unlimited uses.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // 12. SPOTIFY
  if (plat === 'spotify' || slug.includes('spotify')) {
    return [
      {
        field_key: 'target_url',
        label: 'Spotify Track, Album, or Artist Link',
        field_type: 'url',
        placeholder: 'https://open.spotify.com/track/... or /artist/...',
        help_text: 'Direct Spotify sharing link.',
        required: true,
        min_length: 10,
        max_length: 500,
        validation_rule: 'url',
        display_order: 1,
      },
    ];
  }

  // Default fallback for any other social service
  return [
    {
      field_key: 'target_url',
      label: 'Target URL / Profile Link',
      field_type: 'text',
      placeholder: 'https://... or username',
      help_text: 'Target profile, post, or channel.',
      required: true,
      min_length: 3,
      max_length: 500,
      display_order: 1,
    },
  ];
}

/**
 * Gets effective ordering fields for a product, preferring any admin-customized
 * fields, and falling back to intelligent defaults.
 */
export function getEffectiveServiceFields(product: StoreProduct): SocialServiceFieldConfig[] {
  if (product.ordering_fields && Array.isArray(product.ordering_fields) && product.ordering_fields.length > 0) {
    return [...product.ordering_fields].sort((a, b) => a.display_order - b.display_order);
  }
  return getDefaultFieldsForService(product);
}

/**
 * Calculates service order price in paise based on service rules & quantity.
 */
export function calculateServicePrice(product: StoreProduct, quantity: number): number {
  const qty = Math.max(1, Math.round(Number(quantity) || 1));
  const basePricePaise = Number(product.price_paise) || 0;
  const minQty = Number(product.min_quantity) || 1;

  // If social media service with min_quantity > 1, base price corresponds to min_quantity package
  if (product.platform && product.platform !== 'digital' && minQty > 1) {
    const unitPaise = basePricePaise / minQty;
    return Math.max(100, Math.round(qty * unitPaise));
  }

  // Otherwise standard unit/package calculation
  return basePricePaise * qty;
}

/**
 * Validates dynamic ordering fields and quantity client-side and server-side.
 * Strictly enforces that NO passwords, OTPs, or session tokens can be submitted.
 */
export function validateOrderingFields(
  fields: SocialServiceFieldConfig[],
  submittedValues: Record<string, any>,
  quantity: number,
  product: StoreProduct
): {
  valid: boolean;
  errors: Record<string, string>;
  calculatedTotalPaise: number;
} {
  const errors: Record<string, string> = {};

  // 1. QUANTITY VALIDATION
  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = 'Quantity must be a positive whole number.';
  } else {
    if (product.min_quantity && quantity < product.min_quantity) {
      errors.quantity = `Minimum order quantity for this service is ${product.min_quantity.toLocaleString()}.`;
    }
    if (product.max_quantity && quantity > product.max_quantity) {
      errors.quantity = `Maximum order quantity for this service is ${product.max_quantity.toLocaleString()}.`;
    }
  }

  // 2. FORBIDDEN CREDENTIALS / SENSITIVE KEYWORDS CHECK (SECURITY SECTION 9)
  const forbiddenPatterns = [
    /password/i,
    /passcode/i,
    /auth[_-]?token/i,
    /session[_-]?token/i,
    /cookie/i,
    /secret[_-]?key/i,
    /\b2fa\b/i,
    /\botp\b/i,
    /one[_-]?time[_-]?password/i,
  ];

  for (const [key, val] of Object.entries(submittedValues || {})) {
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(key) || pattern.test(lower)) {
          // If customer tried to supply a password or OTP
          if (lower.includes('password') || lower.includes('otp') || lower.includes('token')) {
            errors[key] = 'Security alert: For your safety, never share passwords, OTPs, or access tokens.';
          }
        }
      }
    }
  }

  // 3. FIELD-SPECIFIC VALIDATION
  for (const field of fields) {
    const val = submittedValues?.[field.field_key];
    const strVal = typeof val === 'string' ? val.trim() : val != null ? String(val).trim() : '';

    // Required check
    if (field.required && !strVal) {
      errors[field.field_key] = `${field.label} is required.`;
      continue;
    }

    if (!strVal) continue; // Skip optional empty fields

    // Min length
    if (field.min_length && strVal.length < field.min_length) {
      errors[field.field_key] = `${field.label} must be at least ${field.min_length} characters.`;
    }

    // Max length
    if (field.max_length && strVal.length > field.max_length) {
      errors[field.field_key] = `${field.label} cannot exceed ${field.max_length} characters.`;
    }

    // URL validation
    if (field.field_type === 'url') {
      const isHttp = /^https?:\/\//i.test(strVal);
      if (!isHttp && !strVal.includes('.')) {
        errors[field.field_key] = `Please enter a valid URL starting with http:// or https://`;
      }
    }

    // Select options check
    if (field.field_type === 'select' && field.options && field.options.length > 0) {
      if (!field.options.includes(strVal)) {
        errors[field.field_key] = `Please select a valid option from the list.`;
      }
    }
  }

  const calculatedTotalPaise = calculateServicePrice(product, quantity);

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    calculatedTotalPaise,
  };
}
