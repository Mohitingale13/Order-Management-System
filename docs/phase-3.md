# Phase 3 - Backend Core REST API

This document details the implementation and verification of Phase 3: creating the 7 core REST API endpoints across Orders, Customers, and the Operations Dashboard, adhering to a clean Router -> Service -> SQLAlchemy -> PostgreSQL architecture.

---

## 1. API Architecture

```text
               FastAPI (main.py)
                       |
       +---------------+---------------+
       |               |               |
       v               v               v
     Orders        Customers       Dashboard
    (Router)        (Router)        (Router)
       |               |               |
       v               v               v
  OrderService  CustomerService DashboardService
       |               |               |
       +---------------+---------------+
                       |
                       v
                SQLAlchemy 2.0
                       |
                       v
                  PostgreSQL
```

### Layer Separation
- **Routers (`backend/app/routers/`)**: Handle HTTP parameters, status codes, query validation, and response serialization.
- **Services (`backend/app/services/`)**: Encapsulate business logic, database queries, joins, and aggregations.
- **Schemas (`backend/app/schemas/`)**: Define strict Pydantic request/response contracts and validation rules.
- **Models (`backend/app/models/`)**: SQLAlchemy declarative mappings.

---

## 2. Implemented Endpoints

### Orders
- **`GET /orders`**:
  - Query parameters: `search` (customer name `ILIKE`), `status` (OrderStatus enum), `sort_by` (`created_at`, `amount`, `status`), `sort_order` (`asc`, `desc`), `page` (int >= 1), `page_size` (int between 1 and 100).
  - Returns paginated order list with compact customer info, `total` items, and `total_pages`.
- **`POST /orders`**:
  - Request body: `customer_id`, `amount` (> 0), `status` (defaults to `pending`).
  - Verifies customer existence (returns 404 if customer not found).
  - Returns created order with HTTP 201 Created.
- **`PATCH /orders/{order_id}/status`**:
  - Partially updates order status to `pending`, `completed`, or `cancelled`.
  - Returns 404 if order does not exist.

### Customers
- **`GET /customers`**:
  - Returns customer summary list with `completed_orders` count and `completed_order_value` aggregated directly in PostgreSQL.
- **`GET /customers/{customer_id}`**:
  - Returns customer details or raises 404 if not found.
- **`GET /customers/{customer_id}/orders`**:
  - Returns paginated list of orders for the specified customer or raises 404 if customer does not exist.

### Dashboard
- **`GET /dashboard/summary`**:
  - Returns operations overview metrics: `total_orders`, `total_completed_order_value`, `total_customers`.

---

## 3. Comprehensive Verification Results

All 14 test scenarios were verified against the live PostgreSQL database:

| # | Test Case | Endpoint / Condition | Result |
|---|-----------|----------------------|--------|
| 1 | List Orders | `GET /orders` | **PASS (200 OK, total: 40)** |
| 2 | Search Orders | `GET /orders?search=Acme` | **PASS (200 OK, total: 4)** |
| 3 | Filter by Status | `GET /orders?status=completed` | **PASS (200 OK, total: 18)** |
| 4 | Sort Orders | `GET /orders?sort_by=amount&sort_order=desc` | **PASS (200 OK, descending values)** |
| 5 | Server-Side Pagination | `GET /orders?page=2&page_size=5` | **PASS (200 OK, items 6-10, total_pages: 8)** |
| 6 | List Customers | `GET /customers` | **PASS (200 OK, total: 10)** |
| 7 | Customer Summary Aggregation | `GET /customers` | **PASS (Calculated in PostgreSQL, exact decimal sum)** |
| 8 | Customer Orders | `GET /customers/1/orders` | **PASS (200 OK, 4 customer orders)** |
| 9 | Dashboard Summary | `GET /dashboard/summary` | **PASS (40 orders, $32,811.95 completed value, 10 customers)** |
| 10 | Create Order | `POST /orders` | **PASS (201 Created)** |
| 11 | Patch Order Status | `PATCH /orders/{id}/status` | **PASS (200 OK, status updated)** |
| 12 | Input Validation | `POST /orders` (amount = -5.00) | **PASS (422 Unprocessable Entity)** |
| 13 | Nonexistent Customer | `GET /customers/999` | **PASS (404 Not Found)** |
| 14 | Nonexistent Order | `PATCH /orders/99999/status` | **PASS (404 Not Found)** |

---

## 4. Invigilator Checkpoint Q&A

**Q: Why use query parameters for search, filtering, and sorting?**  
A: They represent different views and slices of the same `Orders` collection. Using query parameters follows standard RESTful conventions without needlessly multiplying endpoints.

**Q: Where does pagination happen and why?**  
A: Strictly at the database layer using SQL `LIMIT` and `OFFSET`. This prevents loading thousands or millions of records into memory or shipping large payloads over the network.

**Q: Can the client sort by any arbitrary SQL column?**  
A: No. Sortable fields are strictly whitelisted to `created_at`, `amount`, and `status`. Any arbitrary string is rejected by Pydantic validation before reaching SQL.

**Q: What happens if a client requests `page_size=10000`?**  
A: FastAPI query validation caps `page_size` with `le=100` and rejects the request with HTTP 422, protecting database resources.

**Q: Where is completed order value computed?**  
A: Directly inside PostgreSQL using `SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END)`. The React frontend receives the aggregated sum without downloading raw order data.

**Q: Why use PATCH instead of PUT for updating order status?**  
A: `PATCH` applies a partial modification to an existing resource (updating only the `status` field), whereas `PUT` implies replacing the entire entity.

**Q: Why are DELETE endpoints omitted?**  
A: Order deletion was not specified in the requirements. Omitting unnecessary destructive mutations preserves audit trails and prevents scope bloat.