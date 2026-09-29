import createOrderHandler from '../../server/handlers/store/create-order';
import paymentCreateHandler from '../../server/handlers/store/payment-create';
import paymentVerifyHandler from '../../server/handlers/store/payment-verify';
import downloadHandler from '../../server/handlers/store/download';
import reviewOrderHandler from '../../server/handlers/store/review-order';

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
  // CORS & Preflight Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-FamGateway-Signature, X-Signature, X-Api-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Determine subroute from query parameter (Vercel catch-all) or URL pathname
  let routeSegments: string[] = [];
  const queryRoute = req.query?.route;

  if (Array.isArray(queryRoute)) {
    routeSegments = queryRoute;
  } else if (typeof queryRoute === 'string') {
    routeSegments = queryRoute.split('/').filter(Boolean);
  } else if (req.url) {
    const pathname = req.url.split('?')[0] || '';
    const match = pathname.replace(/^\/api\/store\/?/, '');
    routeSegments = match.split('/').filter(Boolean);
  }

  const subroute = routeSegments.join('/').toLowerCase();

  switch (subroute) {
    case 'create-order':
      return createOrderHandler(req, res);

    case 'payment/create':
      return paymentCreateHandler(req, res);

    case 'payment/verify':
      return paymentVerifyHandler(req, res);

    case 'download':
      return downloadHandler(req, res);

    case 'admin/review-order':
      return reviewOrderHandler(req, res);

    default:
      return res.status(404).json({
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
}
