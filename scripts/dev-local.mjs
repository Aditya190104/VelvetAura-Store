// Development only: the existing API and a real, disk-backed MongoDB process.
// No remote database, production credentials, or mock authentication are used.
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer as createPortProbe } from 'node:net';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const serverRequire = createRequire(new URL('../server/package.json', import.meta.url));
const dataPath = resolve(root, 'server/.local-data/mongodb');
let mongo, mongoose, apiServer, frontend, stopping = false;

async function assertPortFree(port) {
  const probe = createPortProbe();
  await new Promise((resolve, reject) => {
    probe.once('error', () => reject(new Error(`Port ${port} is unavailable. Stop other VelvetAura terminals before running dev:local.`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}

async function close() {
  if (stopping) return;
  stopping = true;
  await frontend?.close();
  if (apiServer) {
    await new Promise(resolve => {
      apiServer.close(resolve);
      apiServer.closeAllConnections();
    });
  }
  await mongoose?.disconnect();
  // Never delete the development database on shutdown or failed startup.
  await mongo?.stop({ doCleanup: false, force: false });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    close().then(() => process.exit(0), () => process.exit(1));
  });
}

try {
  if (process.env.NODE_ENV === 'production') throw new Error('dev:local is for development only. Use the configured Express API in production.');
  await Promise.all([assertPortFree(4000), assertPortFree(5173)]);
  let MongoMemoryServer, createServer;
  try {
    ({ MongoMemoryServer } = serverRequire('mongodb-memory-server'));
    mongoose = serverRequire('mongoose');
    ({ createServer } = await import('vite'));
  } catch {
    throw new Error('Dependencies are missing. Run npm ci and npm ci --prefix server, then retry.');
  }
  await mkdir(dataPath, { recursive: true });
  console.log('Starting local MongoDB. The first run may download the MongoDB binary; keep this terminal open.');
  mongo = new MongoMemoryServer({
    instance: { dbPath: dataPath, dbName: 'velvetaura_local', storageEngine: 'wiredTiger', ip: '127.0.0.1' },
  });
  try { await mongo.start(); }
  catch {
    throw new Error('Local MongoDB could not start. Check the download/OS error above. You can use an installed MongoDB or Atlas with server/.env and npm run dev:api instead; see docs/ACCOUNT-SETUP.md.');
  }
  const [{ createApp }, { loadConfig }, { User, Session, RateBucket }] = await Promise.all([
    import('../server/src/app.js'), import('../server/src/config.js'), import('../server/src/models.js'),
  ]);
  const config = loadConfig({
    NODE_ENV: 'development', MONGODB_URI: mongo.getUri('velvetaura_local'),
    APP_ORIGIN: 'http://localhost:5173', PORT: '4000',
  });
  await mongoose.connect(config.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await Promise.all([User.init(), Session.init(), RateBucket.init()]);
  const app = await createApp(config);
  await new Promise((resolve, reject) => {
    apiServer = app.listen(4000, '127.0.0.1', resolve);
    apiServer.once('error', reject);
  });
  frontend = await createServer({
    root, configFile: resolve(root, 'vite.config.js'), mode: 'development',
    server: { host: '127.0.0.1', port: 5173, strictPort: true, open: false },
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api') },
  });
  await frontend.listen();
  console.log('\nVelvetAura is ready at http://localhost:5173');
  console.log('Create your account at http://localhost:5173/signup');
  console.log('Account data persists in server/.local-data/mongodb. Keep that folder private.');
  console.log('Email recovery is disabled in this local mode. Press Ctrl+C to stop.');
} catch (error) {
  console.error(`\nLocal setup stopped: ${error.message}`);
  await close().catch(() => {});
  process.exitCode = 1;
}
