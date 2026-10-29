import { z } from 'zod';
export function loadConfig(env = process.env) {
  const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//), APP_ORIGIN: z.url(),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
    SESSION_DAYS: z.coerce.number().int().min(1).max(30).default(7),
    SMTP_HOST: z.string().default(''), SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z.enum(['true', 'false']).default('false'),
    SMTP_USER: z.string().default(''), SMTP_PASS: z.string().default(''), MAIL_FROM: z.string().default('')
  });
  const result = schema.safeParse(env);
  if (!result.success) throw new Error(`Invalid environment keys: ${[...new Set(result.error.issues.map(x => x.path[0]))].join(', ')}`);
  const c = result.data, origin = new URL(c.APP_ORIGIN);
  if (c.APP_ORIGIN !== origin.origin || !['http:', 'https:'].includes(origin.protocol)) throw new Error('APP_ORIGIN must be an exact HTTP(S) origin without trailing slash.');
  if (c.NODE_ENV === 'production' && origin.protocol !== 'https:') throw new Error('Production APP_ORIGIN requires HTTPS.');
  if (c.COOKIE_SAME_SITE === 'none' && c.NODE_ENV !== 'production') throw new Error('SameSite=None requires production HTTPS.');
  const mail = [c.SMTP_HOST, c.SMTP_USER, c.SMTP_PASS, c.MAIL_FROM];
  if (mail.some(Boolean) && !mail.every(Boolean)) throw new Error('Configure all SMTP fields, or leave all empty.');
  return { ...c, production: c.NODE_ENV === 'production', mailEnabled: mail.every(Boolean) };
}
