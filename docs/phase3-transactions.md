# Phase 3 checkout and inventory protocol

Base main: `84641380c55b4ae8b8f70fdddf9c7f6977d4e516`. Addresses PRS-01–PRS-03 from [documentation PR #4](https://github.com/diretrix-git/Pranil-Store/pull/4) and the source-backed audit ledger. This implementation is independent of PR #4 and does not modify the portfolio.

## Checkout and pricing

Checkout reads the buyer's live cart and active/non-deleted products inside a snapshot transaction. Every line needs a distinct product and positive safe-integer quantity. Order creation, sequential stock deductions and cart consumption commit together with majority write concern. Deductions match ID, price, active/non-deleted state and `stock >= quantity`; a later failure rolls back all business writes.

Prices are **not locked when adding to cart**. A cart price differing from the live transactional product price, whether higher or lower, returns 409 without creating an order, deducting stock or modifying the cart. Refreshing uses the existing GET cart price-update behavior; buyers must review refreshed prices. Snapshots use validated live product names, units and prices. Tax/discount remain zero. A concurrent price write triggers a transaction conflict/retry and then rejection of the changed price.

The current client completes quantity synchronization and refresh before opening confirmation, disables edits while preparing/confirming, and submits optional `cartVersion` from the reviewed cart's `__v`. A mismatched version returns 409; malformed versions return 400. Existing clients may still POST `{notes}` without a new mandatory header: the server binds transaction retries to its initial cart version, but cannot guarantee that a legacy client's displayed cart matches that snapshot. Upgrade external clients and refresh old tabs for reviewed-version protection. Success remains HTTP 201 with the existing response shape.

Cart saves now use optimistic concurrency. Stale saves cannot repopulate consumed items; version errors map to 409. Callback retries retain the originally observed version rather than silently including concurrent cart edits. Concurrent checkout of the same cart creates one order. There is no durable request-key replay: a lost successful response may be followed by an empty-cart/conflict response; inspect My Orders before rebuilding a cart and retrying.

## Order states and external effects

| Prior state | Allowed next states |
| --- | --- |
| pending | confirmed, cancelled |
| confirmed | processing, cancelled |
| processing | completed, cancelled |
| completed | none |
| cancelled | none |

Repeated, skipped, reversed or reopened transitions return 409; invalid enum values still fail the existing route validator. The admin modal offers current/legal states only. Completion is terminal: refunds/returns require a separate workflow. Stock remains deducted at initial pending checkout, not confirmation.

Status is conditionally claimed using its prior value inside a transaction. Cancellation restores all lines in that transaction; a missing product or malformed legacy quantity aborts status and all earlier restoration. Existing soft-deleted products may receive stock without being reactivated. Repeated/concurrent cancellation cannot restore twice.

TypeScript Clerk verification, active-user checks, buyer-only checkout, admin-only status changes and invoice ownership guards are unchanged. Cache invalidation, the existing `new_order` Socket.IO payload and existing email status rules run after commit, outside retries. Redis, Socket.IO and SMTP remain best effort; process crashes can lose post-commit events. No durable queue/outbox or exactly-once delivery claim is introduced.

## Migration and deployment prerequisites

1. Use a transaction-capable replica set or supported sharded MongoDB deployment compatible with the lockfiles. The server rejects standalone topology at startup; there is no nontransaction fallback. Tests use MongoDB 8.0.
2. Drain **all old backend/cart writers** before cutover. Old saves do not honor optimistic versions, and mixed writers can defeat the protocol. Close/refresh old browser forms and upgrade external clients to use reviewed versions where applicable.
3. Back up and reconcile legacy open orders, carts and stock **before enabling patched status mutations**. Old partial checkouts and reopen/cancel cycles may already have inconsistent stock. This repair cannot infer their correct historical deductions. Existing cart `__v` values must be present/coherent; do not reset versions or replay old failed orders automatically.
4. Prepare storage with writers stopped, using the intended development/staging configuration:

   ```sh
   cd server
   node --env-file=.env -r ts-node/register scripts/prepareOrderStorage.ts
   ```

   This checks topology and creates collections/indexes additively, without dropping indexes or rewriting records. Resolve duplicate/incompatible legacy data through a reviewed migration. Checkout requires global ascending unique `Cart.buyer` and `Order.orderNumber` indexes, with no partial filter, sparse/TTL options or non-simple collation. Missing/weakened indexes fail closed with 503. Do not alter the index catalog during live writes.
5. Compile source before deployment. The current Render blueprint installs dependencies and starts tracked `server/dist/server.js`, so this branch includes reviewed generated outputs plus the new service/preparation script. The compiler also aligns stale generated files with pre-existing main TypeScript: cart validation, order-number randomness, admin checks and route middleware. Those are generated-only differences, not new TypeScript policies. Future deployments should run the build explicitly rather than assume dist is current. This task does not deploy.
6. Review the price-conflict and terminal-state policy with operators; never reopen cancelled orders for refunds/adjustments. Validate actual Clerk, Redis, SMTP and Socket.IO integration in staging.

## Disposable regression workflow

Validated with Node 24.22.1 and Docker. Ports 27029/27030 must belong exclusively to disposable fixtures. Tests ignore application `MONGO_URI`, use random `pranil_phase3_test_*` database names and drop only their own databases. Do not forward these ports to shared/production databases.

```sh
(cd server && npm ci --no-audit --no-fund)
(cd client && npm ci --no-audit --no-fund)
docker run -d --name pranil-phase3-rs -p 127.0.0.1:27029:27017 mongo:8.0 --replSet phase3 --bind_ip_all
docker exec pranil-phase3-rs mongosh --quiet --eval 'rs.initiate({_id:"phase3",members:[{_id:0,host:"localhost:27017"}]})'
# Wait until db.hello().isWritablePrimary is true.
docker exec pranil-phase3-rs mongosh --quiet --eval 'db.hello().isWritablePrimary'
docker run -d --name pranil-phase3-standalone -p 127.0.0.1:27030:27017 mongo:8.0 --bind_ip_all
(cd server && npm test && npm run typecheck && npm run build)
(cd client && npm test)
(cd client && npx tsc --noEmit) # baseline errors: record them, then continue
(cd client && npm run lint && npm run build)
docker rm -fv pranil-phase3-rs pranil-phase3-standalone
```

Controller tests use real database writes with synthetic request/response objects. SMTP transport, email and cache effects are stubbed before controller import, including the existing import-time SMTP probe. Socket.IO is a recording stub. The page regression renders actual Admin Orders under a synthetic query provider without Clerk/API calls. These checks do not replace live authenticated browser, multi-node failover, sharded deployment or production load validation.
