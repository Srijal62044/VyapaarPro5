import ticketsCreateHandler from '../../server/handlers/support/tickets-create';
import ticketsIndexHandler from '../../server/handlers/support/tickets-index';
import ticketsReplyHandler from '../../server/handlers/support/tickets-reply';
import adminHandler from '../../server/handlers/support/admin';
import settingsHandler from '../../server/handlers/support/settings';

/**
 * Consolidated Support API Catch-All Router for Vercel Serverless
 *
 * Routes handled:
 * - /api/support/tickets/create
 * - /api/support/tickets/reply
 * - /api/support/tickets
 * - /api/support/admin
 * - /api/support/settings
 */
export default async function handler(req: any, res: any) {
  // CORS & Preflight Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');

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
    const match = pathname.replace(/^\/api\/support\/?/, '');
    routeSegments = match.split('/').filter(Boolean);
  }

  const subroute = routeSegments.join('/').toLowerCase();

  switch (subroute) {
    case 'tickets/create':
      return ticketsCreateHandler(req, res);

    case 'tickets/reply':
      return ticketsReplyHandler(req, res);

    case 'tickets':
    case '':
      return ticketsIndexHandler(req, res);

    case 'admin':
      return adminHandler(req, res);

    case 'settings':
      return settingsHandler(req, res);

    default:
      return res.status(404).json({
        error: `Support route not found: ${subroute || '/'}`,
        validRoutes: [
          '/api/support/tickets/create',
          '/api/support/tickets/reply',
          '/api/support/tickets',
          '/api/support/admin',
          '/api/support/settings',
        ],
      });
  }
}
