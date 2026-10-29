import mongoose from 'mongoose';
import { loadConfig } from './config.js';
import { User } from './models.js';
const email = process.argv[2]?.trim().toLowerCase();
if (!email || process.argv[3] !== '--confirm') { console.error('Usage: npm run admin:promote -- verified@example.com --confirm'); process.exit(1); }
try {
  await mongoose.connect(loadConfig().MONGODB_URI);
  const user = await User.findOneAndUpdate({ email, disabled: false, emailVerified: true }, { $set: { role: 'admin' }, $inc: { authVersion: 1 } });
  if (!user) throw new Error('No enabled verified account.');
  console.log('Administrator role assigned. Sign in again; previous sessions invalidated.');
} catch { console.error('Promotion failed. Verify the account and check operator database access.'); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
