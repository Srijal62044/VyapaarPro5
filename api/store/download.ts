import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const downloadId = req.query?.downloadId || req.query?.id || req.body?.downloadId;

    if (!downloadId) {
      return res.status(400).json({ error: 'Download ID parameter is required.' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return res.status(401).json({ error: 'Authentication required to download digital products.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Database service unconfigured.' });
    }

    // 1. Verify user token
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);

    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired user session.' });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email?.toLowerCase();

    // 2. Use service role to check download record, order status & product file
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: download, error: dlError } = await adminClient
      .from('store_downloads')
      .select('*, store_orders(*), store_products(*)')
      .eq('id', downloadId)
      .single();

    if (dlError || !download) {
      return res.status(404).json({ error: 'Download access record not found.' });
    }

    // Check authorization: Must belong to this user OR user is admin
    const isAuthorizedAdmin = userEmail === 'kumarsrijal732@gmail.com';
    const isOwner = download.user_id === userId;

    if (!isOwner && !isAuthorizedAdmin) {
      return res.status(403).json({ error: 'Access Denied: You do not own this digital product.' });
    }

    // Check if revoked
    if (download.revoked_at) {
      return res.status(403).json({ error: 'Access to this download has been revoked.' });
    }

    // Check order status
    const order = download.store_orders;
    if (!order || order.status !== 'PAID') {
      return res.status(402).json({ error: 'Payment required: Order is not verified as PAID.' });
    }

    // Check product file path
    const product = download.store_products;
    const productFilePath = product?.product_file_path;

    if (!productFilePath) {
      return res.status(404).json({ error: 'No downloadable digital file is attached to this product.' });
    }

    // 3. Generate short-lived signed URL (300 seconds / 5 minutes)
    const { data: signedUrlData, error: signError } = await adminClient.storage
      .from('store-products-private')
      .createSignedUrl(productFilePath, 300, {
        download: product.file_name || `${product.slug || 'download'}.zip`,
      });

    if (signError || !signedUrlData?.signedUrl) {
      console.error('Storage signed URL generation error:', signError);
      return res.status(500).json({ error: 'Failed to generate secure download link.' });
    }

    // 4. Increment download count and update last_downloaded_at
    await adminClient
      .from('store_downloads')
      .update({
        download_count: (download.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', downloadId);

    return res.status(200).json({
      success: true,
      downloadUrl: signedUrlData.signedUrl,
      fileName: product.file_name || 'download.zip',
      expiresInSeconds: 300,
    });
  } catch (err: any) {
    console.error('download endpoint error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
