export function safeReturnPath(value) {
  return typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /^\/(login|signup|forgot-password|reset-password|verify-email)/.test(value) ? '/account' : value;
}
export function passwordIssue(value) {
  if (value.length < 12) return 'Use at least 12 characters. A unique passphrase works well.';
  if (new TextEncoder().encode(value).length > 72) return 'Use at most 72 UTF-8 bytes.';
  return '';
}
