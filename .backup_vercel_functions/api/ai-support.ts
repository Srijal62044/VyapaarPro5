import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// In-memory rate limiter per IP / session ID
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit = 10, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}

// In-memory conversations store fallback
const memoryConversations = new Map<string, any>();
const memoryMessages = new Map<string, any[]>();

export default async function handler(req: any, res: any) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Guest-Session');

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
      conversation_id,
      message,
      guest_session_id,
      context_type = 'general',
      context_id = null,
    } = body;

    const trimmedMessage = (message || '').trim();
    if (!trimmedMessage) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    if (trimmedMessage.length > 1000) {
      return res.status(400).json({ error: 'Message length cannot exceed 1,000 characters.' });
    }

    // Client identifier for rate limiting
    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'guest').toString().split(',')[0].trim();
    const rateLimitKey = guest_session_id || clientIp;

    const rateResult = checkRateLimit(rateLimitKey, 12, 60000);
    if (!rateResult.allowed) {
      return res.status(429).json({
        reply: "You're sending messages too quickly. Please wait a moment and try again.",
        rateLimited: true,
      });
    }

    // Supabase client initialization
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    // 1. Authenticate user if Bearer token present
    let authenticatedUser: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
      const token = authHeader.substring(7);
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          authenticatedUser = user;
        }
      } catch (err) {
        // Token invalid or expired
      }
    }

    // 2. Prompt Injection Defense
    const hostilePatterns = [
      /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
      /show\s+(me\s+)?(your\s+)?system\s+prompt/i,
      /give\s+(me\s+)?(the\s+)?database\s+password/i,
      /give\s+(me\s+)?(the\s+)?service[_-]?role\s+key/i,
      /reveal\s+(hidden|internal)\s+(instructions|prompt|keys)/i,
      /tell\s+me\s+admin\s+credentials/i,
      /approve\s+(my\s+)?payment/i,
      /change\s+(my\s+)?order\s+status/i,
      /show\s+other\s+customers/i,
    ];

    const isHostile = hostilePatterns.some((pattern) => pattern.test(trimmedMessage));
    if (isHostile) {
      return res.status(200).json({
        reply: "I am designed to assist you with VyapaarPro services, products, and support inquiries. I cannot modify administrative records, reveal system configurations, or execute privileged commands. How can I help you with our services today?",
        requires_human: false,
      });
    }

    // 3. Human Handoff Intent Detection
    const humanHandoffPatterns = [
      /talk\s+to\s+(a\s+)?human/i,
      /contact\s+admin/i,
      /human\s+support/i,
      /i\s+want\s+to\s+speak\s+to\s+someone/i,
      /speak\s+with\s+(an\s+)?agent/i,
      /i\s+need\s+personal\s+help/i,
      /this\s+didn'?t\s+solve\s+my\s+problem/i,
      /connect\s+me\s+with\s+(a\s+)?representative/i,
      /real\s+person/i,
      /customer\s+care\s+number/i,
    ];

    const requestedHuman = humanHandoffPatterns.some((p) => p.test(trimmedMessage));

    // 4. Retrieve Live Knowledge Sources
    // Services
    let servicesCatalog: any[] = [];
    if (supabase) {
      const { data: dbServices } = await supabase
        .from('services')
        .select('name, slug, description, short_description, price, price_type, features, is_active')
        .eq('is_active', true);
      if (dbServices && dbServices.length > 0) {
        servicesCatalog = dbServices;
      }
    }

    // Products (from Supabase or fallback catalog)
    let productsCatalog: any[] = [];
    if (supabase) {
      const { data: dbProducts } = await supabase
        .from('store_products')
        .select('name, slug, platform, service_type, short_description, price_paise, min_quantity, max_quantity, delivery_time_info, status')
        .eq('status', 'PUBLISHED');
      if (dbProducts && dbProducts.length > 0) {
        productsCatalog = dbProducts;
      }
    }
    if (productsCatalog.length === 0) {
      productsCatalog = [
        { name: 'Instagram Followers (HQ Real)', slug: 'instagram-followers-hq', platform: 'Instagram', service_type: 'followers', short_description: 'High quality real Instagram followers with 30-day refill.', price_paise: 9900, min_quantity: 100, max_quantity: 100000, delivery_time_info: 'Instant start (0-1 hour)', status: 'PUBLISHED' },
        { name: 'YouTube Monetizable Views', slug: 'youtube-views-monetizable', platform: 'YouTube', service_type: 'views', short_description: 'High-retention lifetime guaranteed YouTube views.', price_paise: 14900, min_quantity: 500, max_quantity: 500000, delivery_time_info: '1-3 hours start', status: 'PUBLISHED' },
        { name: 'Telegram Channel Members', slug: 'telegram-members', platform: 'Telegram', service_type: 'members', short_description: 'Instant non-drop Telegram channel members.', price_paise: 7900, min_quantity: 100, max_quantity: 50000, delivery_time_info: 'Instant start', status: 'PUBLISHED' },
      ];
    }

    // AI Settings & Custom Knowledge
    let aiSettings = {
      is_enabled: true,
      welcome_message: 'Hello! I am VyapaarPro AI Support.',
      fallback_message: 'I do not have enough verified information to answer that accurately. Would you like me to connect you with our team or create a support ticket?',
      system_instructions: 'You are the official AI Support specialist for VyapaarPro (https://vyapaarpro.in).',
      support_email: 'support@vyapaarpro.in',
      support_phone: '+91 98765 43210',
      custom_knowledge: '',
    };

    if (supabase) {
      const { data: settingsData } = await supabase
        .from('ai_support_settings')
        .select('*')
        .eq('id', 'default')
        .single();
      if (settingsData) {
        aiSettings = { ...aiSettings, ...settingsData };
      }
    }

    if (!aiSettings.is_enabled) {
      return res.status(200).json({
        reply: "AI Support is currently in maintenance mode. Please reach our human team directly via WhatsApp or submit a support ticket.",
        requires_human: true,
        suggested_actions: ['create_ticket', 'whatsapp'],
      });
    }

    // 5. Logged-in Customer's OWN Orders (Secure Server-Side Enforcement)
    let customerOrdersSummary = '';
    const mentionsOrder = /order|tracking|status|payment\s+done|delivery|purchased/i.test(trimmedMessage);

    if (authenticatedUser) {
      if (mentionsOrder && supabase) {
        const { data: userOrders } = await supabase
          .from('store_orders')
          .select('id, order_number, total_paise, status, fulfillment_status, created_at, store_order_items(product_name_snapshot, quantity)')
          .eq('user_id', authenticatedUser.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (userOrders && userOrders.length > 0) {
          customerOrdersSummary = `\nAuthenticated Customer's Own Recent Orders (SAFE TO MENTION ONLY TO THIS USER):\n` +
            userOrders.map((o: any) =>
              `- Order #${o.order_number}: ₹${(o.total_paise / 100).toFixed(2)}, Status: ${o.status}, Fulfillment: ${o.fulfillment_status || 'UNFULFILLED'}, Items: ${(o.store_order_items || []).map((i: any) => `${i.product_name_snapshot} (Qty: ${i.quantity})`).join(', ')}`
            ).join('\n');
        } else {
          customerOrdersSummary = `\nAuthenticated customer currently has 0 orders recorded in the system.`;
        }
      }
    } else if (mentionsOrder && !context_id) {
      customerOrdersSummary = `\nThe visitor is NOT logged in. If they ask about personal order status, politely invite them to log in to their account at /login or look up their order on /track-order with their Order Reference.`;
    }

    // 6. Context-Specific Focus (Product or Service)
    let specificContextText = '';
    if (context_type === 'product' && context_id) {
      const targetProd = productsCatalog.find((p) => p.slug === context_id || p.name.toLowerCase().includes(context_id.toLowerCase()));
      if (targetProd) {
        specificContextText = `\nCurrently Selected Product Context:\n- Name: ${targetProd.name}\n- Price: ₹${(targetProd.price_paise / 100).toFixed(2)}\n- Platform: ${targetProd.platform}\n- Description: ${targetProd.short_description}\n- Min Qty: ${targetProd.min_quantity}, Max Qty: ${targetProd.max_quantity}\n- Delivery Time: ${targetProd.delivery_time_info}`;
      }
    } else if (context_type === 'service' && context_id) {
      const targetSrv = servicesCatalog.find((s) => s.slug === context_id || s.name.toLowerCase().includes(context_id.toLowerCase()));
      if (targetSrv) {
        specificContextText = `\nCurrently Selected Engineering Service Context:\n- Name: ${targetSrv.name}\n- Price: ₹${targetSrv.price} (${targetSrv.price_type || 'fixed'})\n- Description: ${targetSrv.short_description || targetSrv.description}\n- Features: ${Array.isArray(targetSrv.features) ? targetSrv.features.join(', ') : targetSrv.features}`;
      }
    }

    // 7. Human handoff shortcut
    if (requestedHuman) {
      // Save conversation state if conversation_id provided
      const convId = conversation_id || `conv-${Date.now()}`;
      if (supabase && conversation_id) {
        await supabase
          .from('support_conversations')
          .update({ requires_human: true, updated_at: new Date().toISOString() })
          .eq('id', conversation_id);
      }

      return res.status(200).json({
        reply: "I understand you would like to connect with our human team. You can create a direct support ticket right here, or chat with our team on WhatsApp for immediate assistance.",
        conversation_id: convId,
        requires_human: true,
        suggested_actions: ['create_ticket', 'contact_whatsapp'],
      });
    }

    // 8. Construct Safe Knowledge Context
    const systemInstruction = `
${aiSettings.system_instructions}

CORE PRINCIPLES:
1. You are the AI Support Specialist for VyapaarPro (https://vyapaarpro.in).
2. Never invent prices or services not in the verified catalog.
3. Be friendly, concise, natural, and helpful. You speak English and Hindi/Hinglish fluently. Match the user's language.
4. Support policy: Payments are processed safely via FamGateway UPI QR. After payment, orders are verified by admin before download/access release.
5. Safety: NEVER request passwords, OTPs, UPI PINs, or private keys. If a user asks how to pay, direct them to checkout with WhatsApp/mobile number.
6. If you cannot answer with high confidence, do not guess. Say: "${aiSettings.fallback_message}" and recommend creating a support ticket or contacting WhatsApp.

VERIFIED VYAPAARPRO KNOWLEDGE:
- Official Website: https://vyapaarpro.in
- Support Email: ${aiSettings.support_email}
- WhatsApp Consultation: ${aiSettings.support_phone}
- Main Agency Services: Custom Web Development, Full-Stack SaaS Boilerplates, Mobile App Development, UI/UX Design, E-Commerce Portals, SEO & Brand Growth.
- Social Media Growth Store: Covers 13 platforms including Instagram (Followers, Likes, Reels Views), YouTube (Subscribers, Views, Shorts), Facebook, Telegram, TikTok, X/Twitter, Threads, Snapchat, Pinterest, LinkedIn, Discord, and Spotify. All services are non-drop and safe with password-free delivery.
${specificContextText}
${customerOrdersSummary}
${aiSettings.custom_knowledge ? `\nAdditional Admin Knowledge:\n${aiSettings.custom_knowledge}` : ''}

TOP SERVICES CATALOG:
${servicesCatalog.slice(0, 10).map((s) => `- ${s.name}: ₹${s.price} (${s.short_description || s.description})`).join('\n')}

TOP PRODUCTS CATALOG:
${productsCatalog.slice(0, 15).map((p) => `- ${p.name} (${p.platform}): ₹${(p.price_paise / 100).toFixed(2)}, Speed: ${p.delivery_time_info || 'Fast'}`).join('\n')}
`.trim();

    // 9. Call Gemini SDK (@google/genai)
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    let aiResponseText = '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nCustomer Message: "${trimmedMessage}"\n\nAI Response:` }],
            },
          ],
        });

        aiResponseText = response.text?.trim() || '';
      } catch (geminiErr: any) {
        console.error('Gemini API execution notice:', geminiErr);
        // Fallback message without exposing error
        aiResponseText = "VyapaarPro offers custom web development, mobile applications, and non-drop social media growth services. How can I assist you today? You can also create a support ticket or reach our team on WhatsApp.";
      }
    } else {
      // Deterministic intelligent keyword fallback if API key is not configured in environment
      const lower = trimmedMessage.toLowerCase();
      if (lower.includes('service') || lower.includes('website') || lower.includes('app')) {
        aiResponseText = "VyapaarPro provides full-stack web development, custom SaaS platforms, mobile applications, and UI/UX design. You can explore all offerings on our Services page (/services) or submit requirements for a custom quote.";
      } else if (lower.includes('instagram') || lower.includes('youtube') || lower.includes('follower') || lower.includes('views') || lower.includes('social')) {
        aiResponseText = "We offer high-retention, password-free growth services for Instagram, YouTube, Telegram, Facebook, X, and more starting at ₹29. You can browse all packages directly in our Store (/store).";
      } else if (lower.includes('payment') || lower.includes('pay') || lower.includes('gateway')) {
        aiResponseText = "We accept instant UPI QR payments via FamGateway. Every transaction is securely logged with your order number. Once completed, your order is reviewed and access is unlocked.";
      } else if (lower.includes('order') || lower.includes('track')) {
        aiResponseText = authenticatedUser
          ? "You can view all your orders, payment approvals, and active downloads in your Customer Orders dashboard (/orders)."
          : "To check your order status, please log in to your account at /login or use our Track Orders page (/track-order) with your Order Reference.";
      } else {
        aiResponseText = "Hello! I am VyapaarPro AI Support. I can help answer questions about our digital services, software products, or placing an order. How can I assist you today?";
      }
    }

    // 10. Persist Conversation and Messages
    let finalConversationId = conversation_id;
    const now = new Date().toISOString();

    if (supabase) {
      try {
        if (!finalConversationId) {
          // Create new conversation
          const { data: convData } = await supabase
            .from('support_conversations')
            .insert({
              user_id: authenticatedUser?.id || null,
              guest_session_id: guest_session_id || null,
              title: trimmedMessage.slice(0, 50),
              status: 'active',
              requires_human: requestedHuman,
              context_type,
              context_id,
            })
            .select('id')
            .single();

          if (convData) finalConversationId = convData.id;
        }

        if (finalConversationId) {
          // Record Customer message
          await supabase.from('support_messages').insert({
            conversation_id: finalConversationId,
            sender_type: 'customer',
            message: trimmedMessage,
          });

          // Record AI response
          await supabase.from('support_messages').insert({
            conversation_id: finalConversationId,
            sender_type: 'ai',
            message: aiResponseText,
          });
        }
      } catch (dbErr) {
        console.warn('Database conversation save notice:', dbErr);
      }
    } else {
      // Memory Store fallback
      if (!finalConversationId) {
        finalConversationId = `conv-${Date.now()}`;
        memoryConversations.set(finalConversationId, {
          id: finalConversationId,
          user_id: authenticatedUser?.id || null,
          guest_session_id,
          created_at: now,
        });
        memoryMessages.set(finalConversationId, []);
      }

      const msgs = memoryMessages.get(finalConversationId) || [];
      msgs.push(
        { id: `msg-${Date.now()}-1`, sender_type: 'customer', message: trimmedMessage, created_at: now },
        { id: `msg-${Date.now()}-2`, sender_type: 'ai', message: aiResponseText, created_at: now }
      );
      memoryMessages.set(finalConversationId, msgs);
    }

    return res.status(200).json({
      reply: aiResponseText,
      conversation_id: finalConversationId || `conv-${Date.now()}`,
      requires_human: requestedHuman,
      suggested_actions: requestedHuman ? ['create_ticket', 'contact_whatsapp'] : undefined,
    });
  } catch (err: any) {
    console.error('AI Support endpoint error:', err);
    return res.status(500).json({
      reply: "AI Support is temporarily unavailable. You can create a support ticket or reach our team on WhatsApp for immediate help.",
      requires_human: true,
      suggested_actions: ['create_ticket', 'contact_whatsapp'],
    });
  }
}
