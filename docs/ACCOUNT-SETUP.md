# Fixing the account-services screen

The storefront and account API are separate programs. Running only Vite does
not start Express or MongoDB. The hosted static website also needs a deployed
API; it cannot run the Node server contained in this ZIP.

## Easiest local start (Windows, macOS or Linux)

Use Node.js 22.12 or newer. Extract the project and open its main folder in VS
Code. Stop any previous frontend/API terminal with Ctrl+C. Run:

```powershell
npm ci
npm ci --prefix server
npm run dev:local
```

Wait for **VelvetAura is ready at http://localhost:5173**. The first run may
download the MongoDB executable, so an internet connection is required. Open
`http://localhost:5173/signup`, create an account with a 12–72 character
passphrase, then sign in. Keep the terminal open while using the site.

This mode starts the existing Express API, a real MongoDB process bound only
to `127.0.0.1`, and Vite. It uses bcrypt and HTTP-only session cookies. It does
not create a demo user or fake a successful login. Account data is saved under
`server/.local-data/mongodb` and retained on restart. Keep that folder private
and do not delete it if you want to keep the local accounts.

This development mode uses its own database and does not read your configured
MongoDB/SMTP credentials. Email verification and password-reset emails need
the configured API setup below. Do not use `dev:local` for deployment.

## Existing MongoDB or Atlas / email configuration

Use this path if you already have MongoDB, need SMTP, or the automatic local
MongoDB executable cannot run on your system.

1. Copy `server/.env.example` to `server/.env` **only if the latter does not
   exist**. Preserve an existing file and its configuration.
2. Set `MONGODB_URI` to your own database. Leave
   `APP_ORIGIN=http://localhost:5173` for the default local frontend.
3. Start two terminals from the project root:

```powershell
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev
```

Local MongoDB must already be running when using this path. Atlas must allow
the API machine to connect. Keep the connection string and SMTP credentials
in `server/.env`; never put them in a `VITE_` variable or send them in chat.

The default frontend proxies `/api` to `http://127.0.0.1:4000`. Open the site
using **localhost**, matching `APP_ORIGIN`, rather than mixing hostnames.
Check `http://localhost:5173/api/health`; a running API responds with
`{"data":{"status":"ok"}}`. An HTML page or proxy error is not a healthy API.

## Local production preview

Built assets now recognize `localhost`, `127.0.0.1` and IPv6 loopback as local
environments and use the API proxy when no explicit API URL is configured.
`npm run preview` uses port 5173 and the same proxy as development, matching
the default `APP_ORIGIN`. Run the configured API in another terminal before
using `npm run build` and `npm run preview`. Do not run preview and dev at the
same time. Vite preview is for local verification, not production hosting.

## The online website

Local setup does **not** activate accounts on the online website. To connect
it, deploy the existing `server/` on a Node host with MongoDB connectivity.
The public HTTPS API URL is safe to share; database/SMTP secrets are not.

Configure on that API host:

```text
NODE_ENV=production
MONGODB_URI=<private database connection string>
APP_ORIGIN=https://velvetaura-fashion.keencream1.chatgpt.site
COOKIE_SAME_SITE=none
TRUST_PROXY_HOPS=<the host's documented proxy hop count>
```

The `none` setting is needed when the API and storefront use different sites
and requires HTTPS. Some browsers block third-party cookies; use a same-site
custom domain pair or a same-origin reverse proxy for a reliable production
setup. Do not weaken CSRF/origin checks to get around a cookie problem.

Set the frontend's **build-time** `VITE_API_URL` to the real HTTPS API URL
ending in `/api`, rebuild and redeploy. A runtime setting on a static host
does not rewrite an already-built Vite bundle. Then verify registration,
login, cookie persistence, profile updates and logout on the actual domains.

See [DEPLOYMENT.md](DEPLOYMENT.md) for installation/start commands. No online
API, database or email provider was provisioned by this change.

## Checks and current limits — 25 October 2026

Verified in this update:

- Frontend regression tests: 23 passed.
- Backend security unit tests: 10 passed.
- Production build: passed, with the existing large-bundle warning.
- Dev/preview API proxy parity and preview origin: passed.
- Local launcher refuses production mode and reports an occupied API port:
  passed; both failure paths exit without launching MongoDB or the frontend.
- Browser: the unavailable-account screen renders, retry works, and the
  wishlist recovery link navigates correctly while the API is stopped.

The API URL regression tests cover local production builds and preserve the
explicit configuration requirement for hosted websites. Backend integration
tests still require a functioning MongoDB process. In the authoring
environment, MongoDB exits with code 100 (`open: Operation not permitted`),
before those tests reach their assertions. Successful signup/login and local
database persistence therefore still need verification on your computer.
