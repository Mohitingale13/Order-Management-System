# Order Management Dashboard

A full-stack order management dashboard built with React, TypeScript, FastAPI, PostgreSQL, and SQLAlchemy.

## Overview

The Order Management Dashboard is a full-stack application for viewing and managing customer orders.

The application provides:
- Dashboard-level order and customer metrics
- Searchable, filterable, sortable orders
- Server-side pagination
- Customer-level order summaries
- Customer detail view with order inspection
- Order creation with validation
- In-place order status updates
- Resilient loading, empty, and error recovery states

The backend exposes a REST API using FastAPI, with PostgreSQL used for persistent storage.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Build Tool | Vite |
| Backend | Python + FastAPI |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| API Protocol | REST |
| Containerization | Docker Compose |
| Version Control | Git |

## Features

- **Dashboard Metrics**: Real-time totals for orders, completed revenue, and customer accounts derived directly from PostgreSQL.
- **Orders Management**: Operations table supporting customer name search (300ms debounced), status filtering (`pending`, `completed`, `cancelled`), and sorting (`newest`, `oldest`, `highest amount`, `lowest amount`).
- **Server-Side Pagination**: Constant-size data slicing with previous/next and direct page jumping.
- **Customer Summaries**: Aggregated completed order counts and completed values per customer.
- **Customer Inspection**: Dedicated detail route (`/customers/:id`) displaying profile info, aggregate cards, and customer order history.
- **Order Creation**: Dedicated form (`/orders/new`) with customer dropdown, positive amount validation, and initial status selection.
- **Status Updates**: In-place status modification (`PATCH /orders/{id}/status`) directly in the Orders table with in-flight loading indicators and automatic UI reversion on error.
- **State Resilience**: Non-blocking loading guarantees via `.finally()`, explicit empty states, and interactive retry mechanisms for API and database outages.

## Project Structure

```text
order-management-system/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── app/
│   │   ├── models/
│   │   │   ├── customer.py
│   │   │   ├── order.py
│   │   │   └── base.py
│   │   ├── routers/
│   │   │   ├── customers.py
│   │   │   ├── dashboard.py
│   │   │   └── orders.py
│   │   ├── schemas/
│   │   │   ├── customer.py
│   │   │   ├── dashboard.py
│   │   │   └── order.py
│   │   ├── services/
│   │   │   ├── customer_service.py
│   │   │   ├── dashboard_service.py
│   │   │   └── order_service.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   └── seed.py
│   ├── .env.example
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── pages/
│   │   │   ├── CreateOrderPage.tsx
│   │   │   ├── CustomerDetailsPage.tsx
│   │   │   ├── CustomersPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── OrdersPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── customers.ts
│   │   │   ├── dashboard.ts
│   │   │   └── orders.ts
│   │   ├── types/
│   │   │   ├── customer.ts
│   │   │   ├── dashboard.ts
│   │   │   └── order.ts
│   │   ├── utils/
│   │   │   └── formatters.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   └── package.json
│
├── docs/
├── docker-compose.yml
├── DECISIONS.md
├── README.md
└── .gitignore
```

## Prerequisites

- **Git**
- **Python 3.10+**
- **Node.js 18+ and npm**
- **Docker Desktop** (for running PostgreSQL)

## Environment Variables

The project includes template environment files that can be copied into place.

### Backend (`backend/.env.example` -> `backend/.env`)
```env
DATABASE_URL=postgresql+psycopg2://app_user:app_password@localhost:5432/order_management
```

### Frontend (`frontend/.env.example` -> `frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Database Setup

1. Start PostgreSQL container via Docker Compose:
```powershell
docker compose up -d postgres
```

2. Run database migrations using Alembic:
```powershell
cd backend
.\.venv\Scripts\activate
alembic upgrade head
```

## Running Backend

```powershell
cd backend

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn app.main:app --reload
```

- Backend API: http://127.0.0.1:8000
- Interactive Swagger Documentation: http://127.0.0.1:8000/docs
- Health Endpoint: http://127.0.0.1:8000/health

## Running Frontend

```powershell
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

- Frontend Application: http://localhost:5173

## Seed Data

To populate the database with deterministic sample records:
```powershell
cd backend
python -m app.seed
```

The seed script loads:
- **10 Customers**: Including realistic commercial names and contact emails.
- **40 Orders**: Spanning `pending`, `completed`, and `cancelled` statuses with deterministic timestamps and amounts.

This seed data allows immediate testing of customer summaries, order status updates, sorting, and aggregate dashboard metrics.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/orders` | List, search, filter, sort, and paginate orders |
| `POST` | `/orders` | Create an order with validation |
| `PATCH` | `/orders/{order_id}/status` | Update status of an existing order |
| `GET` | `/customers` | Paginated customer summaries with aggregate metrics |
| `GET` | `/customers/{customer_id}` | Customer profile details and metrics |
| `GET` | `/customers/{customer_id}/orders` | Paginated order history for a specific customer |
| `GET` | `/dashboard/summary` | Aggregate dashboard summary metrics |
| `GET` | `/health` | API service liveness probe |
| `GET` | `/health/database` | Database connectivity probe |

## Assumptions

- **Customer Email Uniqueness**: Customer emails are assumed to be unique identifiers for client organizations in this operational context.
- **Monetary Precision**: Order amounts must be greater than zero and are stored using fixed-point `NUMERIC(12, 2)` to eliminate floating-point rounding errors.
- **Allowed Statuses**: Orders strictly belong to one of three statuses: `pending`, `completed`, or `cancelled`.
- **Completed Order Value**: Only orders with `completed` status contribute to completed order revenue. Pending and cancelled orders are excluded.
- **Status Transitions**: The business requirements do not impose state machine restrictions on status changes; any valid status can be transitioned to another.
- **Soft Deletion**: For this internal operations dashboard, order history is preserved for auditing; deletion endpoints were not specified.

## Scale Considerations

- **Server-Side Execution**: Orders use server-side filtering, sorting, and pagination so the browser never loads the complete order dataset into memory.
- **Database Indexes**: Indexed columns (`orders.customer_id`, `orders.status`, `orders.created_at`, `customers.email`) support primary query access patterns.
- **Deep Pagination**: For very large datasets (5M+ orders), cursor/keyset pagination can replace offset-based pagination to avoid linear row-skipping traversal costs.
- **High-Volume Evolution**: If traffic expands, composite indexes, read replicas, aggregate caching with Redis, table partitioning by date range, and background job queues represent the natural architectural path.