import { createClient } from '@supabase/supabase-js';
import {
  getEffectiveServiceFields,
  validateOrderingFields,
  calculateServicePrice,
} from '../../src/services/socialServiceFields';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
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
      return res.status(400).json({ error: 'Product ID, customer email, and WhatsApp/mobile phone number are required.' });
    }

    const cleanPhone = (customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit WhatsApp or mobile number.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Database service unconfigured.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. If idempotencyKey provided, check if order already exists
    if (idempotencyKey) {
      const { data: existingOrder } = await supabase
        .from('store_orders')
        .select('*, store_order_items(*)')
        .eq('idempotency_key', idempotencyKey)
        .single();

      if (existingOrder) {
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

    // 2. Fetch product from database to verify status and price
    const { data: product, error: productError } = await supabase
      .from('store_products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'PUBLISHED')
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found or unavailable for purchase.' });
    }

    // 3. Server-side validation of quantity and dynamic service fields
    const parsedQty = Math.max(1, Math.round(Number(quantity) || Number(product.min_quantity) || 1));
    const effectiveFields = getEffectiveServiceFields(product as any);
    const submittedData = serviceFields && typeof serviceFields === 'object' ? serviceFields : {};

    const validation = validateOrderingFields(effectiveFields, submittedData, parsedQty, product as any);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0] || 'Invalid ordering field values provided.';
      return res.status(400).json({ error: firstError, details: validation.errors });
    }

    // 4. Server-Side Price Calculation (Never trust client-sent price!)
    const totalPaise = calculateServicePrice(product as any, parsedQty);
    const unitPricePaise = Math.round(totalPaise / parsedQty);

    // Extract convenient target link/username for quick queries
    const targetUrl = submittedData.target_url || submittedData.link || submittedData.url || null;
    const targetUsername = submittedData.target_username || submittedData.username || null;

    // 5. Generate secure order number: VP-ORD-XXXXXXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const orderNumber = `VP-ORD-${rand}`;

    // 6. Create Order Record with full submitted fields snapshot
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
      console.error('Order creation error:', orderError);
      return res.status(500).json({ error: 'Failed to create order record.' });
    }

    // 7. Create Order Item Snapshot with item-level fields snapshot
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
      console.error('Order item creation error:', itemError);
    }

    return res.status(201).json({
      success: true,
      order: {
        ...order,
        items: orderItem ? [orderItem] : [],
      },
    });
  } catch (err: any) {
    console.error('create-order endpoint error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
