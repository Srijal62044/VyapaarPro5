import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// Self-Contained Dynamic Social & Product Ordering Helpers (Zero External ESM Imports)
// ==============================================================================

interface OrderingFieldRule {
  field_key: string;
  label: string;
  field_type: string;
  placeholder?: string;
  help_text?: string;
  required: boolean;
  min_length?: number;
  max_length?: number;
  validation_rule?: string;
  options?: string[];
  display_order: number;
}

function getDefaultFieldsForService(product: {
  platform?: string | null;
  service_type?: string | null;
  name?: string;
  slug?: string;
}): OrderingFieldRule[] {
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
          required: true,
          min_length: 3,
          max_length: 500,
          display_order: 1,
        },
      ];
    }

    if (stype === 'comments' || name.includes('comment')) {
      return [
        {
          field_key: 'target_url',
          label: 'Instagram Post / Reel URL',
          field_type: 'url',
          required: true,
          min_length: 10,
          max_length: 500,
          display_order: 1,
        },
      ];
    }

    return [
      {
        field_key: 'target_url',
        label: 'Instagram Post / Reel URL',
        field_type: 'url',
        required: true,
        min_length: 10,
        max_length: 500,
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
          required: true,
          min_length: 10,
          max_length: 500,
          display_order: 1,
        },
      ];
    }

    return [
      {
        field_key: 'target_url',
        label: 'YouTube Video / Shorts Link',
        field_type: 'url',
        required: true,
        min_length: 10,
        max_length: 500,
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
      required: true,
      min_length: 3,
      max_length: 500,
      display_order: 1,
    },
  ];
}

function getEffectiveServiceFields(product: any): OrderingFieldRule[] {
  if (product.ordering_fields && Array.isArray(product.ordering_fields) && product.ordering_fields.length > 0) {
    return [...product.ordering_fields].sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
  }
  return getDefaultFieldsForService(product);
}

function calculateServicePrice(product: any, quantity: number): number {
  const qty = Math.max(1, Math.round(Number(quantity) || 1));
  const basePricePaise = Number(product.price_paise) || 0;
  const minQty = Number(product.min_quantity) || 1;

  if (product.platform && product.platform !== 'digital' && minQty > 1) {
    const unitPaise = basePricePaise / minQty;
    return Math.max(100, Math.round(qty * unitPaise));
  }

  return basePricePaise * qty;
}

function validateOrderingFields(
  fields: OrderingFieldRule[],
  submittedValues: Record<string, any>,
  quantity: number,
  product: any
): { valid: boolean; errors: Record<string, string>; calculatedTotalPaise: number } {
  const errors: Record<string, string> = {};

  // 1. Quantity Validation
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

  // 2. Sensitive Keyword Rejection (Never allow passwords or tokens)
  const forbiddenPatterns = [
    /password/i,
    /passcode/i,
    /auth[_-]?token/i,
    /session[_-]?token/i,
    /secret[_-]?key/i,
    /\b2fa\b/i,
    /\botp\b/i,
  ];

  for (const [key, val] of Object.entries(submittedValues || {})) {
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(key) || pattern.test(lower)) {
          if (lower.includes('password') || lower.includes('otp') || lower.includes('token')) {
            errors[key] = 'Security alert: For your safety, never share passwords, OTPs, or access tokens.';
          }
        }
      }
    }
  }

  // 3. Field-Level Validation
  for (const field of fields) {
    const val = submittedValues?.[field.field_key];
    const strVal = typeof val === 'string' ? val.trim() : val != null ? String(val).trim() : '';

    if (field.required && !strVal) {
      errors[field.field_key] = `${field.label} is required.`;
      continue;
    }

    if (!strVal) continue;

    if (field.min_length && strVal.length < field.min_length) {
      errors[field.field_key] = `${field.label} must be at least ${field.min_length} characters.`;
    }

    if (field.max_length && strVal.length > field.max_length) {
      errors[field.field_key] = `${field.label} cannot exceed ${field.max_length} characters.`;
    }

    if (field.field_type === 'url') {
      const isHttp = /^https?:\/\//i.test(strVal);
      if (!isHttp && !strVal.includes('.')) {
        errors[field.field_key] = `Please enter a valid URL starting with http:// or https://`;
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

// ==============================================================================
// Serverless Route Handler
// ==============================================================================

export default async function handler(req: any, res: any) {
  // Safe diagnostic log (No secrets, No sensitive customer data)
  console.log('[create-order] Received request:', {
    method: req.method,
    hasBody: !!req.body,
    contentType: req.headers?.['content-type'] || 'unknown',
  });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Safe Robust Request Body Parsing
    let body: any = {};
    if (typeof req.body === 'string') {
      try {
        body = req.body.trim() ? JSON.parse(req.body) : {};
      } catch (parseErr) {
        console.warn('[create-order] JSON parse error on string body');
        return res.status(400).json({ error: 'Invalid JSON request payload.' });
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }

    const {
      productId,
      quantity,
      customerName,
      customerEmail,
      customerPhone,
      serviceFields,
      userId,
      idempotencyKey,
    } = body;

    if (!productId || !customerEmail || !customerPhone) {
      return res.status(400).json({
        error: 'Product ID, customer email, and WhatsApp/mobile phone number are required.',
      });
    }

    const cleanPhone = (customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        error: 'Please provide a valid 10-digit WhatsApp or mobile number.',
      });
    }

    // 2. Supabase Client Initialization
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    const hasDbConfig = !!(supabaseUrl && supabaseKey);
    console.log('[create-order] Database configuration check:', { configured: hasDbConfig });

    if (!hasDbConfig) {
      return res.status(500).json({ error: 'Database service is not configured.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Check Idempotency Key
    if (idempotencyKey) {
      console.log('[create-order] Checking idempotency key');
      const { data: existingOrder } = await supabase
        .from('store_orders')
        .select('*, store_order_items(*)')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingOrder) {
        console.log('[create-order] Existing order found via idempotency key');
        return res.status(200).json({
          success: true,
          order: {
            ...existingOrder,
            items: existingOrder.store_order_items || [],
          },
          isExisting: true,
        });
      }
    }

    // 4. Fetch Product from Database
    console.log('[create-order] Fetching product from database');
    const { data: product, error: productError } = await supabase
      .from('store_products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'PUBLISHED')
      .single();

    if (productError || !product) {
      console.warn('[create-order] Product lookup failed or not published');
      return res.status(404).json({ error: 'Product not found or unavailable for purchase.' });
    }

    // 5. Server-Side Validation of Quantity and Service Fields
    const parsedQty = Math.max(1, Math.round(Number(quantity) || Number(product.min_quantity) || 1));
    const effectiveFields = getEffectiveServiceFields(product);
    const submittedData = serviceFields && typeof serviceFields === 'object' ? serviceFields : {};

    const validation = validateOrderingFields(effectiveFields, submittedData, parsedQty, product);
    if (!validation.valid) {
      console.warn('[create-order] Field validation failed');
      const firstError = Object.values(validation.errors)[0] || 'Invalid ordering field values provided.';
      return res.status(400).json({ error: firstError, details: validation.errors });
    }

    // 6. Server-Side Price Calculation (Paise)
    const totalPaise = calculateServicePrice(product, parsedQty);
    const unitPricePaise = Math.round(totalPaise / parsedQty);

    const targetUrl = submittedData.target_url || submittedData.link || submittedData.url || null;
    const targetUsername = submittedData.target_username || submittedData.username || null;

    // 7. Generate Order Number: VP-ORD-XXXXXXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const orderNumber = `VP-ORD-${rand}`;

    console.log('[create-order] Inserting order into store_orders table');
    // 8. Create Order Record
    const { data: order, error: orderError } = await supabase
      .from('store_orders')
      .insert({
        user_id: userId || null,
        order_number: orderNumber,
        subtotal_paise: totalPaise,
        discount_paise: 0,
        total_paise: totalPaise,
        currency: 'INR',
        status: 'CREATED',
        customer_name: (customerName || '').trim() || null,
        customer_email: customerEmail.toLowerCase().trim(),
        customer_phone: (customerPhone || '').trim() || null,
        idempotency_key: idempotencyKey || null,
        service_fields_snapshot: submittedData,
        target_url: targetUrl,
        target_username: targetUsername,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('[create-order] Database error creating order record:', orderError?.message || orderError);
      return res.status(500).json({ error: 'Failed to create order record in database.' });
    }

    // 9. Create Order Item Snapshot
    console.log('[create-order] Inserting order item into store_order_items table');
    const { data: orderItem, error: itemError } = await supabase
      .from('store_order_items')
      .insert({
        order_id: order.id,
        product_id: product.id,
        product_name_snapshot: product.name,
        unit_price_paise: unitPricePaise,
        quantity: parsedQty,
        total_paise: totalPaise,
        fields_snapshot: submittedData,
      })
      .select()
      .single();

    if (itemError) {
      console.warn('[create-order] Order item creation notice:', itemError?.message || itemError);
    }

    console.log('[create-order] Order created successfully with status CREATED');

    return res.status(201).json({
      success: true,
      order: {
        ...order,
        items: orderItem ? [orderItem] : [],
      },
    });
  } catch (err: any) {
    console.error('[create-order] Unhandled error:', err?.message || err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
