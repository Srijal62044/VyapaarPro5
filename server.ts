import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import API handlers
import createOrderHandler from './api/store/create-order.js';
import paymentCreateHandler from './api/store/payment/create.js';
import paymentVerifyHandler from './api/store/payment/verify.js';
import downloadHandler from './api/store/download.js';
import reviewOrderHandler from './api/store/admin/review-order.js';
import webhookHandler from './api/famgateway-webhook.js';
import contactHandler from './api/contact.js';
import serviceRequestHandler from './api/service-request.js';
import rateLimitHandler from './api/rate-limit.js';
import aiSupportHandler from './api/ai-support.js';
import supportTicketCreateHandler from './api/support/tickets/create.js';
import supportTicketsHandler from './api/support/tickets/index.js';
import supportTicketReplyHandler from './api/support/tickets/reply.js';
import supportAdminHandler from './api/support/admin/index.js';
import supportSettingsHandler from './api/support/settings.js';
import uploadValidateHandler from './api/upload-validate.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

// Parse JSON and URL-encoded bodies with raw body preservation for webhooks
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to adapt serverless handler (req, res) to Express route
const adaptHandler = (handler: any) => async (req: express.Request, res: express.Response) => {
  try {
    await handler(req, res);
  } catch (err: any) {
    console.error(`Error in route ${req.path}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }
};

// API Routes
app.all('/api/store/create-order', adaptHandler(createOrderHandler));
app.all('/api/store/payment/create', adaptHandler(paymentCreateHandler));
app.all('/api/store/payment/verify', adaptHandler(paymentVerifyHandler));
app.all('/api/store/download', adaptHandler(downloadHandler));
app.all('/api/store/admin/review-order', adaptHandler(reviewOrderHandler));
app.all('/api/famgateway-webhook', adaptHandler(webhookHandler));
app.all('/api/payments/famgateway/webhook', adaptHandler(webhookHandler));
app.all('/api/contact', adaptHandler(contactHandler));
app.all('/api/service-request', adaptHandler(serviceRequestHandler));
app.all('/api/rate-limit', adaptHandler(rateLimitHandler));
app.all('/api/upload-validate', adaptHandler(uploadValidateHandler));

// AI Support & Customer Ticketing Routes
app.all('/api/ai-support', adaptHandler(aiSupportHandler));
app.all('/api/support/tickets/create', adaptHandler(supportTicketCreateHandler));
app.all('/api/support/tickets/reply', adaptHandler(supportTicketReplyHandler));
app.all('/api/support/tickets', adaptHandler(supportTicketsHandler));
app.all('/api/support/admin', adaptHandler(supportAdminHandler));
app.all('/api/support/settings', adaptHandler(supportSettingsHandler));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'VyapaarPro API', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (!isProd) {
    // Development mode: Mount Vite dev middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VyapaarPro Server running on http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
