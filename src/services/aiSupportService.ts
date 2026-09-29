import {
  SupportTicket,
  SupportTicketMessage,
  SupportConversation,
  SupportMessage,
  AISupportSettings,
  SupportTicketCategory,
  SupportTicketPriority,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const GUEST_SESSION_KEY = 'vp_ai_support_guest_session_v1';
const LOCAL_CONVERSATIONS_KEY = 'vp_ai_support_conversations_v1';
const LOCAL_TICKETS_KEY = 'vp_support_tickets_v1';

export function getOrCreateGuestSessionId(): string {
  try {
    let id = localStorage.getItem(GUEST_SESSION_KEY);
    if (!id) {
      id = `gst-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return id;
  } catch (e) {
    return `gst-temp-${Date.now()}`;
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        return { Authorization: `Bearer ${session.access_token}` };
      }
    } catch (e) {}
  }
  return {};
}

export const aiSupportService = {
  // ============================================================================
  // 1. AI SUPPORT CHAT
  // ============================================================================
  async sendMessage(params: {
    message: string;
    conversationId?: string | null;
    contextType?: 'general' | 'product' | 'service' | 'order';
    contextId?: string | null;
  }): Promise<{
    reply: string;
    conversation_id: string;
    requires_human: boolean;
    suggested_actions?: string[];
  }> {
    const authHeaders = await getAuthHeader();
    const guestSessionId = getOrCreateGuestSessionId();

    try {
      const res = await fetch('/api/ai-support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          conversation_id: params.conversationId || undefined,
          message: params.message,
          guest_session_id: guestSessionId,
          context_type: params.contextType || 'general',
          context_id: params.contextId || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.reply) {
        return {
          reply: data.reply,
          conversation_id: data.conversation_id || params.conversationId || `conv-${Date.now()}`,
          requires_human: Boolean(data.requires_human),
          suggested_actions: data.suggested_actions,
        };
      }

      throw new Error(data.error || data.reply || 'Failed to get response');
    } catch (err: any) {
      console.warn('AI support network notice, using local fallback:', err);
      // Resilient local intelligent fallback
      const msg = params.message.toLowerCase();
      let reply = "Hello! I am VyapaarPro AI Support. We deliver high-performing web applications, software templates, and verified social media growth services. How can I help you today?";
      let requires_human = false;

      if (msg.includes('talk to human') || msg.includes('admin') || msg.includes('representative')) {
        reply = "I understand you'd like to speak with a human. You can create a support ticket directly with our team, or reach out on WhatsApp.";
        requires_human = true;
      } else if (msg.includes('website') || msg.includes('service') || msg.includes('price')) {
        reply = "VyapaarPro offers custom web development starting from ₹14,999 and full-stack SaaS builds. Check our Services page (/services) or Store (/store) for full details.";
      } else if (msg.includes('order') || msg.includes('track')) {
        reply = "You can view your active orders and downloads in your Customer Orders vault (/orders) or track any reference on /track-order.";
      }

      return {
        reply,
        conversation_id: params.conversationId || `conv-${Date.now()}`,
        requires_human,
        suggested_actions: requires_human ? ['create_ticket', 'contact_whatsapp'] : undefined,
      };
    }
  },

  // ============================================================================
  // 2. SUPPORT TICKETS (CUSTOMER & GUEST)
  // ============================================================================
  async createTicket(params: {
    subject: string;
    message: string;
    category?: SupportTicketCategory;
    priority?: SupportTicketPriority;
    order_id?: string | null;
    guest_name?: string | null;
    guest_email?: string | null;
    guest_phone?: string | null;
  }): Promise<{ success: boolean; ticket: SupportTicket }> {
    const authHeaders = await getAuthHeader();

    try {
      const res = await fetch('/api/support/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(params),
      });

      const data = await res.json();
      if (res.ok && data?.ticket) {
        return { success: true, ticket: data.ticket };
      }
      throw new Error(data.error || 'Failed to create support ticket');
    } catch (err: any) {
      console.warn('Ticket creation server call notice, storing locally:', err);
      // Local storage fallback
      const now = new Date().toISOString();
      const num = Math.floor(1000 + Math.random() * 9000);
      const fallbackTicket: SupportTicket = {
        id: `tck-${Date.now()}`,
        ticket_number: `VP-TCK-${num}`,
        user_id: null,
        guest_name: params.guest_name,
        guest_email: params.guest_email,
        guest_phone: params.guest_phone,
        subject: params.subject,
        message: params.message,
        category: params.category || 'General',
        priority: params.priority || 'normal',
        status: 'open',
        order_id: params.order_id,
        created_at: now,
        updated_at: now,
        messages: [
          {
            id: `msg-${Date.now()}`,
            ticket_id: `tck-${Date.now()}`,
            sender_type: 'customer',
            sender_name: params.guest_name || 'Customer',
            message: params.message,
            is_internal: false,
            created_at: now,
          },
        ],
      };

      try {
        const raw = localStorage.getItem(LOCAL_TICKETS_KEY);
        const list: SupportTicket[] = raw ? JSON.parse(raw) : [];
        list.unshift(fallbackTicket);
        localStorage.setItem(LOCAL_TICKETS_KEY, JSON.stringify(list));
      } catch (e) {}

      return { success: true, ticket: fallbackTicket };
    }
  },

  async getCustomerTickets(): Promise<SupportTicket[]> {
    const authHeaders = await getAuthHeader();

    try {
      const res = await fetch('/api/support/tickets', {
        headers: { ...authHeaders },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data?.tickets)) {
        return data.tickets;
      }
    } catch (err) {
      console.warn('Failed to fetch tickets from server, checking local cache:', err);
    }

    try {
      const raw = localStorage.getItem(LOCAL_TICKETS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  async getTicketById(id: string): Promise<SupportTicket | null> {
    const authHeaders = await getAuthHeader();

    try {
      const res = await fetch(`/api/support/tickets?id=${encodeURIComponent(id)}`, {
        headers: { ...authHeaders },
      });
      const data = await res.json();
      if (res.ok && data?.ticket) {
        return data.ticket;
      }
    } catch (err) {}

    try {
      const raw = localStorage.getItem(LOCAL_TICKETS_KEY);
      const list: SupportTicket[] = raw ? JSON.parse(raw) : [];
      return list.find((t) => t.id === id || t.ticket_number === id) || null;
    } catch (e) {
      return null;
    }
  },

  async replyToTicket(params: {
    ticket_id: string;
    message: string;
    is_internal?: boolean;
  }): Promise<{ success: boolean; message: SupportTicketMessage }> {
    const authHeaders = await getAuthHeader();

    const res = await fetch('/api/support/tickets/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit reply');
    }

    return data;
  },

  // ============================================================================
  // 3. ADMIN SUPPORT OPERATIONS
  // ============================================================================
  async getAdminSupportDashboard(): Promise<{
    stats: {
      totalTickets: number;
      openTickets: number;
      inProgressTickets: number;
      waitingForCustomer: number;
      resolvedTickets: number;
      urgentTickets: number;
      humanSupportRequests: number;
    };
    tickets: SupportTicket[];
    conversations: any[];
  }> {
    const authHeaders = await getAuthHeader();
    const res = await fetch('/api/support/admin', {
      headers: { ...authHeaders },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch admin support dashboard');
    }

    return data;
  },

  async updateAdminTicket(params: {
    ticket_id: string;
    status?: string;
    priority?: string;
    assigned_admin_id?: string | null;
    internal_notes?: string;
  }): Promise<{ success: boolean; ticket: SupportTicket }> {
    const authHeaders = await getAuthHeader();
    const res = await fetch('/api/support/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        action: 'update_ticket',
        ...params,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update ticket');
    }

    return data;
  },

  async resolveHumanRequest(conversationId: string): Promise<boolean> {
    const authHeaders = await getAuthHeader();
    const res = await fetch('/api/support/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        action: 'resolve_human_request',
        conversation_id: conversationId,
      }),
    });

    const data = await res.json();
    return Boolean(data.success);
  },

  // ============================================================================
  // 4. ADMIN AI SETTINGS
  // ============================================================================
  async getAISettings(): Promise<AISupportSettings & { has_server_gemini_key: boolean }> {
    const authHeaders = await getAuthHeader();
    const res = await fetch('/api/support/settings', {
      headers: { ...authHeaders },
    });

    const data = await res.json();
    if (!res.ok || !data.settings) {
      throw new Error(data.error || 'Failed to fetch AI settings');
    }

    return data.settings;
  },

  async updateAISettings(updates: Partial<AISupportSettings>): Promise<AISupportSettings> {
    const authHeaders = await getAuthHeader();
    const res = await fetch('/api/support/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update AI settings');
    }

    return data.settings;
  },
};
