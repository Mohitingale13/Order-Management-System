# Phase 9: Dashboard Summary Feature

## Goal
Connect the Dashboard to `GET /dashboard/summary`, displaying live PostgreSQL-backed metric cards and a recent activity feed with resilient states.

## What Was Done
- **Metric Cards**:
  - **Total Orders**: Count of all orders recorded in the database.
  - **Completed Order Value**: Total monetary revenue from completed orders (`formatCurrency()`).
  - **Total Customers**: Total registered customer accounts.
- **Recent Activity**: Live table displaying the newest orders with customer links, formatted amounts, status badges, and timestamps.
- **On-Demand Refresh**: "Refresh" button in header to re-query latest PostgreSQL state without a full page reload.
- **Resilient States**: Skeleton loaders (`...`) to prevent flashing misleading zero values, and an error state with an interactive "Retry" button.

## Key Decisions
- **Single Endpoint**: Used one `GET /dashboard/summary` endpoint to retrieve all three metrics in a single network round-trip.
- **Derived Metrics**: All aggregations are calculated directly in PostgreSQL using `COUNT` and `COALESCE(SUM(...), 0)`.
- **Scope Discipline**: Omitted heavy chart and analytics libraries to keep the bundle small, maintainable, and focused on core operational metrics.

## Verification
- Created a completed order -> Total Orders and Completed Value increased immediately.
- Created a pending order -> Total Orders increased; Completed Value remained unchanged.
- Updated pending order to completed -> Completed Value increased dynamically.
- `npm run build` passed with 0 errors.