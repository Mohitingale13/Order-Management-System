# Order Management Dashboard

A small order management dashboard for operations teams.

## Overview

An internal operations dashboard for viewing customers, tracking orders, filtering by order status, and calculating customer-level metrics.

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
        CustomersPage.tsx
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
  docker-compose.yml
  .gitignore
  README.md
  DECISIONS.md
```

## Frontend

The frontend is built with React, TypeScript, and React Router.

The application is organized into:
- `components/` - Reusable UI layout, badge, and pagination components
- `pages/` - Application view components (Dashboard, Orders, Customers)
- `services/` - Dedicated API communication modules using native `fetch`
- `types/` - TypeScript domain and API response contracts
- `utils/` - Currency and date formatters

### Frontend Configuration

The backend API URL is configured in `frontend/.env` using:
```env
VITE_API_BASE_URL=http://localhost:8000
```
An example template is provided in `frontend/.env.example`.

## Orders

The Orders screen supports:
- Customer search with 300ms debouncing
- Status filtering (`All`, `Pending`, `Completed`, `Cancelled`)
- Sorting by supported fields (`Newest`, `Oldest`, `Highest Amount`, `Lowest Amount`)
- Server-side pagination (`Showing X-Y of Z`, Previous/Next and direct page selection)
- Order status display using visual badges
- Formatted customer, amount (`INR`), and date information
- Resilient loading, empty, and error states with an interactive Retry button
- Automatic pagination reset to page 1 upon changing search, filter, or sort options

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

### Indexes
- `ix_customers_email` on `customers(email)` (unique)
- `ix_orders_customer_id` on `orders(customer_id)`
- `ix_orders_status` on `orders(status)`
- `ix_orders_created_at` on `orders(created_at)`

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

## Validation and Error Handling

The API validates request data at the API boundary using Pydantic and performs domain-level validation in the service layer.

Examples include:
- Positive order amounts (`amount > 0`)
- Valid order statuses (`pending`, `completed`, `cancelled`)
- Valid pagination values (`page >= 1`, `1 <= page_size <= 100`)
- Existing customer validation when creating orders (returns `404 Customer not found`)
- Resource existence checks (returns `404` for nonexistent customers or orders)
- Controlled error masking: database failures return a clean generic 500 response (`Unable to process the request at this time.`) without leaking database credentials or Python stack traces.

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

## Scalability Considerations (5M+ Orders)
- Targeted indexes on `orders(customer_id)`, `orders(status)`, and `orders(created_at)` optimize expected foreign key joins, status filtering, and chronological sorting.
- Server-side filtering, sorting, and pagination ensure the browser only fetches the active page slice regardless of total record volume.