# VelvetAura 3.1 — editorial storefront and expanded catalogue

An incremental frontend redesign of the existing fashion storefront: editorial layouts, local photography and fonts, responsive collections, accessible dialogs and refined ivory/charcoal/beige styling. React, Vite, React Router, Lucide, Motion, existing routes and local shopping features are preserved. The earlier authentication foundation is unchanged. **This release is not the completed full-commerce platform.**

## Start the frontend

**Seeing “Account services” on localhost?** Running only the frontend does not
start the API. For the complete local account setup, stop the old dev terminal,
run `npm ci`, `npm ci --prefix server`, then `npm run dev:local`. This starts
the existing API and a persistent local MongoDB process; the first run may
download MongoDB. See [account setup and troubleshooting](docs/ACCOUNT-SETUP.md)
for details, limitations and the separate live-site requirements.

Requires Node.js 22.12+ and npm. From the project root:

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. Browsing, search, filtering, product options, the bag and wishlist work without a backend. Account services require the API or the full local command above. Run `npm test` for the frontend regression tests and `npm run build` for production output.

The current catalogue, all 28 category counts, image validation and browser checks are documented in [docs/CATALOGUE-3.1.md](docs/CATALOGUE-3.1.md). The earlier visual redesign is recorded in [docs/UI-REDESIGN.md](docs/UI-REDESIGN.md). No backend, authentication, admin or payment implementation was added in this phase.

## Status

| Phase | Status |
| --- | --- |
| 1 — inspect and plan | Complete; existing source preserved |
| 2 — UI and motion | Editorial redesign complete; frontend tests, build and targeted browser checks passed (see UI-REDESIGN.md) |
| 3 — authentication | API and frontend implemented; see `docs/VALIDATION.md` for actual test results |
| 4 — customer/catalogue APIs | Pending: database products, stock, addresses, cart/wishlist sync, reviews |
| 5 — checkout/payments/orders | Pending; no payment success is simulated |
| 6 — admin dashboard | Pending; only server RBAC and an operator promotion CLI exist |
| 7–8 — hardening/full verification | Partial; full-commerce, real-device/cross-browser and deployed API testing remain |

## Implemented

- 572 distinct products: 560 imported reference entries plus all 12 original product IDs; at least 20 in each of 28 subcategories.
- Sticky Men/Women mega-menus, separate category routes, mobile navigation/filter drawers, category shortcuts and working product carousels.
- Combined search, department/category, price, size, colour and availability filters; sorting and 24-item pagination with URL state.
- Locally stored responsive WebP photos, unique primary images, per-photo embedded failure previews and four genuine multi-photo galleries.
- Variant-aware cart validation, stock limits and safe migration of persisted bags; INR demo prices without invented discounts.

- Motion for React: page/hero/product entrances, wishlist/bag badge feedback, reduced-motion handling.
- Native modal cart drawer, mobile navigation and search: focus trapping, Escape close, background inertness and focus restoration.
- Product, bag, wishlist, INR search/filter/sort functionality retained; malformed localStorage values normalized.
- Real Express/MongoDB registration/login/logout, bcrypt hashing, revocable server-side sessions, HTTP-only cookies, origin/CSRF checks, strict input schemas, rate limiting and centralized errors.
- Expiring single-use password-reset/email-verification integration. Email delivery must be configured; no fake recovery success when SMTP is absent.
- Protected account profile editor, password changes, session refresh, cross-tab logout notices and safe post-login redirects.
- Server-side role guard and trusted-operator CLI for promoting an existing verified account.
- Lazy account bundles, loading/error/configuration states, tests, environment examples and CI configuration.

The hosted frontend does not have a provisioned API/database. Account forms explicitly show unavailable configuration until `VITE_API_URL` is set and the API is deployed. Cart prices, product data, testimonials and policies remain illustrative.

## Local setup — Windows / PowerShell

Requires Node.js 22.12+, npm and MongoDB 7+ (local or Atlas).

Open `velvetaura` in VS Code. In terminal 1:

```powershell
cd server
npm ci
Copy-Item .env.example .env
# Edit .env: configure MONGODB_URI and optional SMTP.
npm run dev
```

In terminal 2, from the project root:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. Vite uses that fixed port and proxies `/api` to `http://127.0.0.1:4000`. The hostname must match `APP_ORIGIN`. On macOS/Linux use `cp` instead of `Copy-Item`.

## MongoDB

Local connection: `mongodb://127.0.0.1:27017/velvetaura`.

For Atlas, create a cluster, an application database user and network access restricted to your API host. Put the driver connection URL in `server/.env`, URL-encoding credentials and selecting the `velvetaura` database. Never commit it. The API creates required indexes before listening. A standalone MongoDB server supports the current auth scope; future transactional inventory/orders need a replica set.

## Environment variables

Frontend values are PUBLIC build-time settings:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | `/api` locally; an HTTPS API URL ending in `/api` online. Local dev and production-preview builds default to `/api` on loopback hosts. A missing value on a hosted production site disables account services. |

Private backend configuration:

| Variable | Default / requirement |
| --- | --- |
| `NODE_ENV` | `development`, `test` or `production` |
| `PORT` | `4000` |
| `MONGODB_URI` | Required MongoDB URL |
| `APP_ORIGIN` | Exact frontend origin with no trailing slash; HTTPS required in production |
| `COOKIE_SAME_SITE` | `lax`; `none` requires production HTTPS and cross-site browser compatibility testing |
| `TRUST_PROXY_HOPS` | `0`; set only to the known number of trusted reverse-proxy hops |
| `BCRYPT_ROUNDS` | `12`, range 10–14 |
| `SESSION_DAYS` | `7`, range 1–30; absolute expiry |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Configure all four to enable email, or leave all empty |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` uses required STARTTLS; `true` uses immediate TLS (typically port 465) |

No signing secret is required for the opaque session design. Cookies contain random 256-bit values, and the database stores their SHA-256 hashes. User identity and permissions are fetched from the database. No password, auth token or session secret is stored in localStorage.

## Email and administrator setup

With SMTP, new accounts must verify email before login. Verification links expire after 24 hours; reset links after 30 minutes. Tokens are hashed and consumed atomically once. Password change/reset invalidates all existing sessions.

Without SMTP, API-backed registration/login can work but email remains unverified, while recovery/resend returns an explicit configuration error. No raw recovery tokens are returned or logged. If SMTP is enabled later, previously unverified accounts must request verification.

Administrator setup:

1. Configure SMTP, register your own account, and verify its email.
2. In a trusted operator terminal with database access:

```powershell
cd server
npm run admin:promote -- your-verified-address@example.com --confirm
```

The CLI only promotes an existing enabled verified user and invalidates previous sessions. It creates no default account/password. There is no public role-update API. `/api/admin/access` checks server authorization; the actual administration dashboard is still pending.

## Tests and production build

```powershell
# Project root
npm test
npm run build
npm run preview

# API
cd server
npm test
npm run test:integration
```

Integration tests start an isolated MongoDB automatically. Alternatively:

```powershell
$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017/velvetaura_test"
npm run test:integration
```

Tests delete users/sessions/rate buckets in the test database. Only database names `velvetaura_test` and `velvetaura_test_<suffix>` are accepted for an external test connection. Never use production data. The GitHub workflow provisions a MongoDB service; the workflow itself has not been executed on GitHub.

Current frontend evidence: [docs/CATALOGUE-3.1.md](docs/CATALOGUE-3.1.md) and machine-readable [image audit](docs/catalogue-validation.json). Earlier backend/foundation evidence and limits: [docs/VALIDATION.md](docs/VALIDATION.md).

## Structure

```text
src/
  components/       # Shared UI, Dialog, CartDrawer, Motion, Editorial, FashionImage
  context/          # Shopping store + authentication provider/guard
  data/             # 572 products, 28 categories, seed/curation and image manifest
  pages/            # Existing storefront + Auth, recovery, Account
  services/api.js   # Credentialed HTTP, CSRF, timeouts/errors
  utils/            # Shopping, safe persistence, auth helpers/tests
  styles/           # Editorial design system and local font declarations
public/
  images/           # Responsive WebP photographs and source records
  fonts/            # Cormorant Garamond / DM Sans with OFL licences
scripts/
  prepare-images.py # Earlier editorial-photo preparation
  build-catalogue.py # Optional reference catalogue importer (Python + Pillow)
  validate-catalogue.py # Local image/data audit; no network needed
server/
  src/
    app.js          # Express middleware/router setup
    server.js       # Configuration, database and server lifecycle
    config.js       # Validated environment settings
    models.js       # User, Session, RateBucket schemas/indexes
    security.js     # Session, CSRF, role, rate-limit helpers
    validation.js   # Strict Zod inputs
    auth.js         # Authentication/profile routes
    mail.js         # SMTP transport
    promote-admin.js
  tests/            # Security units + database integration flows
  .env.example
docs/               # Deployment, phase log, validation
.github/workflows/  # CI definition
.env.example
```

## Payments and remaining work

There is no payment gateway integration or webhook endpoint yet. Do not add payment secrets to Vite configuration or expect a test checkout to succeed. The next phases must implement server-owned products, variant stock, coupons/quotes, shipping/tax rules, transactional inventory reservations, orders, provider checkout, signature verification and idempotent webhooks, then admin management and full end-to-end checks.

Every product has a unique primary photograph and an enlargement dialog. Four reference entries have three genuine photographs; the remaining 568 have one photograph each. Reference imagery is attributed in the source manifest and is not commercially rights-cleared. Replace it with owned/licensed inventory photography before commercial launch. Prices, sizes, stock and merchandising ranks are demonstration data. Final business policies, durable email delivery/monitoring and production operational review are still required.

Deployment instructions: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
