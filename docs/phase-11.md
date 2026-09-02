# Phase 11: Scale Review (5M+ Orders & 100k+ Customers)

## Goal
Demonstrate how the Order Management System architecture handles large data volumes (5,000,000+ orders and hundreds of thousands of customers) without client memory crashes or premature architectural bloat.

## Architectural Approach
- **Server-Side Slicing**: Filtering (`WHERE`), sorting (`ORDER BY`), and pagination (`LIMIT/OFFSET`) execute directly inside PostgreSQL. The browser receives only the active page slice (<5 KB, ~10-20 rows), maintaining constant client memory usage regardless of total dataset size.
- **Targeted B-Tree Indexes**: Aligned with operational access patterns:
  - `orders.customer_id`: Joins and customer order history inspection.
  - `orders.status`: Operations status filtering.
  - `orders.created_at`: Chronological feed sorting.
  - `customers.email`: Fast lookups and uniqueness enforcement.
- **Index Trade-Offs**: Each index consumes disk and adds write latency to `INSERT` and `UPDATE` operations. Composite indexes (e.g. `(status, created_at DESC)`) should be introduced only when justified by production `EXPLAIN ANALYZE` telemetry rather than added prematurely.

## Key Decisions & Future Evolution
- **Offset vs Cursor Pagination**:
  - *Current*: Offset-based pagination (`OFFSET X LIMIT Y`) is simple, predictable, and supports direct page jumping as required by the assessment.
  - *Scale Path*: At very deep offsets (e.g. page 50,000), PostgreSQL must scan and discard 500,000 preceding rows. If deep historical traversal becomes a bottleneck, the API will evolve to keyset/cursor pagination (`WHERE (created_at, id) < (cursor_date, cursor_id)`), providing $O(1)$ indexed retrieval.
- **Customer Selector Scaling (100k+ Accounts)**:
  - The static `<select>` dropdown in the order creation form will transition to a debounced server-side typeahead search (`GET /customers?search=...&limit=10`) so the browser never attempts to render thousands of static DOM options.
- **High-Volume Infrastructure Options**:
  - **Read Replicas**: Distribute dashboard and listing queries away from primary write nodes if read contention arises.
  - **Redis Caching**: Cache `GET /dashboard/summary` aggregates with short TTLs if concurrent operational traffic increases.
  - **Table Partitioning**: Range-partition orders by year/quarter (`PARTITION BY RANGE (created_at)`) to isolate active operational data from multi-year cold archives.
  - *These mechanisms are intentionally omitted now because current application scope does not justify the added operational complexity.*

## Verification
- Verified server-side SQL generation in SQLAlchemy (`query.offset(offset).limit(page_size)`).
- Verified active B-tree indexes in migration `9d398409b956`.
- Verified documentation alignment in `README.md` and `DECISIONS.md`.