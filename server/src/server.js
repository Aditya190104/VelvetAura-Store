import mongoose from 'mongoose';
import { loadConfig } from './config.js';
import { createApp } from './app.js';
import { User, Session, RateBucket } from './models.js';
try {
  const config = loadConfig();
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([User.init(), Session.init(), RateBucket.init()]);
  const app = await createApp(config);
  const server = app.listen(config.PORT, () => console.log(`VelvetAura API listening on port ${config.PORT}. Email: ${config.mailEnabled ? 'configured' : 'not configured'}.`));
  const shutdown = () => { server.close(async () => { await mongoose.disconnect(); process.exit(0); }); setTimeout(() => process.exit(1), 10000).unref(); };
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
} catch { console.error('API startup failed. Check environment configuration, MongoDB connectivity and dependencies.'); process.exitCode = 1; }
