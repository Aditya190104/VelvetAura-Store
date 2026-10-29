import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Session, User, RateBucket } from './models.js';
export const token = () => randomBytes(32).toString('hex');
export const digest = value => createHash('sha256').update(value).digest('hex');
export function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export class ApiError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
export const publicUser = u => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, emailVerified: u.emailVerified });
export function rateLimit(name, limit, windowMs, key = req => req.ip) {
  return async (req, res, next) => {
    const bucket = Math.floor(Date.now() / windowMs), id = digest(`${name}:${key(req)}:${bucket}`);
    let row;
    try { row = await RateBucket.findOneAndUpdate({ _id: id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * windowMs) } }, { upsert: true, new: true }); }
    catch (e) { if (e.code !== 11000) throw e; row = await RateBucket.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { new: true }); }
    if (row.count > limit) { res.set('Retry-After', String(Math.max(1, Math.ceil(((bucket + 1) * windowMs - Date.now()) / 1000)))); throw new ApiError(429, 'RATE_LIMITED', 'Too many attempts. Please try again later.'); }
    next();
  };
}
export function sessions(config) {
  const name = config.production ? '__Host-va_session' : 'va_session';
  const options = { httpOnly: true, secure: config.production, sameSite: config.COOKIE_SAME_SITE, path: '/' };
  async function load(req, res, next) {
    const value = req.cookies[name];
    if (typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)) req.session = await Session.findOne({ tokenHash: digest(value), expiresAt: { $gt: new Date() } });
    next();
  }
  async function rotate(req, res, user = null) {
    if (req.session) await Session.deleteOne({ _id: req.session._id });
    const value = token(), maxAge = user ? config.SESSION_DAYS * 86400000 : 1800000;
    req.session = await Session.create({ tokenHash: digest(value), csrf: token(), ...(user ? { userId: user._id, authVersion: user.authVersion } : {}), expiresAt: new Date(Date.now() + maxAge) });
    res.cookie(name, value, { ...options, maxAge });
  }
  async function logout(req, res) { if (req.session) await Session.deleteOne({ _id: req.session._id }); res.clearCookie(name, options); }
  function csrf(req, res, next) {
    if (req.get('origin') !== config.APP_ORIGIN) throw new ApiError(403, 'ORIGIN_REJECTED', 'Request origin is not allowed.');
    if (!req.is('application/json')) throw new ApiError(415, 'JSON_REQUIRED', 'Send an application/json request.');
    if (!req.session || !equal(req.session.csrf, req.get('x-csrf-token'))) throw new ApiError(403, 'CSRF_INVALID', 'Your security token expired. Please try again.');
    next();
  }
  async function requireUser(req, res, next) {
    if (!req.session?.userId) throw new ApiError(401, 'UNAUTHENTICATED', 'Please sign in to continue.');
    const user = await User.findById(req.session.userId).select('+authVersion');
    if (!user || user.disabled || user.authVersion !== req.session.authVersion) { await logout(req, res); throw new ApiError(401, 'SESSION_EXPIRED', 'Please sign in again.'); }
    req.user = user; next();
  }
  function requireAdmin(req, res, next) { if (req.user?.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Administrator access is required.'); next(); }
  return { load, rotate, logout, csrf, requireUser, requireAdmin };
}
