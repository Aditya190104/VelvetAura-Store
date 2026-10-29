import { z } from 'zod';
export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z.string().min(12, 'Use at least 12 characters.').max(72).refine(v => Buffer.byteLength(v) <= 72, 'Use at most 72 UTF-8 bytes.');
export const register = z.object({ name: z.string().trim().min(2).max(80), email, password }).strict();
export const login = z.object({ email, password: z.string().min(1).max(128) }).strict();
export const emailInput = z.object({ email }).strict();
export const tokenInput = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export const reset = tokenInput.extend({ password }).strict();
export const profile = z.object({ name: z.string().trim().min(2).max(80) }).strict();
export const changePassword = z.object({ currentPassword: z.string().min(1).max(128), password }).strict();
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } });
    req.input = result.data; next();
  };
}
