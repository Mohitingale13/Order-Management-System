# Phase 4 - API Validation & Reliability

This document logs the implementation and verification of Phase 4: enforcing multi-tiered validation across request schemas and business logic, adding robust global error handling to prevent sensitive data or stack trace leakage, and verifying system resilience during database outages.

---

## 1. Reliability Architecture

```text
                     HTTP Request
                          |
                          v
                 +-----------------+
                 | FastAPI/Pydantic|
                 | Input Validation|
                 +--------+--------+
                          |
                          v
                     API Router
                          |
                          v
                    Service Layer
                          |
                 +--------+--------+
                 |                 |
              Valid             Invalid
                 |                 |
                 v                 v
             SQLAlchemy           4xx
                 |
                 v
            PostgreSQL
                 |
           +-----+-----+
           |           |
        Success      Error
           |           |
           v           v
         2xx          500
```

---

## 2. Multi-Tiered Validation Strategy

### A. Request-Level Validation (Pydantic)
- **Positive Order Amount**: `amount: Decimal = Field(gt=0, decimal_places=2)`. Values `<= 0` immediately trigger a `422 Unprocessable Entity` response before reaching any database or service code.
- **Strict Status Enum**: `status: OrderStatus` restricts values to `pending`, `completed`, or `cancelled`. Any arbitrary string is rejected with HTTP `422`.
- **Bounded Pagination**: `page >= 1` and `1 <= page_size <= 100`. Requests for `page=0` or `page_size=1000` are rejected with HTTP `422`.

### B. Business & Resource Validation (Service Layer)
- **Customer Existence Check**: When creating an order (`POST /orders`), the service confirms the referenced `customer_id` exists in the database. If missing, it returns `404 Not Found` (`{"detail": "Customer not found"}`).
- **Resource Lookups**: Requesting a nonexistent customer (`GET /customers/{id}`), querying orders for an invalid customer (`GET /customers/{id}/orders`), or updating an invalid order (`PATCH /orders/{id}/status`) returns `404 Not Found`.
- **Empty Result Distinction**: An empty search (`GET /orders?search=nonexistent`) is a valid query with zero matching records, returning `200 OK` with `items: []`, `total: 0`, and `total_pages: 0` (never a misleading 404).

### C. Database Failure Handling & Exception Masking
- **Global Error Handlers**: Added handlers in `app/main.py` for `SQLAlchemyError` and unexpected runtime exceptions.
- **Log Server-Side, Mask Client-Side**: The actual technical exception and stack trace are logged server-side for diagnostics, while the client receives a clean, generic HTTP `500` response (`{"detail": "Unable to process the request at this time."}`).
- **Transaction Rollbacks**: If any database write operation fails during order creation or status update, the session explicitly calls `db.rollback()` to prevent lingering broken session state.

---

## 3. Reliability Test Matrix & Verification

All scenarios were tested against the live backend:

| Category | Endpoint / Action | Input / Condition | Status | Expected Response | Result |
|---|---|---|---|---|---|
| Orders List | `GET /orders` | Default parameters | **200 OK** | Paginated items | **PASS** |
| Pagination Bound | `GET /orders?page=0` | `page=0` | **422** | Unprocessable Entity | **PASS** |
| Page Size Limit | `GET /orders?page_size=101` | `page_size=101` | **422** | Unprocessable Entity | **PASS** |
| Status Validation | `GET /orders?status=invalid` | `status=banana` | **422** | Unprocessable Entity | **PASS** |
| Empty Results | `GET /orders?search=xyz-not-found` | No matches | **200 OK** | `items: []`, `total: 0` | **PASS** |
| Customer Lookup | `GET /customers/1` | Existing ID | **200 OK** | Customer record | **PASS** |
| Missing Customer | `GET /customers/99999` | Invalid ID | **404** | `Customer not found` | **PASS** |
| Customer Orders | `GET /customers/99999/orders`| Invalid customer | **404** | `Customer not found` | **PASS** |
| Create Order Valid | `POST /orders` | `customer_id: 1, amount: 250` | **201** | Created order | **PASS** |
| Negative Amount | `POST /orders` | `amount: -5.00` | **422** | Input > 0 constraint | **PASS** |
| Missing Customer FK | `POST /orders` | `customer_id: 99999` | **404** | `Customer not found` | **PASS** |
| Patch Status Valid | `PATCH /orders/1/status` | `status: completed` | **200 OK** | Updated status | **PASS** |
| Patch Missing Order| `PATCH /orders/99999/status` | Invalid order | **404** | `Order not found` | **PASS** |
| Database Outage | `GET /orders` | PostgreSQL stopped | **500** | Generic error masked | **PASS** |
| Outage Recovery | `GET /orders` | PostgreSQL restarted | **200 OK** | Automatic recovery | **PASS** |

---

## 4. Invigilator Checkpoint Q&A

**Q: Why is negative amount rejected by the backend instead of just frontend validation?**  
A: Frontend validation is solely for user feedback and can be bypassed (e.g. via direct API calls or curl). Backend validation guarantees data correctness and financial integrity.

**Q: Why is a nonexistent customer a 404 rather than 422?**  
A: The JSON payload itself is structurally valid (integer ID, decimal amount, valid status). The failure is a missing resource in database state, which maps to HTTP 404.

**Q: Why is an empty search query not a 404?**  
A: The orders resource exists and the query syntax is completely valid. It simply matched 0 items. Returning HTTP 200 with an empty list allows the frontend to display an empty state gracefully.

**Q: Why limit page size to 100?**  
A: Without an upper bound, a client could request `page_size=1000000`, causing memory spikes and high query latency. A strict upper bound protects backend and database resources.

**Q: What happens if PostgreSQL goes down?**  
A: The database exception is caught by the global `SQLAlchemyError` handler, logged server-side for developer investigation, and the client receives a clean HTTP 500 response without internal database URLs or stack traces.

**Q: Why rollback transactions on error?**  
A: If a SQL error occurs during a transaction, the SQLAlchemy session enters a failed state. Calling `db.rollback()` clears this state so the session can be safely reused or returned to the connection pool.

---

## 5. Phase 4 Verification Checklist
- [x] Strict Pydantic validation on all request bodies and query parameters
- [x] Bounded pagination constraints (`page >= 1`, `1 <= page_size <= 100`)
- [x] Standardized 404 responses for nonexistent customers and orders
- [x] Clean 200 response with `items: []`, `total: 0`, `total_pages: 0` for empty searches
- [x] Global database error handling hiding stack traces and sensitive information
- [x] Outage and recovery verified with PostgreSQL container stop/start
- [x] README.md and DECISIONS.md updated
- [x] docs/phase-4.md created