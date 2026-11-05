# Phase 3 validation

5 November 2026. Base main `84641380c55b4ae8b8f70fdddf9c7f6977d4e516`; separate implementation branch `fix/phase3-atomic-checkout`. Audit findings reviewed from PR #4's source-backed ledger and the prior cross-project review packet. PR #4 stays unchanged. See [protocol and migration requirements](phase3-transactions.md).

| Actual command / working directory | Result |
| --- | --- |
| `npm ci --no-audit --no-fund` / server | Passed, 290 locked packages. Existing dependency deprecation notices. |
| `npm ci --no-audit --no-fund` / client | Passed, 323 locked packages. |
| `npm test` / server | Passed: 23 tests, zero failed/skipped; real disposable MongoDB 8 replica-set/standalone fixtures. |
| `npm test` / client | Passed: one actual Admin Orders page-render regression, zero failed/skipped. |
| `npm run typecheck` / server | Passed. Baseline `npx tsc --noEmit` also passed. |
| `npx tsc --noEmit` / client | Failed: 16 pre-existing errors remain; baseline had 20. No new diagnostic was introduced. Four existing errors in the touched order mutation's typing/query invalidation were resolved while implementing that flow. |
| `npm run lint` / client | Passed at baseline and after changes. Existing config scopes rules to JS/JSX and does not establish lint coverage of changed TypeScript. No backend lint command/config exists. |
| `npm run build` / server | Passed: repository script runs `npm install --include=dev && tsc --skipLibCheck`; all tracked/new deployment artifacts regenerated. Unrelated empty devDependencies lockfile metadata normalization was reverted. |
| `npm run build` / client | Passed before and after changes. This Vite build does not run the failing TypeScript check. |
| `node /tmp/pranil-compiled-smoke.cjs` | Passed: generated deployment service performed checkout, consumed the cart and restored stock once on cancellation against another disposable database. |
| `git diff --check` | Passed. |

Before implementation, regression tests against the original controllers failed on partial checkout, concurrent cart consumption, cancellation, stale prices and cart-version behavior. The repaired suite covers last-item and multi-product contention, same/different-cart concurrency, product-write/cart-clear failures, transaction retries with concurrent price/cart edits, price increases/decreases, repeated/concurrent cancellation at every cancellable stage, invalid/reopened/completed transitions, missing restoration products, stale cart saves, reviewed versions, inactive products, partial unique indexes, repeatable storage preparation and standalone rejection.

Tests are isolated: random `pranil_phase3_test_*` databases, generated IDs and synthetic buyer/product information only. The first baseline run revealed the existing mailer performs an import-time SMTP probe; DNS failed and no email delivery was established. Final tests stub transport before importing the controller, and record cache/email/socket effects rather than contacting services. Successful test transport logs do not demonstrate SMTP readiness.

Independent code review caught an implementation-time null-modal filter crash; a failing render regression reproduced it, the filter was corrected and the regression now passes. Inputs are disabled during checkout preparation/confirmation to avoid clearing new edits while saving the reviewed cart. Final independent review of the corrected UI/protocol found no remaining implementation blocker.

Remaining client type errors are in Clerk prop compatibility (Navbar/main), date subtraction in MessagesPage/OrdersPage, and existing ProductsPage/VendorsPage/MessagesPage query/error handling. Full diagnostic comparison was recorded before editing. Unrelated files were left unchanged.

The existing tracked server/dist differed from TypeScript before this task. Regeneration includes corresponding pre-existing source changes in admin/cart handlers, order-number generation and several routes. The new mutation service and preparation script are explicitly included despite dist being ignored for new files. No seed, migration against real data, production credentials, deployment, merge, visibility or portfolio write was performed.

Limitations: live Clerk authentication/role revocation, actual Redis invalidation, SMTP/Socket.IO delivery, complete browser checkout with delayed network, multi-node failover/unknown commit outcomes, sharded topology and production load were not exercised. The existing SMTP TLS configuration and random order-number strategy were not redesigned. Historical stock/order inconsistencies require reconciliation; this protects future operations after the documented cutover prerequisites.

GitHub API access returned `Forbidden` through the environment proxy during PR preparation. Pushing the branch can succeed through Git transport, but automatic draft PR creation requires API access. This is an external review-handoff limitation, not a passing PR-creation result.
