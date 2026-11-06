# Phase 3: order integrity and rollout notes

This implementation branch starts from main `84641380c55b4ae8b8f70fdddf9c7f6977d4e516`. Phase 1 findings and documentation PR [#4](https://github.com/diretrix-git/Pranil-Store/pull/4) were reviewed first. PR #4 and its branch are unchanged; its statements describe the old revision. Reconcile any README overlap when reviewing those separate PRs. This change has not been merged or deployed.

## Checkout contract

`POST /api/v1/orders` remains buyer-only behind the existing Clerk middleware and order limiter. Its JSON body is now `{ "notes": "optional", "cartVersion": 7 }`, where `cartVersion` is the integer `__v` from the exact cart shown in confirmation. The server ignores client-supplied item prices and totals.

One MongoDB transaction reads the buyer's cart, validates each quantity and price, conditionally deducts every available product, creates the order and clears the cart. Every read/write uses the same session. Snapshot reads, primary preference and majority commit are explicit. A failed write or cart version conflict aborts all order/inventory/cart changes. Driver retries reload all documents; they do not send notifications. Calls on one session are sequential.

Guarded deductions require the product to exist, be active, not be soft-deleted, have the confirmed price and have sufficient stock. Concurrent changes to those product documents conflict with the transaction and are reconsidered on retry. Carts use optimistic concurrency for all saves. A consumed cart cannot be bought again by simultaneous requests; a repeated request sees an empty cart (400). A stale reviewed revision returns 409. A buyer adding a new cart after a successful purchase starts a new purchase: there is no persistent HTTP idempotency key or response replay mechanism.

## Explicit price and confirmation policy

Cart prices are **not locked quotes**. Catalog price applies at checkout, but the server does not silently replace the buyer's confirmed price. Both price increases and decreases return 409 for stale cart prices. Cart GET already refreshes prices; the client refreshes after rejection and the buyer must confirm again.

The client validates all draft quantities before saving, serializes item writes, waits for a fresh server cart and captures a separate confirmation snapshot. The modal displays that snapshot's quantities, prices and total; POST sends its revision. Background refreshes or a second device cannot silently replace the snapshot. The server also rejects a different cart revision even if another device already refreshed its prices. API callers must adopt the revision contract; old clients omitting it receive 400. The UI's per-edit quantity limits remain integers from 1 through 500; checkout validates positive safe-integer stored quantities rather than trusting database imports.

## Status and stock effects

| Current status | Allowed next status |
| --- | --- |
| pending | confirmed, cancelled |
| confirmed | processing, cancelled |
| processing | completed, cancelled |
| completed | none |
| cancelled | none |

Repeating the current status is a successful no-op with no notification or restoration. Other backwards moves, skipped stages and reopening terminal states return 409. Unknown values remain 400 through the existing validator (also checked in the transaction service). Admin UI actions reflect the graph and surface errors.

New orders record `inventoryState: "reserved"` inside checkout. Cancellation requires that marker, changes it to `"restored"`, updates status and restores every line in one transaction. Concurrent cancellation callbacks serialize through the order write; a retry sees cancelled and does nothing. If a product record is missing or a quantity is invalid, cancellation fails and all restorations/status changes roll back. Soft-deleted products still retain stock records and can be restored. There is no payment processor or refund implementation.

## Caching, notifications and authorization

Clerk middleware, buyer/admin route restrictions, invoice ownership checks and Socket.IO authentication are unchanged. Cache invalidation and the existing admin `new_order` event run after committed checkout; committed cancellation invalidates product caches. The existing status email selection is preserved, including no processing email. Same-state requests do not send another email.

Each after-commit effect has a one-second waiting deadline and its own error handling. A rejected or stalled cache call cannot suppress the socket/email calls or convert a committed purchase into a failed response. The underlying timed-out operation is not forcibly cancelled and may finish later. SMTP remains direct asynchronous, best-effort sending; it has no durable outbox, persisted retries or exactly-once delivery guarantee. A process failure after commit can lose a notification or cache invalidation. Catalog caches can still serve stale entries until expiration; checkout always checks MongoDB. Notification order between concurrent status requests is not guaranteed.

## Prerequisites and migration review

No migration, seed or production database command was run for this work.

1. Use a transaction-capable MongoDB replica set or supported sharded cluster with WiredTiger and majority writes. Standalone MongoDB is unsupported for these writes; there is deliberately no unsafe nontransactional fallback. Tests exercised MongoDB 7.0.24, not every supported server topology/version. Verify the application's MongoDB driver compatibility, session permissions, primary routing and transaction capacity on an isolated staging database before rollout.
2. Back up and reconcile existing orders, carts and stock before deploying. Historical checkout failures may have created orders with only some deductions; historical cancellations may already have restored stock repeatedly. The new code cannot infer what happened from current status. Compare line-level inventory movements, physical stock and operator records under a controlled write pause. Resolve missing product references, invalid quantities/prices/stock, duplicate buyer carts and missing/invalid cart `__v` fields. Confirm the existing unique buyer-cart and order-number indexes exist before enabling concurrent traffic.
3. `inventoryState` has **no default or automatic backfill**. Existing unmarked orders cannot be cancelled until explicitly reconciled. Only a verified still-reserved, fully deducted order may be marked `reserved`; a verified cancelled/restored order may be marked `restored`. Do not blanket-mark all open orders. Partially deducted or over-restored records require an operator-approved inventory correction first. Reconciliation and marker writes should be conditional on the reviewed order state under the write pause. This PR intentionally includes no executable bulk backfill.
4. Deploy the client and API revision contract together and expire old browser bundles as appropriate. Confirm both price-change rejection and another-device cart edits in staging. Existing scripts/integrations posting only notes must add the reviewed `cartVersion`.
5. Stop mixed old/new API writers during rollout. The old cancellation handler does not understand terminal states or inventory markers. Rolling back to it can reintroduce double restoration even for new orders. Preserve backup/reconciliation records and plan a controlled rollback; do not just revert the handler during active ordering.
6. Compile TypeScript before any future deployment. The current Render Blueprint only installs and starts committed dist; it does not run the server build. This PR updates directly affected compiled files and adds the compiled transaction service. A clean build also regenerates unrelated baseline-drift files, which were excluded from this PR. Build all output in a release pipeline as a separate follow-up. No hosting service was changed or deployed here.
7. Branch-specific `git.deploymentEnabled: false` is included in root, client and server Vercel configurations for `fix/phase3-atomic-checkout-2026-11-06`, because PR #4 showed previews in both package roots. Other branches keep their existing default behavior. This is a review-branch deployment guard, not a rollout. [Vercel configuration reference](https://vercel.com/docs/project-configuration/git-configuration#gitdeploymentenabled).

## Remaining limitations and disclosure

- Admin product edits still submit absolute stock from a form. An old form can overwrite intervening checkout/cancellation stock changes. Coordinate inventory editing during rollout; versioned admin edits or a movement ledger is separate work. These transactions do not establish a global inventory accounting guarantee.
- There is no reservation expiry, payment settlement, refund workflow, request-key replay, transactional outbox or reconciliation ledger. Network loss after commit can leave the buyer uncertain; inspect order history before attempting a new purchase.
- Prices/totals use existing JavaScript numbers, not integer currency units/Decimal128. Order numbers retain the existing random suffix and unique index; collisions abort checkout rather than leave partial deductions, but do not have a dedicated identifier retry policy.
- The tests exercise controllers/services and real MongoDB, with synthetic identities and external boundaries stubbed. Real Clerk sessions, SMTP, Redis, socket clients, image services, full browser flows, failover and hosting were not verified.
- Use only synthetic data for demos and test reports. Do not disclose customer names, phone numbers, emails, addresses, invoice contents, secrets or client-owned assets. This implementation adds no claim about authorship, client acceptance, business outcomes or third-party ownership.

See [verification results](phase3-verification.md) for baseline versus branch checks and the regression coverage.
