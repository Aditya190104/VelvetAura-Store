# Validation evidence — 18 October 2026

This is the historical foundation checkpoint. For the later frontend redesign, including browser checks and current build results, see [UI-REDESIGN.md](UI-REDESIGN.md). Backend integration limits below still apply.

| Check | Result |
| --- | --- |
| Frontend regression/unit tests (`npm test`) | 12 passed, 0 failed |
| Backend security unit tests (`npm --prefix server test`) | 10 passed, 0 failed |
| Frontend production build (`npm run build`) | Passed; account/auth bundles split from main bundle |
| Production dependency audits (frontend and server) | 0 reported vulnerabilities in each `npm audit --omit=dev` report |
| Git whitespace/error check | Passed |
| MongoDB-backed integration suite | Not verified: latest attempt failed before assertions because MongoDB exited with code 100 during startup |
| Browser visual, keyboard, mobile and console tests | Not executed: supported browser QA tooling unavailable |
| Live SMTP and deployed API | Not configured/tested |
| Payments/orders/admin-commerce | Not implemented in this foundation release |

The database integration suite contains 10 scenarios covering registration/hashing, session rotation/logout, safe credential errors, server-side role protection, CSRF/origin and self-only profile edits, unavailable email configuration, password revocation, single-use/expiring recovery tokens, session expiry and login rate limits. The test runner reports these as failed when its database setup hook fails. This is not a passing integration run, and unit tests do not replace it.

The earlier run diagnosed `open: Operation not permitted` from the local MongoDB process. The resumed attempt again exited with code 100. No permission bypass was attempted. Run the suite against a dedicated MongoDB test service using the README instructions; the supplied GitHub workflow provisions one but has not been executed on GitHub.

Dependency audits are a snapshot, not a security certification. Cookie behavior, email delivery, deployed CORS, browser focus, account ownership and full backend flows must be tested in the actual target environment before production use.
