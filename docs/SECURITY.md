# Authentication security notes

- Random 256-bit opaque session cookies; token digests stored in MongoDB. HTTP-only cookies with Secure and `__Host-` prefix in production.
- New session on login. Logout deletes it. Password change/reset increments a per-user authentication version checked on protected requests, invalidating all old sessions.
- Bcrypt hashing with 12 default rounds; minimum 12 characters and maximum 72 UTF-8 bytes.
- JSON-only mutations require an exact allowed Origin and a per-session CSRF header. CSRF tokens remain in frontend memory.
- Exact-origin credentialed CORS, Helmet, 16 KB request-body limit, strict Zod schemas and generic unexpected-error responses.
- MongoDB-backed fixed-window rate limits across API processes, with IP and normalized account limits for login/email requests.
- Registration cannot assign roles. Profile mutation only selects the authenticated user's ID. Admin authorization checks the current database role.
- Reset/verification tokens stored as hashes, checked for expiry and consumed atomically. No raw tokens in API responses or logs.
- Email delivery errors are logged generically. A durable email queue, delivery monitoring and response-timing review are future production hardening tasks.
- No file-upload, payment, order or inventory endpoints exist yet. Those features require separate validation, authorization, consistency and security work.

Use HTTPS, least-privileged MongoDB credentials and restricted network access. Set trusted proxy hops to the known deployment topology. Prefer same-site frontend/API domains; cross-site cookie policies must be tested in the target browsers. Never put MongoDB, SMTP, payment or session secrets in Vite variables or localStorage.
