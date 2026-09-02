# Order Management Dashboard

A small order management dashboard for operations teams.

## Overview

An internal operations dashboard for viewing customers, tracking orders, filtering by order status, and calculating customer-level metrics.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: FastAPI, Python 3.10, Uvicorn
- **Database**: PostgreSQL 16 (Docker Compose)
- **ORM & Migrations**: SQLAlchemy 2.0, Alembic
- **Validation & Config**: Pydantic v2, Pydantic-Settings

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
  - `status`: Order status (`varchar(20)`, indexed — `pending`, `completed`, `cancelled`)
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
npm run dev
```
Accessible at http://localhost:5173

## Assumptions
- **Customer Email Uniqueness**: Customer emails are treated as unique identifiers for this operations domain. If business requirements permit shared emails, this constraint can be removed via migration.
- **Monetary Values**: `numeric(12, 2)` is strictly used for all order amounts to prevent floating-point precision issues.

## Scalability Considerations (5M+ Orders)
- Targeted indexes on `orders(customer_id)`, `orders(status)`, and `orders(created_at)` optimize expected foreign key joins, status filtering, and chronological sorting.
- Fixed-precision numeric types prevent calculation rounding drift across large aggregations.
