import { createClient } from '@supabase/supabase-js';

const AUTHORIZED_ADMIN_EMAIL = 'kumarsrijal732@gmail.com';

/**
 * Serverless Admin Clients Directory Controller
 *
 * GET /api/admin/clients
 *
 * Securely retrieves registered customer and client profiles using service role,
 * protected by verified administrator authentication.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Database service unconfigured.' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    let isAdmin = false;

    if (token) {
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: userData, error: userError } = await authClient.auth.getUser(token);

      if (!userError && userData?.user) {
        const userEmail = (userData.user.email || '').toLowerCase().trim();
        if (
          userEmail === AUTHORIZED_ADMIN_EMAIL ||
          userData.user.app_metadata?.role === 'admin' ||
          userData.user.user_metadata?.role === 'admin'
        ) {
          isAdmin = true;
        }
      }
    }

    // If caller is not authorized admin, reject
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access Denied: Administrator permissions required.' });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch registered profiles from public.profiles
    const { data: profiles, error: profError } = await adminClient
      .from('profiles')
      .select('id, email, full_name, phone, company_name, role, avatar_url, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (profError) {
      console.error('Failed to query profiles:', profError);
      return res.status(500).json({ error: 'Failed to retrieve client directory from database.' });
    }

    return res.status(200).json({
      success: true,
      clients: profiles || [],
      count: profiles?.length || 0,
    });
  } catch (err: any) {
    console.error('Admin clients API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
