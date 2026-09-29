import { createClient } from '@supabase/supabase-js';
import {
  getEffectiveServiceFields,
  validateOrderingFields,
  calculateServicePrice,
} from '../../../src/services/socialServiceFields';
import { INITIAL_STORE_PRODUCTS } from '../../../src/services/storeSeedData';
import { cacheOrder } from './order-store';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    // 1. If idempotencyKey provided, check if order already exists in Supabase
    if (idempotencyKey && supabase) {
      try {
        const { data: existingOrder } = await supabase
          .from('store_orders')
          .select('*, store_order_items(*)')
          .eq('idempotency_key', idempotencyKey)
          .single();

        if (existingOrder) {
          cacheOrder(existingOrder);
          return res.status(200).json({
            success: true,
            order: {
              ...existingOrder,
              items: existingOrder.store_order_items || [],
            },
            isExisting: true,
          });
        }
      } catch (err) {
        // Continue if column not found
      }
    }

    // 2. Fetch product from database or initial catalogue to verify status and price
    let product: any = null;

    if (supabase) {
      try {
        const { data: dbProduct } = await supabase
          .from('store_products')
          .select('*')
          .eq('id', productId)
          .single();

        if (dbProduct) {
          product = dbProduct;
        }
      } catch (err) {
        // Fallback to seed
      }
    }

    if (!product) {
      const seedMatch = INITIAL_STORE_PRODUCTS.find((p: any) => p.slug === productId || (p as any).id === productId);
      if (seedMatch) {
        product = {
          ...seedMatch,
          id: (seedMatch as any).id || productId,
        };
      }
    }

    if (!product) {
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

    // Validate UUID format for user_id to prevent FK/UUID syntax errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = typeof userId === 'string' && uuidRegex.test(userId) ? userId : null;

    let createdOrder: any = null;
    let createdOrderItem: any = null;

    // 6. Create Order Record with full submitted fields snapshot
    if (supabase) {
      try {
        // Attempt 1: Full extended schema insert
        const { data: order1, error: error1 } = await supabase
          .from('store_orders')
          .insert({
            user_id: validUserId,
            order_number: orderNumber,
            subtotal_paise: totalPaise,
            discount_paise: 0,
            total_paise: totalPaise,
            currency: 'INR',
            status: 'PAYMENT_PENDING',
            fulfillment_status: 'UNFULFILLED',
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

        if (!error1 && order1) {
          createdOrder = order1;
        } else {
          // Attempt 2: Standard schema insert without dynamic columns if schema differs
          const { data: order2, error: error2 } = await supabase
            .from('store_orders')
            .insert({
              user_id: validUserId,
              order_number: orderNumber,
              total_paise: totalPaise,
              currency: 'INR',
              status: 'PAYMENT_PENDING',
              fulfillment_status: 'UNFULFILLED',
              customer_name: (customerName || '').trim() || null,
              customer_email: customerEmail.toLowerCase().trim(),
              customer_phone: (customerPhone || '').trim() || null,
            })
            .select()
            .single();

          if (!error2 && order2) {
            createdOrder = order2;
          } else {
            console.warn('Supabase store_orders insert warning:', error2 || error1);
          }
        }

        // Create Order Item Snapshot in DB if order was created
        if (createdOrder) {
          const { data: itemData } = await supabase
            .from('store_order_items')
            .insert({
              order_id: createdOrder.id,
              product_id: product.id,
              product_name_snapshot: product.name,
              unit_price_paise: unitPricePaise,
              quantity: parsedQty,
              total_paise: totalPaise,
              fields_snapshot: submittedData,
            })
            .select()
            .single();

          createdOrderItem = itemData;
        }
      } catch (dbErr) {
        console.warn('Database order creation notice:', dbErr);
      }
    }

    // Fallback: If DB insert was not possible or returned null, construct safe valid order object
    if (!createdOrder) {
      createdOrder = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        user_id: validUserId,
        order_number: orderNumber,
        subtotal_paise: totalPaise,
        discount_paise: 0,
        total_paise: totalPaise,
        currency: 'INR',
        status: 'PAYMENT_PENDING',
        fulfillment_status: 'UNFULFILLED',
        customer_name: (customerName || '').trim() || null,
        customer_email: customerEmail.toLowerCase().trim(),
        customer_phone: (customerPhone || '').trim() || null,
        service_fields_snapshot: submittedData,
        target_url: targetUrl,
        target_username: targetUsername,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const finalOrder = {
      ...createdOrder,
      items: createdOrderItem ? [createdOrderItem] : [
        {
          id: `item_${Date.now()}`,
          order_id: createdOrder.id,
          product_id: product.id,
          product_name_snapshot: product.name,
          unit_price_paise: unitPricePaise,
          quantity: parsedQty,
          total_paise: totalPaise,
          fields_snapshot: submittedData,
        }
      ],
    };

    // Cache order globally on server so FamGateway checkout can immediately find it
    cacheOrder(finalOrder);

    return res.status(201).json({
      success: true,
      order: finalOrder,
    });
  } catch (err: any) {
    console.error('create-order endpoint error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
