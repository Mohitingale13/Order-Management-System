# Phase 10: Reliability & Error Resilience Pass

## Goal
Perform a system-wide reliability audit ensuring predictable state transitions, non-blocking loading resolution, mutation concurrency safety, and graceful error recovery.

## What Was Done
- **Non-Blocking Loading**: Audited all frontend async lifecycles (`DashboardPage`, `OrdersPage`, `CustomersPage`, `CustomerDetailsPage`), guaranteeing `setLoading(false)` runs in `.finally()` blocks so the UI never gets permanently stuck on "Loading...".
- **State Differentiation**: Explicitly separated views into 4 states: Loading, Success (with data), Empty Result, and Error. Empty search results show informative empty boxes, not error states.
- **Duplicate Mutation Lock**: Submit buttons and in-place dropdowns disable and show in-flight indicators (`Creating Order...`, `...`) while requests are active.
- **Database Safety**: Mutation service methods use `try...except...db.rollback()` to prevent orphaned transaction sessions.
- **Error Masking**: Database failures return a controlled generic HTTP 500 response (`Unable to process the request at this time.`) without exposing database URLs, credentials, or stack traces.

## Key Decisions
- **finally Guarantee**: Guarantees that whether a network call succeeds or fails, loading indicators are always cleared.
- **Manual Retry over Auto-Retry**: Automated retries can be dangerous for mutation requests (POST/PATCH). Providing a manual "Retry" button gives users intentional control over resending requests.

## Verification
- Empty search (`GET /orders?search=zzzzzzzz`) -> HTTP 200 with `items: []`, `total: 0`.
- Negative/zero amount -> HTTP 422.
- Missing customer/order ID -> HTTP 404.
- Container outage test: stopped PostgreSQL container (`docker compose stop postgres`) -> API returned controlled 500 -> restarted container -> recovered 200 OK within 2 seconds without restarting the FastAPI server.
- `npm run build` passed with 0 errors.