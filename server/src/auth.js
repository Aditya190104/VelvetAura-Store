import { Router } from 'express';
import bcrypt from 'bcrypt';
import { User } from './models.js';
import { ApiError, token, digest, publicUser, rateLimit } from './security.js';
import * as v from './validation.js';
export function authRoutes({ config, auth, mailer, dummyHash }) {
  const router = Router();
  router.get('/csrf', rateLimit('csrf', 100, 900000), async (req, res) => { if (!req.session) await auth.rotate(req, res); res.json({ data: { csrfToken: req.session.csrf } }); });
  router.get('/me', auth.requireUser, (req, res) => res.json({ data: { user: publicUser(req.user) } }));
  router.use(auth.csrf);
  router.post('/register', rateLimit('register', 10, 3600000), v.validate(v.register), async (req, res) => {
    const passwordHash = await bcrypt.hash(req.input.password, config.BCRYPT_ROUNDS), value = mailer.enabled ? token() : null;
    try {
      await User.create({ name: req.input.name, email: req.input.email, passwordHash, role: 'customer', ...(value ? { verifyHash: digest(value), verifyExpires: new Date(Date.now() + 86400000) } : {}) });
      if (value) { try { await mailer.send(req.input.email, 'verify', value); } catch { console.error('Verification mail delivery failed.'); } }
    } catch (e) { if (e.code !== 11000) throw e; }
    res.status(202).json({ data: { message: mailer.enabled ? 'Registration received. Check your email to verify a new account; existing members can sign in or request a reset.' : 'Registration received. You can try signing in. Email verification is unavailable until mail delivery is configured.' } });
  });
  router.post('/login', rateLimit('login-ip', 30, 900000), v.validate(v.login), rateLimit('login-account', 12, 900000, req => req.input.email), async (req, res) => {
    const user = await User.findOne({ email: req.input.email }).select('+passwordHash +authVersion');
    const valid = await bcrypt.compare(req.input.password, user?.passwordHash || dummyHash);
    if (!user || !valid || user.disabled) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    if (mailer.enabled && !user.emailVerified) throw new ApiError(403, 'EMAIL_UNVERIFIED', 'Verify your email first. You can request another verification email.');
    await auth.rotate(req, res, user);
    res.json({ data: { user: publicUser(user), csrfToken: req.session.csrf } });
  });
  router.post('/logout', async (req, res) => { await auth.logout(req, res); res.json({ data: { message: 'Signed out.' } }); });
  for (const [path, kind] of [['forgot-password', 'reset'], ['resend-verification', 'verify']]) {
    router.post(`/${path}`, rateLimit('email-ip', 5, 900000), v.validate(v.emailInput), rateLimit('email-account', 3, 900000, req => req.input.email), async (req, res) => {
      if (!mailer.enabled) throw new ApiError(503, 'EMAIL_NOT_CONFIGURED', 'Email delivery is not configured. Contact the site operator.');
      const value = token();
      const user = await User.findOneAndUpdate({ email: req.input.email, disabled: false, ...(kind === 'verify' ? { emailVerified: false } : {}) }, { $set: { [`${kind}Hash`]: digest(value), [`${kind}Expires`]: new Date(Date.now() + (kind === 'reset' ? 1800000 : 86400000)) } });
      if (user) { try { await mailer.send(user.email, kind, value); } catch { console.error('Account mail delivery failed.'); } }
      res.status(202).json({ data: { message: 'If an eligible account exists, an email will arrive shortly.' } });
    });
  }
  router.post('/reset-password', rateLimit('reset', 10, 900000), v.validate(v.reset), async (req, res) => {
    const passwordHash = await bcrypt.hash(req.input.password, config.BCRYPT_ROUNDS);
    const user = await User.findOneAndUpdate({ resetHash: digest(req.input.token), resetExpires: { $gt: new Date() }, disabled: false }, { $set: { passwordHash }, $inc: { authVersion: 1 }, $unset: { resetHash: 1, resetExpires: 1 } });
    if (!user) throw new ApiError(400, 'TOKEN_INVALID', 'This link is invalid or expired. Request a new one.');
    await auth.logout(req, res); res.json({ data: { message: 'Password changed. Previous sessions are invalidated. Please sign in.' } });
  });
  router.post('/verify-email', rateLimit('verify', 10, 900000), v.validate(v.tokenInput), async (req, res) => {
    const user = await User.findOneAndUpdate({ verifyHash: digest(req.input.token), verifyExpires: { $gt: new Date() }, disabled: false }, { $set: { emailVerified: true }, $unset: { verifyHash: 1, verifyExpires: 1 } });
    if (!user) throw new ApiError(400, 'TOKEN_INVALID', 'This link is invalid or expired. Request a new one.');
    res.json({ data: { message: 'Email verified. You can now sign in.' } });
  });
  router.patch('/profile', auth.requireUser, v.validate(v.profile), async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { name: req.input.name } }, { new: true, runValidators: true });
    res.json({ data: { user: publicUser(user) } });
  });
  router.post('/change-password', auth.requireUser, rateLimit('password-change', 8, 900000, req => String(req.user._id)), v.validate(v.changePassword), async (req, res) => {
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!await bcrypt.compare(req.input.currentPassword, user.passwordHash)) throw new ApiError(400, 'PASSWORD_INVALID', 'Current password is incorrect.');
    if (req.input.password === req.input.currentPassword) throw new ApiError(400, 'PASSWORD_UNCHANGED', 'Choose a different password.');
    const passwordHash = await bcrypt.hash(req.input.password, config.BCRYPT_ROUNDS);
    const updated = await User.findOneAndUpdate({ _id: user._id, passwordHash: user.passwordHash }, { $set: { passwordHash }, $inc: { authVersion: 1 }, $unset: { resetHash: 1, resetExpires: 1 } });
    if (!updated) throw new ApiError(409, 'ACCOUNT_CHANGED', 'Your account changed. Sign in again.');
    await auth.logout(req, res); res.json({ data: { message: 'Password changed. Sign in again on your devices.' } });
  });
  return router;
}
