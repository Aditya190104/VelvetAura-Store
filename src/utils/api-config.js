export function isLocalHost(hostname = '') {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname.toLowerCase());
}

// A production build can also be previewed locally. Keep hosted deployments
// explicit, while allowing local builds to reach Vite's existing API proxy.
export function resolveApiBase({ url = '', development = false, hostname = '' } = {}) {
  const configured = url.trim().replace(/\/+$/, '');
  if (configured) return configured;
  return development || isLocalHost(hostname) ? '/api' : '';
}
