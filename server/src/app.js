import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import { sessions, rateLimit, ApiError, token } from './security.js';
import { createMailer } from './mail.js';
import { authRoutes } from './auth.js';
export async function createApp(config, overrides = {}) {
  const app = express(); app.disable('x-powered-by'); app.set('trust proxy', config.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.use(cors({ origin(origin, done) { done(origin && origin !== config.APP_ORIGIN ? new ApiError(403, 'ORIGIN_REJECTED', 'Request origin is not allowed.') : null, origin === config.APP_ORIGIN); }, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'] }));
  app.use(express.json({ limit: '16kb' })); app.use(cookieParser());
  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));
  app.use('/api', rateLimit('global', 300, 900000));
  const auth = sessions(config); app.use('/api', auth.load);
  app.use('/api/auth', authRoutes({ config, auth, mailer: overrides.mailer || createMailer(config), dummyHash: await bcrypt.hash(token(), config.BCRYPT_ROUNDS) }));
  app.get('/api/admin/access', auth.requireUser, auth.requireAdmin, (req, res) => res.json({ data: { role: 'admin' } }));
  app.use((req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API route not found.' } }));
  app.use((error, req, res, next) => {
    const known = error instanceof ApiError, malformed = error.type === 'entity.parse.failed', large = error.type === 'entity.too.large';
    const status = known ? error.status : malformed ? 400 : large ? 413 : 500;
    if (status === 500) console.error('API request failed.', { name: error.name, code: error.code });
    res.status(status).json({ error: { code: known ? error.code : 'REQUEST_ERROR', message: known ? error.message : malformed ? 'Invalid JSON.' : large ? 'Request body is too large.' : 'Something went wrong. Please try again.' } });
  });
  return app;
}
