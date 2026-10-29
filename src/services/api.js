import { isLocalHost, resolveApiBase } from '../utils/api-config';
export const localAccountSetup = isLocalHost(window.location.hostname);
const base = resolveApiBase({ url: import.meta.env.VITE_API_URL, development: import.meta.env.DEV, hostname: window.location.hostname });
export const apiConfigured = Boolean(base);
let csrfToken, csrfPromise;
export const resetCsrf = () => { csrfToken = null; };
async function request(path, options = {}) {
  if (!base) throw new Error('Sign-in is not available on this website yet. Please try again once account services are connected.');
  let response;
  try { response = await fetch(`${base}${path}`, { ...options, credentials: 'include', signal: AbortSignal.timeout(15000), headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } }); }
  catch { throw new Error(localAccountSetup ? 'The local account service could not be reached. Start the full local setup and try again.' : 'Account services could not be reached. Please try again.'); }
  const payload = await response.json().catch(() => null);
  if (!payload) throw new Error(localAccountSetup ? 'The local API is not responding. Start the full local setup and open http://localhost:5173.' : 'Account services are temporarily unavailable. Please try again later.');
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('va:unauthorized'));
    const error = new Error(payload.error?.message || 'The request could not be completed.');
    error.status = response.status; error.code = payload.error?.code; throw error;
  }
  return payload.data;
}
async function csrf() {
  if (csrfToken) return csrfToken;
  if (!csrfPromise) csrfPromise = request('/auth/csrf').then(x => (csrfToken = x.csrfToken)).finally(() => { csrfPromise = null; });
  return csrfPromise;
}
export async function api(path, { method = 'GET', body } = {}) {
  if (method === 'GET') return request(path);
  const send = async () => request(path, { method, body: JSON.stringify(body || {}), headers: { 'X-CSRF-Token': await csrf() } });
  let result;
  try { result = await send(); }
  catch (error) { if (error.code !== 'CSRF_INVALID') throw error; resetCsrf(); result = await send(); }
  if (result?.csrfToken) csrfToken = result.csrfToken;
  return result;
}
