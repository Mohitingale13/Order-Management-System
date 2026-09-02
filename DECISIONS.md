# Engineering Decisions

A summary of key technical choices, why they were made, and the trade-offs involved.

---

## 1. Database: PostgreSQL
- **Why**: The data is inherently relational (one customer has many orders). We need foreign keys to prevent orphan records, ACID transactions so order updates don't corrupt state, and fast aggregation functions (`COUNT`, `SUM`) for reporting.
- **Trade-off**: Requires running a database service, which is handled via Docker Compose so no local PostgreSQL installation is needed on the host machine.

## 2. ORM & Architecture: SQLAlchemy with a Service Layer
- **Why**: SQLAlchemy handles database mappings cleanly without writing raw SQL strings everywhere. Database queries are isolated in a dedicated service layer (`app/services/`) instead of inside route handlers. This keeps FastAPI routes thin (focused on request validation and status codes) and makes business logic easy to test and maintain.
- **Trade-off**: Adds a few more files than writing inline queries inside route functions, but keeps the codebase modular and readable.

## 3. Server-Side Filtering, Sorting & Pagination
- **Why**: The database should do the heavy lifting, not the browser. If there are 50,000 or 5,000,000 orders, loading them into React to filter with JavaScript will freeze the browser and waste bandwidth. By passing query params (`search`, `status`, `sort_by`, `page`) directly to PostgreSQL, each API call returns only 10 to 20 records (<5 KB).
- **Trade-off**: The frontend must fire network requests when filters or pages change, which is why customer search is debounced by 300ms to avoid spamming the backend.

## 4. Pagination Strategy: Offset vs Cursor
- **Why Offset for now**: Standard page-based pagination (`LIMIT` and `OFFSET`) is simple, predictable, and supports jumping directly to specific page numbers (e.g. "Page 3"), which fits operations dashboard usage.
- **When to switch**: On massive tables (5M+ rows), high offsets (like `OFFSET 500000`) get slow because PostgreSQL still has to scan preceding rows. If operations users frequently browse very deep historic archives, the API can transition to keyset/cursor-based pagination (`WHERE id < cursor`).

## 5. Customer Metrics: Calculated, Not Stored
- **Why**: "Completed Orders" and "Completed Value" are calculated directly from the orders table using a SQL `LEFT JOIN` with `COUNT` and `COALESCE(SUM(...), 0)`. Storing these values as fixed columns on the `customers` table would create redundant data that easily gets out of sync when orders are created, cancelled, or updated.
- **Trade-off**: The database runs an aggregation query when fetching customers, but with indexed foreign keys and moderate volume, this is fast and guarantees 100% data consistency.

## 6. Order Status Updates via PATCH
- **Why**: Updating an order status only modifies a single field (`status`), so `PATCH` is the appropriate HTTP method rather than `PUT` (which represents replacing the entire entity). Status values are strictly validated using a Python enum to reject invalid strings before touching the database.
- **Trade-off**: Status transitions were kept flexible (any valid status to any other status) because the assignment did not specify restrictive business rules. If transition rules are introduced later, they can be centralized in `order_service.py`.

## 7. Frontend Reliability: State Modeling & UI Rollback
- **Why**:
  1. Every asynchronous call in React clears its loading flag in a `.finally()` block. This guarantees the UI never gets stuck on a permanent "Loading..." spinner if the backend drops.
  2. Empty search results are rendered as an explicit empty state (`No orders found`), not treated as an error.
  3. When changing an order status in the table, the dropdown disables with a visual indicator (`...`). If the request fails, the dropdown automatically reverts to its previous status so the screen never displays unpersisted state.
  4. Form submission buttons disable during in-flight requests to prevent accidental duplicate submissions.

## 8. Error Masking & Security
- **Why**: The backend catches raw database exceptions (`SQLAlchemyError`) globally and returns a generic 500 response (`Unable to process the request at this time.`). The actual exception details are logged server-side. This prevents database usernames, internal table structures, or connection strings from leaking to the browser.