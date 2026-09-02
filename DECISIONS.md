# Engineering Decisions

## PostgreSQL
Chosen because the domain is relational: customers have many orders, and the application relies on foreign keys, joins, transactional integrity, and aggregate queries. PostgreSQL provides robust ACID guarantees and is well-suited to the operational access patterns.

## SQLAlchemy
Chosen for ORM-based database access and declarative model mappings while keeping database operations explicit. Business and query logic are encapsulated inside a service layer (`app/services/`) so route handlers remain thin and decoupled from direct database operations.

## Offset Pagination
Chosen because page-based offset pagination (`LIMIT` / `OFFSET`) is simple, predictable, and fully satisfies the assignment requirements, including direct page jumping. Keyset/cursor-based pagination is documented as the next evolutionary step if dataset volume or deep traversal patterns require it.

## Server-side Filtering
Customer search, status filtering, sorting, and pagination are executed entirely on the database server. This ensures the frontend receives only the active page slice (<5 KB) rather than downloading the entire dataset, maintaining constant client performance as records scale.

## Customer Aggregation
Completed order count and completed order value are calculated server-side from order records using SQL aggregations (`COUNT` and `COALESCE(SUM(...), 0)` with `LEFT JOIN`) rather than stored as denormalized fields on the customer table. This guarantees metrics remain derived from source order data and avoids complex synchronization logic when order statuses change.

## Status Update
Implemented as the additional operations feature using `PATCH /orders/{order_id}/status`. `PATCH` was selected over `PUT` because only the status field is modified. Allowed statuses are strictly validated by the backend enum. When an update fails, the frontend automatically reverts the dropdown to its previous state.

## State Modeling & Reliability
Frontend views explicitly model four distinct states: Loading, Success (with data), Empty Result, and Error. Asynchronous lifecycles clear loading flags unconditionally within `.finally()` blocks to prevent stuck loading states on failure. Mutation buttons and dropdowns lock during in-flight requests to prevent duplicate submissions, and unexpected database errors are masked as generic HTTP 500 responses without exposing internal stack traces.