# Deployment — foundation release

The existing Site hosts static Vite output. This Express/MongoDB API needs a separate Node host; it is not deployed by uploading the static frontend.

## API

- Use a Node 22+ host/container/VPS with MongoDB connectivity.
- Root directory: `server`. Install: `npm ci --omit=dev`. Start: `node src/server.js` with host-injected environment variables (local scripts instead read `.env`).
- Configure private `MONGODB_URI`, `NODE_ENV=production`, exact HTTPS `APP_ORIGIN`, cookie/proxy settings and optional SMTP secrets.
- Restrict database user privileges and network access. Never expose MongoDB or SMTP credentials to Vite.
- Expose HTTPS, set the exact trusted proxy hop count and check `/api/health` plus actual authenticated endpoints.
- Configure operational logs/alerts and rerun integration tests before allowing customer accounts.

## Frontend

- Set `VITE_API_URL=https://api.your-domain.example/api`, then `npm ci` and `npm run build`.
- Deploy `dist/` with an SPA fallback to `index.html`.
- `APP_ORIGIN` must exactly match the frontend origin (including scheme/port).
- Prefer same-site custom domains such as `shop.example.com` and `api.example.com`, HTTPS and SameSite=Lax. Cross-site SameSite=None can be blocked by browser privacy rules; test in target browsers or use a same-origin reverse proxy.
- The existing hosted frontend has no provisioned API connection. Missing API settings produce an explicit unavailable state, not simulated authentication.

## Verification

Run tests using a dedicated `velvetaura_test` database. Verify signup, email verification, login, refresh, profile ownership, wrong-password handling, password reset expiry/replay, password-change revocation, logout/back navigation and customer-vs-admin authorization. Test CORS/CSRF and cookie settings on the real domains.

Check keyboard focus, Escape/backdrop close, screen reader labels, reduced motion and widths 360/768/1024/1440. Browser QA was not available in the authoring environment.

## Payment setup

Pending implementation: no gateway, order model, payment-signature handler or webhook URL exists in this release. Configure provider test mode only after those endpoints are implemented. Future tests must cover verified webhooks, idempotency, payment cancellation/failure/retry and inventory rollback. Never expose a signature-verification bypass or put gateway secrets in frontend variables.
