# Phase 3: Core REST API Endpoints

## Goal
Implement the 7 core REST API endpoints covering Orders, Customers, and Dashboard, organized into a clean layered architecture.

## What Was Done
- **Orders Endpoints (`app/routers/orders.py`)**:
  - `GET /orders`: List orders with customer name search, status filtering, multi-field sorting, and server-side pagination.
  - `POST /orders`: Create an order with customer ID, positive amount, and initial status.
  - `PATCH /orders/{order_id}/status`: Partially update an order status.
- **Customers Endpoints (`app/routers/customers.py`)**:
  - `GET /customers`: List customers with completed order counts and values.
  - `GET /customers/{customer_id}`: Customer profile with completed metrics.
  - `GET /customers/{customer_id}/orders`: Paginated order history for a specific customer.
- **Dashboard Endpoint (`app/routers/dashboard.py`)**:
  - `GET /dashboard/summary`: Total orders, total completed order value, and total customer count.
- **Service Layer**: Business and query logic encapsulated in `OrderService`, `CustomerService`, and `DashboardService`.

## Key Decisions
- **Layered Architecture**: Routers handle HTTP request parsing and response contracts; services execute database queries and transactions.
- **Server-Side Aggregation**: Dashboard and customer metrics use SQL `COUNT` and `SUM` directly in PostgreSQL rather than computing them in Python or React.
- **Whitelist for Sorting**: Restricted sort fields to `created_at`, `amount`, and `status` to prevent SQL injection and ensure queries hit indexed columns.

## Verification
- Tested all 7 endpoints with curl and Python scripts against live PostgreSQL.
- Verified interactive Swagger UI at `http://127.0.0.1:8000/docs`.
- Verified server-side pagination: `GET /orders?page=2&page_size=5` returned 5 items with correct page metadata.