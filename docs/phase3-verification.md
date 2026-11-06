# Phase 3 verification results

Verification date: 6 November 2026. Base main: `84641380c55b4ae8b8f70fdddf9c7f6977d4e516`. All runtime data was synthetic. No seed, production credentials, application environment files, deployment, merge, visibility change, portfolio change or PR #4 update was used.

Environment: Linux x86_64, Node 24.22.1, npm 11.9.0, TypeScript/Mongoose from the existing lockfiles; added pinned test-only `mongodb-memory-server` 10.4.1. MongoDB binary 7.0.24, one-node WiredTiger replica set on 127.0.0.1 with a temporary database. The harness disables Unix sockets and diagnostic collection for compatibility with this execution environment. It creates its own URI and cleans up the replica set; it does not accept a target database connection string. A one-node test set verifies transactions/concurrency, not replica failover durability.

## Checks actually run

Commands are relative to each package unless specified.

| Check | Baseline | Implementation branch |
| --- | --- | --- |
| Lockfile installations: `npm ci --ignore-scripts` in client and server | Pass | Test dependency installed and pinned with updated server lockfile; no production dependency upgrade |
| Server `npm test` | Exit 1: intentional no-test placeholder | **24 passed, 0 failed, 0 skipped**; 20 real-Mongo controller scenarios plus 4 client-helper tests |
| Server `npx tsc --noEmit` / new equivalent `npm run typecheck` | Pass | Pass |
| Server `npm run build` | Pass | Pass; emits compiled transaction service and affected modules |
| Client `npx tsc --noEmit` | Exit 2, 20 diagnostics | Exit 2, 16 existing diagnostics; no newly introduced diagnostic messages |
| Client `npm run lint` | Pass | Pass, with the coverage qualification below |
| Client `npm run build -- --mode phase3` | Pass | Pass, optimized Vite bundle generated locally |
| `git diff --check` | Clean base | Pass |

Vite still uses its production build command and optimizations, with a separate `phase3` environment mode to avoid loading tracked `.env.production` settings. No production service key or URL was required. This is a local compile, not a browser or hosting check. npm emitted an existing environment-config warning for `http-proxy`; initial server install also reported existing deprecated transitive dependencies. No broad dependency or audit-fix upgrade was attempted.

The existing ESLint configuration targets JS/JSX only. Its success does **not** mean TS/TSX was linted. No server lint configuration/script exists; it was not invented or reported as a pass. Server TypeScript was checked; client typecheck remains failing as below.

## Existing client typecheck failures

Compared diagnostics by file, error code and message (ignoring shifted line numbers). Four existing OrdersPage errors disappeared when typing its mutation input and using the current query invalidation signature. No new messages appeared.

| File | Remaining diagnostics | Existing issue class |
| --- | --- | --- |
| `src/components/Navbar.tsx` | 2 | Clerk UserButton `afterSignOutUrl` typing |
| `src/main.tsx` | 1 | ClerkProvider `afterSignInUrl` typing |
| `src/pages/admin/MessagesPage.tsx` | 3 | Date arithmetic and query invalidation signature |
| `src/pages/admin/OrdersPage.tsx` | 2 | Date arithmetic |
| `src/pages/admin/ProductsPage.tsx` | 5 | Missing setFormError, query invalidation signatures and error response typing |
| `src/pages/admin/VendorsPage.tsx` | 3 | Query invalidation signatures and error response typing |

These baseline errors remain a release consideration. Vite transpilation does not establish type correctness.

## Regression evidence

The first actual replica-set run against the unchanged application source produced 15 failing assertions. It reproduced an extra order after last-item contention, an orphan order after the second product write was rejected, stock above its initial value after double cancellation, nonterminal cancellation and stale-price acceptance. An earlier attempt to start the binary failed due to environment compatibility; that startup failure was investigated and is not counted as a reproduced application defect.

After the initial transaction fixes, all 15 tests passed. Added reviewed-cart revision tests exposed two further failures; those passed after requiring `cartVersion` and enabling optimistic cart saves. Review-driven confirmation and stalled-cache tests then failed before their fixes. Final full command `cd server && npm test` passed all 24 tests. Expected synthetic after-commit failures are logged by those regression cases and are not real service failures.

| Real MongoDB controller scenarios (20 tests) | Assertions |
| --- | --- |
| Multi-item success | Correct order total/notes, all stock deductions, reserved marker, cleared cart/total, one notification set and cache invalidation |
| Last available item; 8 concurrent buyers for 3 units | Only successful orders persist, no negative stock, rejected buyer's cart retained |
| Failure on second stock write | MongoDB collection validator rejects the write; order, earlier deductions and cart changes all roll back |
| Three checkouts of one cart and a later retry | Consume once; one order/notification, later empty-cart errors |
| Concurrent and sequential double cancellation | Every line restored exactly once, terminal marker/status, one email/cache invalidation |
| Cancellation failure on second restoration | Real database rejection rolls back earlier restoration and status |
| Cancel/reopen/cancel attempt | Reopen rejected, no repeated stock effect |
| Full 5 by 5 status matrix | Legal edges/no-ops accepted, all other edges rejected, stock matches state |
| Price rises and falls | Reject stale cart, refresh, then accept the new explicitly reviewed total |
| Inactive, deleted and missing products | Reject without creating an order or consuming the cart |
| Invalid stored quantities | No negative/fractional/zero checkout quantity can increase stock |
| Missing restoration product | Cancel fails without advancing status |
| Unmarked legacy order | Cancel fails pending reconciliation |
| Rejected notification/cache boundaries | Committed checkout still returns 201; independent channels attempted |
| Another-device price refresh | Old confirmed cart version cannot authorize a newly refreshed price |
| Stale cart save after checkout | Cannot resurrect purchased items |
| Missing/invalid cart revision | Reject malformed request without inventory effect |
| Price write between read and deduction | Real external database write forces retry/rejection; no stale-priced order |
| Stalled cache boundary | One-second effect deadline permits 201 and other notifications after commit |

Four client helper tests compile the actual pure TypeScript helper using the existing TypeScript compiler. They assert sequential saves before fetching confirmation, a snapshot unaffected by later server/draft mutation, no confirmation for invalid drafts/failed saves, and no stale confirmation after a failed refresh. They do not mount the React component or claim full browser coverage.

External email, cache and socket boundaries are deliberately stubbed; all order/cart/product operations use real Mongoose and MongoDB transactions. The mid-write failure tests use MongoDB collection validation, not a mocked persistence layer. The price race wraps the model call only to schedule a separate real database price update before the guarded write.

## Review and boundaries

A fresh reviewer inspected the implementation and independently passed the then-current 19 tests. No atomic transaction/cancellation blocker was found. Findings about snapshot mismatch, invalid drafts, conflicting parallel cart saves and a stalled cache were fixed and checked by the expanded local suite. The reviewer did not provide a second final sign-off. See the [plan record](phase3-checkout-plan.md) for decisions and the [rollout notes](phase3-checkout.md) for migration prerequisites and deferred baseline risks.

Real Clerk sessions, Redis, SMTP, socket clients, Cloudinary, end-to-end browser interaction, replica failover, performance/load limits and hosting operation remain **NOT VERIFIED**. A local build or synthetic test run is not deployment success.
