import createOrderHandler from './create-order.ts';
import paymentCreateHandler from './payment/create.ts';
import paymentVerifyHandler from '../../server/handlers/store/payment-verify.ts';
import downloadHandler from '../../server/handlers/store/download.ts';
import reviewOrderHandler from '../../server/handlers/store/review-order.ts';

/**
 * Consolidated Store API Catch-All Router for Vercel Serverless
 *
 * Routes handled:
 * - /api/store/create-order
 * - /api/store/payment/create
 * - /api/store/payment/verify
 * - /api/store/download
 * - /api/store/admin/review-order
 */
export default async function handler(req: any, res: any) {
  try {
    // CORS & Preflight Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-FamGateway-Signature, X-Signature, X-Api-Key'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Determine subroute from query parameter (Vercel catch-all) or URL pathname
    let routeSegments: string[] = [];
    const queryRoute = req.query?.route || req.query?.path;

    if (Array.isArray(queryRoute)) {
      routeSegments = queryRoute;
    } else if (typeof queryRoute === 'string') {
      routeSegments = queryRoute.split('/').filter(Boolean);
    } else if (req.url) {
      const pathname = (req.originalUrl || req.url).split('?')[0] || '';
      const match = pathname.replace(/^\/api\/store\/?/, '');
      routeSegments = match.split('/').filter(Boolean);
    }

    const subroute = routeSegments.join('/').toLowerCase();

    console.log('[Store Router] Incoming request:', {
      method: req.method,
      subroute,
      url: req.url,
      hasAuth: !!(req.headers?.authorization || req.headers?.Authorization),
    });

    switch (subroute) {
      case 'create-order':
        return await createOrderHandler(req, res);

      case 'payment/create':
        return await paymentCreateHandler(req, res);

      case 'payment/verify':
        return await paymentVerifyHandler(req, res);

      case 'download':
        return await downloadHandler(req, res);

      case 'admin/review-order':
        return await reviewOrderHandler(req, res);

      default:
        res.setHeader('Content-Type', 'application/json');
        return res.status(404).json({
          success: false,
          error: `Store route not found: ${subroute || '/'}`,
          validRoutes: [
            '/api/store/create-order',
            '/api/store/payment/create',
            '/api/store/payment/verify',
            '/api/store/download',
            '/api/store/admin/review-order',
          ],
        });
    }
  } catch (routerErr: any) {
    console.error('[Store Router] Fatal catch-all exception:', routerErr);
    try {
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        error: routerErr?.message || 'Internal Server Error in Store Router',
        requestId: `err_${Date.now()}`,
      });
    } catch (sendErr) {
      console.error('[Store Router] Failed to send error response:', sendErr);
      return res.end();
    }
  }
}
