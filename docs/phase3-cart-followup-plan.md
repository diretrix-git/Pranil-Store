# Phase 3 cart confirmation follow-up

Starting point: `2d343112ed08fa087a9a3c7ee4a6e86d5d94f3d8` on the existing implementation branch and draft PR #5. Reviewed independent report F1-F3 before edits. The user's request authorizes this implementation and the same draft PR; main, documentation PR #4, portfolio and hosting are outside scope.

## Design

Retain the API, Clerk boundary, server transactions, cartVersion policy and visual layout. Route quantity blur/debounce, removal, clear and checkout preparation through one per-mounted-cart serialized writer. Coalesce the same draft generation; discard obsolete queued drafts, while an already-running request drains before deletion or confirmation. Failed writes stay visible and retain unsaved drafts. Preparation drains in-flight writes and fails if one fails during that drain; a later deliberate retry may retry its retained draft.

Removal and clear clean timers/drafts on successful deletion. Checkout prunes against an uncached current-cart read before flushing. A synchronous lock prevents competing preparations and edits while preparation runs. Confirmation uses a second deliberately uncached post-write GET, never QueryClient.fetchQuery; cancel old abort-aware queries before mandatory reads and writes. Keep the confirmation copy independent of query-cache changes and dispose timers on unmount.

## Tasks

1. Add React DOM integration tests using the installed React/QueryClient, Testing Library and deferred synthetic API responses. Demonstrate F1-F3 failures before production edits. Cover removal/clear/re-add, blur-click, running debounce, multiple edits, repeated preparation, genuine write failure, a delayed old GET and confirmed quantities/cartVersion.
2. Implement the scoped cart editor hook and wire existing UI controls, busy states, draft preservation and uncached confirmation. Run component and original helper tests.
3. Permanently add the four independent MongoDB probes to the existing real-replica-set tests. Do not change transaction behavior without a reproduced defect.
4. Run server tests/typecheck/build, client component tests/typecheck/optimized build/configured lint. Compare against the starting branch (16 client errors) and main (20), without hiding existing failures. Verify changed dist parity and explicitly report baseline drift.
5. Update rollout/verification notes, obtain a fresh review, then publish to the same guarded branch with a lease on the reviewed SHA. Keep PR #5 a draft; no merge or deployment.

## Execution record

F1-F3 tests were written before application changes and the original component failed them. An isolated pinned export also failed the expanded 12 core cases. Implemented one generation-aware write queue, explicit pending-write failure propagation, successful removal/clear cleanup, synchronous preparation locks and separate uncached membership/confirmation reads. The fixed component passed 12 tests.

Fresh review found no Critical/Important defect and passed those 12 cases. Its cleanup cancellation-toast minor prompted three lifecycle tests, which first failed. The editor now suppresses only its intentional cleanup read cancellation, never publishes late responses after unmount, and does not start disposed queued mutations. The expanded 15-test suite passed. No second independent sign-off is claimed for those final corrections.

The four previously passing transaction probes are permanent controller-level tests with real MongoDB validators/retries and effect counts. Both terminal race winners are tested deterministically. Latest counts/commands and baseline limitations are recorded in phase3-verification.md.

Decision: use deliberate uncached reads plus cancellation and revision-aware cache publication, preserving the existing API. This adds a pre-flush membership read and a final confirmation read; it costs two cart round trips and retains safe conflict responses for external writers.

Decision: do not rewrite the seven unchanged baseline dist mismatches or unrelated client type failures in this bounded follow-up; report them and require a full release build. This leaves known release debt visible rather than blending it into the F1-F3 fix.
