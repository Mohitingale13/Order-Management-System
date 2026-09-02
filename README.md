# Order Management Dashboard

A small order management dashboard for operations teams.

## Overview

An internal operations dashboard for viewing customers, tracking orders, creating orders, updating order statuses, and calculating customer-level metrics.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, React Router
- **Backend**: FastAPI, Python 3.10, Uvicorn
- **Database**: PostgreSQL 16 (Docker Compose)
- **ORM & Migrations**: SQLAlchemy 2.0, Alembic
- **Validation & Config**: Pydantic v2, Pydantic-Settings

## Project Structure

```text
order-management-system/
  backend/
    app/
      models/
      routers/
      schemas/
      services/
      config.py
      database.py
      main.py
      seed.py
    .env
    requirements.txt
  frontend/
    src/
      components/
        Layout.tsx
        Sidebar.tsx
        StatusBadge.tsx
        Pagination.tsx
      pages/
        DashboardPage.tsx
        OrdersPage.tsx
        CreateOrderPage.tsx
        CustomersPage.tsx
        CustomerDetailsPage.tsx
      services/
        api.ts
        orders.ts
        customers.ts
        dashboard.ts
      types/
        order.ts
        customer.ts
        dashboard.ts
      utils/
        formatters.ts
      App.tsx
      main.tsx
      index.css
    .env.example
  docs/
    phase-1.md
    phase-2.md
    phase-3.md
    phase-4.md
    phase-5.md
    phase-6.md
    phase-7.md
    phase-8.md
    phase-9.md
    phase-10.md
    phase-11.md
  docker-compose.yml
  .gitignore
  README.md
  DECISIONS.md
```

## Frontend

The frontend is built with React, TypeScript, and React Router.

The application is organized into:
- `components/` - Reusable UI layout, badge, and pagination components
- `pages/` - Application view components (Dashboard, Orders, CreateOrder, Customers, CustomerDetails)
- `services/` - Dedicated API communication modules using native `fetch`
- `types/` - TypeScript domain and API response contracts
- `utils/` - Currency and date formatters

### Frontend Configuration

The backend API URL is configured in `frontend/.env` using:
```env
VITE_API_BASE_URL=http://localhost:8000
```
An example template is provided in `frontend/.env.example`.

## Dashboard

The operations Dashboard provides an instant snapshot of operational health through three primary metrics:
- **Total Orders**: Total volume of orders recorded across all statuses (`pending`, `completed`, `cancelled`).
- **Completed Order Value**: Total monetary revenue generated exclusively from orders with `completed` status (`formatCurrency`).
- **Total Customers**: Total registered customer accounts.
- **Server-Side Aggregations**: All three metrics are computed directly in PostgreSQL via a single `GET /dashboard/summary` endpoint, ensuring fast response times regardless of total dataset volume.
- **Resilient States**: Includes clean loading card skeletons, controlled error handling with an interactive **Retry** button, and on-demand refresh.

## Orders & Status Management

The Orders screen supports:
- Customer search with 300ms debouncing
- Status filtering (`All`, `Pending`, `Completed`, `Cancelled`)
- Sorting by supported fields (`Newest`, `Oldest`, `Highest Amount`, `Lowest Amount`)
- Server-side pagination (`Showing X-Y of Z`, Previous/Next and direct page selection)
- **In-place Status Management**: Operations users can update order status directly from the table (`Pending` <-> `Completed` <-> `Cancelled`) via `PATCH /orders/{id}/status` with in-flight loading indicators and automatic error rollback.
- **Order Creation**: Dedicated form at `/orders/new` allowing users to select an existing customer, enter a positive monetary amount, set an initial status, and create the order in PostgreSQL via `POST /orders`.
- **Dynamic Customer Propagation**: Updating an order's status to `completed` automatically increases the customer's completed orders count and completed value in the Customer Summary, while updating away from `completed` decreases it.

## Customer Summary

The Customers screen displays each customer's completed order count and completed order value.

- **Completed Metrics**: Only orders with `completed` status contribute to these metrics, aggregated directly in PostgreSQL.
- **Inclusive Summaries**: Customers with zero completed orders remain visible with `0` completed orders and `₹0.00` completed value.
- **Customer Details Route**: Selecting a customer opens `/customers/:customerId`, displaying customer profile information, completed metrics, and their paginated order history.
- **Focused Loading**: Customer profile details and order collections are queried through separate endpoints to avoid unbounded payload transfers.

## Reliability and Error Handling

The system implements multi-tiered validation and fault tolerance:
- **State Guarantees**: Frontend asynchronous operations strictly clear loading flags in `.finally()` handlers, eliminating perpetual `Loading...` lockups on failure.
- **Explicit State Modeling**: Every data-driven view cleanly distinguishes between **Loading**, **Success (With Data)**, **Empty Result** (e.g. valid query with 0 matches), and **Error** states.
- **Duplicate Mutation Protection**: Form submissions and in-place status editors disable their controls and display active in-flight indicators while requests are executing.
- **Error Masking & Rollbacks**: Database exceptions are logged server-side and masked as generic 500 errors to API consumers, while write operations execute automatic `db.rollback()` on transaction failure.
- **Outage Recovery**: If the database or backend becomes unreachable, views render an error card with an interactive **Retry** button, allowing operations users to recover as soon as service is restored without reloading the application.

## Scalability Considerations (5M+ Orders & Hundreds of Thousands of Customers)

The application architecture was designed from the beginning to support large data volumes without requiring full table loading in memory:

### 1. Server-Side Execution Model
- The frontend never loads the full order dataset. All filtering, sorting, and pagination parameters are passed to FastAPI and executed directly within PostgreSQL using SQL `WHERE`, `ORDER BY`, `LIMIT`, and `OFFSET`.
- Payload sizes delivered to the browser remain constant (~10 to 50 records, <5 KB) regardless of whether the table holds 40 rows or 5,000,000 rows.

### 2. Database Index Strategy
The database schema includes targeted B-tree indexes corresponding to primary operations query patterns:
- `orders(customer_id)`: Optimizes foreign key joins and customer-specific order history queries (`GET /customers/{id}/orders`).
- `orders(status)`: Optimizes dashboard status filtering (`GET /orders?status=completed`).
- `orders(created_at)`: Accelerates chronological sorting for newest/oldest views.
- `customers(email)`: Enforces customer uniqueness and accelerates email lookups.

**Composite Indexes**: For frequent multi-column queries (e.g. `WHERE status = 'completed' ORDER BY created_at DESC`), a composite index on `(status, created_at DESC)` would allow index-only scans. Composite indexes should be added based on monitored production query plans (`EXPLAIN ANALYZE`) to balance read acceleration against index write maintenance overhead.

### 3. Deep Pagination: Offset vs Keyset/Cursor Pagination
- **Current Approach**: Offset-based pagination (`OFFSET X LIMIT Y`) is simple, predictable, and suitable for typical operational browsing.
- **Scale Limitation**: At very deep offsets (e.g. page 50,000), PostgreSQL must scan and discard 500,000 rows before returning the requested 10 rows.
- **Future Scale Path**: For 5M+ orders with deep traversal requirements, the API would evolve to keyset/cursor-based pagination (`WHERE (created_at, id) < (cursor_created_at, cursor_id) ORDER BY created_at DESC, id DESC LIMIT 10`), providing constant $O(1)$ indexed access time.

### 4. Scaling Customer Management (Hundreds of Thousands of Customers)
- At 300,000+ customers, loading all customers into a static `<select>` tag in the Order Creation form is unviable.
- The customer selector would evolve into a debounced asynchronous search input (`GET /customers?search=john&limit=10`), querying matching accounts on demand.
- Customer summaries would continue utilizing paginated SQL aggregations with indexed foreign keys.

### 5. Infrastructure Evolution at Scale
- **Read Replicas**: If read queries create database contention, separate read replicas could serve dashboard and listing traffic, while write operations target the primary node.
- **Aggregation Caching (Redis)**: If the dashboard endpoint receives heavy request volumes, caching aggregate metrics with a short TTL or event-driven invalidation would reduce repetitive database scans.
- **Partitioning**: Order records could be partitioned by year or quarter (`PARTITION BY RANGE (created_at)`), improving query isolation and data lifecycle archiving for multi-year datasets.
- **Background Workers**: Heavy operations such as bulk data exports or monthly statement generations would be offloaded to asynchronous background job queues rather than blocking synchronous HTTP requests.

*Note: These advanced mechanisms are intentionally not implemented for this assignment because the current scope does not warrant the operational overhead.*

## Database & Data Model

The database runs in PostgreSQL via Docker Compose (`order-management-postgres`).

- **Customers (`customers`)**:
  - `id`: Integer primary key
  - `name`: Customer name (`varchar(255)`)
  - `email`: Customer email (`varchar(255)`, unique, indexed)
  - `created_at`: Timestamp with timezone
- **Orders (`orders`)**:
  - `id`: Integer primary key
  - `customer_id`: Foreign key referencing `customers.id` (ON DELETE CASCADE, indexed)
  - `amount`: Monetary value (`numeric(12, 2)`)
  - `status`: Order status (`varchar(20)`, indexed - `pending`, `completed`, `cancelled`)
  - `created_at`: Timestamp with timezone (indexed)

## API

### Orders
- `GET /orders`
- `POST /orders`
- `PATCH /orders/{order_id}/status`

### Customers
- `GET /customers`
- `GET /customers/{customer_id}`
- `GET /customers/{customer_id}/orders`

### Dashboard
- `GET /dashboard/summary`

## Setup & Running Locally

### 1. Start PostgreSQL
```powershell
docker compose up -d
```

### 2. Backend Setup & Migrations
```powershell
cd backend
.\.venv\Scripts\activate
alembic upgrade head
```

### 3. Seed Deterministic Data
```powershell
python app/seed.py
```
This populates 10 customers and 40 orders (18 completed, 14 pending, 8 cancelled).

### 4. Run the Backend API
```powershell
uvicorn app.main:app --reload
```
- API Health: http://127.0.0.1:8000/health
- Database Health: http://127.0.0.1:8000/health/database
- Interactive Docs (Swagger): http://127.0.0.1:8000/docs

### 5. Run the Frontend
```powershell
cd frontend
npm install
npm run dev
```
Accessible at http://localhost:5173

## Assumptions
- **Customer Email Uniqueness**: Customer emails are treated as unique identifiers for this operations domain. If business requirements permit shared emails, this constraint can be removed via migration.
- **Monetary Values**: `numeric(12, 2)` is strictly used for all order amounts to prevent floating-point precision issues.