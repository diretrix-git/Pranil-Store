# Phase 3 checkout implementation plan

Base: `84641380c55b4ae8b8f70fdddf9c7f6977d4e516` on main. Reviewed Phase 1 audit and documentation PR #4 (`abb1ffde17cfbf43bdb59818d419a30f39c418ea`). That PR remains unchanged. The user's Phase 3 request authorizes design, implementation, testing and a separate draft PR.

## Design and scope

Keep Express controllers, Mongoose models, Clerk routes, response envelopes, TanStack Query, optional Redis caching and existing best-effort notification channels. Add a small order transaction service. Use MongoDB transactions with snapshot reads, primary read preference and majority writes; propagate every failure rather than falling back to partial writes. Execute session operations sequentially, and emit notifications only after commit.

Alternatives: manual compensating writes cannot reliably recover a process crash or concurrent cancellation; an outbox/workflow rewrite exceeds this task. Transactions fit the existing MongoDB architecture. Durable notification delivery remains separate work.

Pricing decision: catalog prices apply at checkout, with no silent repricing. Cart GET already refreshes prices and the UI already warns buyers. Reject a stale cart with 409; refresh the cart in the existing error handler and require another confirmation. Include price and active/deleted flags in guarded product writes so concurrent catalog changes conflict/retry. Tax and discount behavior stays unchanged.

Status decision: pending -> confirmed -> processing -> completed. Cancellation is allowed from pending, confirmed or processing; completed and cancelled are terminal. Repeating the current status is an idempotent success without repeated notifications or stock writes. This is a deliberately stricter workflow; no backward moves, skipping stages, refunds or reopening.

## Tasks and verification

1. Add controller-level regression tests using real Mongoose models and a disposable, loopback-only MongoDB replica set. Stub only SMTP/email and cache/socket boundaries. Write tests before production changes and record baseline failures. Exercise multi-item success, last-item contention, mid-checkout database rejection, simultaneous buyers, duplicate same-cart checkout, cancellation races/rollback, transition matrix, stale prices, invalid stored quantities and unavailable products.
2. Add `server/services/orderTransactions.ts`: `checkoutCart(user, notes, cartVersion)` and `transitionOrder(orderId, status)` return committed documents (and whether status changed). Load fresh documents inside each retry. Guard product availability, quantity and price; write stock, order and cart in one transaction. Serialise cancellation through the order document and restore each line in the same transaction, rejecting missing products. Keep controllers responsible for after-commit effects. Test rollback and notification counts.
3. In `client/src/pages/buyer/CartPage.tsx`, refresh a failed checkout's cart; in the admin order page, present legal transitions and errors using the existing UI. Keep routes/design/auth intact. Run client lint/build and compare typecheck diagnostics with baseline.
4. Document replica-set prerequisites, legacy data reconciliation, price/transition policies, generated-output hazards and remaining limits. Add branch-specific Vercel deployment suppression before publishing, because PR #4 shows automatic previews. Do not run seeds or load production service credentials.
5. Run full regression suite, server typecheck/build, client typecheck/lint/build; inspect the diff and obtain an independent review. Commit on the implementation branch and open a draft PR targeting main. No merge/deployment/visibility or portfolio changes.

## Review focus

- Same buyer checking out twice: at most one order from the consumed cart; a newly filled cart is a new purchase, not request-key deduplication.
- Product price/availability changes during checkout: guarded writes must conflict with concurrent catalog updates.
- Failure on the second stock write or restoration: roll back earlier changes and order/cart state.
- Legacy inconsistent orders or missing product references: never guess stock repairs; reconcile before rollout.
- Notifications/cache failures after commit: do not convert a committed purchase into an apparent checkout failure; delivery remains best effort.

## Baseline

Node 24.22.1, npm 11.9.0. Fresh lockfile installations succeeded. Server `npm test` fails intentionally with its placeholder. Server typecheck/build and client lint/Vite production-optimized build (`--mode phase3`, avoiding tracked production environment settings) pass. Client typecheck has 20 existing diagnostics. Existing lint targets JS/JSX, not TS/TSX. A clean server build changes eight already-tracked generated files before any source edits, demonstrating baseline dist drift; unrelated generated changes will be excluded.

## Execution and review record

All five tasks were implemented on the separate Phase 3 branch. Initial real-database regression run: 15 failed, reproducing orphan orders, partial stock writes, repeated restoration and price/status gaps. Initial fixed service: 15 passed. Additional cart-revision tests exposed two missing behaviors; after the revision contract, 19 passed. A fresh independent review identified confirmation snapshot, invalid draft, parallel flush and stalled cache gaps. Added client helper tests and a stalled-cache regression, observed failures before implementing their corrections, then all 24 tests passed. Final verification is recorded separately.

Ruling: the user explicitly authorized designing and implementing this bounded Phase 3 task; proceed through implementation and draft PR without another design approval gate. Decisions are reviewable in this branch, with no merge or deployment.

Ruling: require the reviewed cart revision and optimistic cart saves because comparing only persisted cart price against catalog price cannot protect an older confirmation after another device refreshes the cart. This intentionally requires coordinated client/API rollout.

Ruling: legacy cancellation fails closed without an explicitly reconciled reservation marker because historical partial deductions make automatic stock restoration unsafe. This intentionally blocks those cancellations until reconciliation.

Ruling: retain the existing absolute admin stock edit, number-based currency and order identifier policy as separate concerns; document their effects instead of claiming global inventory correctness. Also retain best-effort delivery and consumed-cart deduplication scope; durable delivery and replay would require additional architecture.

The independent review reported no atomic transaction or cancellation blocker and independently ran the then-current 19-test suite. Its review findings were corrected with local regression tests; the reviewer did not issue a second final sign-off on those corrections. The plan signature mismatch was corrected. No outstanding review minor was deferred.
