# Order Management Dashboard

A simple full-stack order management dashboard built with React, TypeScript, FastAPI, and PostgreSQL.

## Overview

This application lets operations teams view, search, and manage customer orders and view high-level revenue metrics.

Key capabilities:
- Real-time dashboard showing total orders, completed order revenue, and customer count
- Search orders by customer name, filter by status, and sort by date or amount
- Server-side pagination for orders and customer summaries
- Customer detail page showing customer profile and their order history
- Create new orders with validation (customer, amount > 0, status)
- Update an order's status directly from the orders table
- Handles loading states, empty searches, and network/backend errors gracefully

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router
- **Backend**: Python 3.10+, FastAPI, Uvicorn
- **Database**: PostgreSQL 16 (via Docker Compose)
- **ORM & Migrations**: SQLAlchemy 2.0, Alembic
- **Styling**: Vanilla CSS (custom monochrome theme, no CSS libraries)

## Features

- **Dashboard**: High-level operational metrics (Total Orders, Total Revenue from completed orders, Total Customers) and a table of the 5 newest orders.
- **Orders Management**: Paginated table with 300ms debounced search, status dropdown filter (`pending`, `completed`, `cancelled`), and sorting presets.
- **Status Updates**: Change order status directly in the table (`PATCH /orders/{id}/status`) with an in-flight indicator and automatic rollback if the API fails.
- **Customer Directory**: Summary table showing completed orders and revenue per customer, with links to detailed order history.
- **Create Order**: Dedicated `/orders/new` page with customer selection, positive amount validation, and status selection.

## Project Structure

```text
Order Management system/
|-- backend/
|   |-- alembic/
|   |   |-- versions/
|   |   |-- env.py
|   |-- app/
|   |   |-- models/          # SQLAlchemy database models
|   |   |-- routers/         # FastAPI route handlers
|   |   |-- schemas/         # Pydantic validation schemas
|   |   |-- services/        # Business logic and database queries
|   |   |-- config.py
|   |   |-- database.py
|   |   |-- main.py
|   |   `-- seed.py          # Deterministic sample data script
|   |-- .env.example
|   |-- alembic.ini
|   `-- requirements.txt
|
|-- frontend/
|   |-- src/
|   |   |-- components/      # Reusable UI elements (Layout, Pagination, Badges)
|   |   |-- pages/           # Route views (Dashboard, Orders, Customers, etc.)
|   |   |-- services/        # Typed API clients using native fetch
|   |   |-- types/           # TypeScript interfaces matching backend schemas
|   |   |-- utils/           # Currency and date formatters
|   |   |-- App.tsx
|   |   `-- index.css
|   |-- .env.example
|   `-- package.json
|
|-- docs/                    # Phase summaries and review notes
|-- docker-compose.yml       # Local PostgreSQL 16 service
|-- DECISIONS.md             # Engineering trade-offs and rationale
|-- README.md
`-- .gitignore
```

## Prerequisites

- **Git**
- **Python 3.10+**
- **Node.js 18+ and npm**
- **Docker Desktop** (for running PostgreSQL)

## Environment Setup

Both backend and frontend include template `.env.example` files.

### 1. Backend `.env`
Create `backend/.env` (or copy from `backend/.env.example`):
```env
DATABASE_URL=postgresql+psycopg2://app_user:app_password@localhost:5432/order_management
```

### 2. Frontend `.env`
Create `frontend/.env` (or copy from `frontend/.env.example`):
```env
VITE_API_BASE_URL=http://localhost:8000
```

## Quickstart

### Step 1: Start PostgreSQL
```powershell
docker compose up -d postgres
```

### Step 2: Run Migrations & Seed Data
```powershell
cd backend

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed deterministic test data (10 customers, 40 orders)
python -m app.seed
```

### Step 3: Start the Backend Server
```powershell
# From the backend/ directory with .venv active:
uvicorn app.main:app --reload
```
- API runs at: http://127.0.0.1:8000
- Swagger docs at: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

### Step 4: Start the Frontend
Open a new terminal:
```powershell
cd frontend
npm install
npm run dev
```
- App runs at: http://localhost:5173 (or http://localhost:5175 if 5173 is occupied)

## Sample Seed Data

Running `python -m app.seed` creates:
- **10 Customers**: Standard accounts with unique email addresses.
- **40 Orders**: Across `pending` (14), `completed` (18), and `cancelled` (8) statuses with fixed dates and amounts.

This gives immediate data to test filtering, sorting, pagination, and metric calculations.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/orders` | List orders with search, status filter, sorting, and pagination |
| `POST` | `/orders` | Create a new order (validates customer, amount, status) |
| `PATCH` | `/orders/{id}/status` | Update an order's status |
| `GET` | `/customers` | List customers with completed order counts and revenue |
| `GET` | `/customers/{id}` | Get customer profile details and completed metrics |
| `GET` | `/customers/{id}/orders` | Paginated order history for a single customer |
| `GET` | `/dashboard/summary` | Aggregate metrics (total orders, completed revenue, customer count) |
| `GET` | `/health` | API health check |
| `GET` | `/health/database` | Database connection check |

## Assumptions

- **Customer Email**: Customer emails are unique identifiers across the system.
- **Amount Precision**: Order amounts must be greater than zero and are stored as `NUMERIC(12, 2)` to avoid floating-point math issues.
- **Status Values**: Orders are limited to three statuses: `pending`, `completed`, and `cancelled`.
- **Completed Revenue**: Only orders with status `completed` count toward total completed order value. Pending and cancelled orders are excluded.
- **Status Transitions**: The requirements did not specify state machine rules, so any status can be changed to any other valid status.
- **Soft Deletion**: For audit purposes, orders are not deleted in this operations dashboard.

## Scale Considerations

The Orders API uses server-side filtering, sorting, and pagination so the frontend does not need to load the complete order dataset. Payload sizes stay under 5 KB regardless of table size.

If scaling to 5M+ orders:
- **Cursor-based Pagination**: Offset pagination (`LIMIT/OFFSET`) scans discarded rows at high page numbers. Keyset/cursor pagination (`WHERE id < cursor`) would provide constant-time lookups for deep pages.
- **Composite Indexes**: An index on `(status, created_at DESC)` would speed up queries filtering by status and ordering by date simultaneously.
- **Customer Selection**: The dropdown on `/orders/new` would be replaced with a debounced server-side typeahead/autocomplete to handle 100k+ customer accounts.
- **Caching**: Dashboard metrics could be cached in Redis with a 30-second TTL to avoid running `COUNT` and `SUM` queries across millions of rows on every refresh.