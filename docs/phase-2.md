# Phase 2: Data Model, Migrations & Deterministic Seed

## Goal
Design the relational database schema for Customers and Orders, configure version-controlled migrations using Alembic, and populate deterministic test data.

## What Was Done
- **SQLAlchemy Models**:
  - `Customer` (`id`, `name`, `email` unique, `created_at`).
  - `Order` (`id`, `customer_id` foreign key, `amount`, `status`, `created_at`).
- **Alembic Migration**: Created migration `9d398409b956_create_customers_and_orders_tables.py` creating both tables, foreign key constraints (`ON DELETE CASCADE`), and B-tree indexes.
- **Deterministic Seeding (`app/seed.py`)**: Script generating exactly 10 customers and 40 orders (18 completed, 14 pending, 8 cancelled) with identical IDs, amounts, and dates on every run.

## Key Decisions
- **Monetary Precision**: Used `NUMERIC(12, 2)` instead of floating-point numbers to prevent binary rounding issues during financial calculations.
- **Order Status**: Used Python `OrderStatus` Enum (`pending`, `completed`, `cancelled`) mapped to a `VARCHAR(20)` column. This provides application-level type safety while allowing new business statuses in the future without locking PostgreSQL enum types.
- **Targeted Indexes**: Added B-tree indexes on `orders.customer_id`, `orders.status`, `orders.created_at`, and `customers.email` to support expected operational queries.
- **Deterministic Data**: Consistent seed values ensure repeatable testing of aggregations and filters across reviewer environments.

## Verification
- `alembic upgrade head` -> Successfully created `customers` and `orders` tables.
- `python -m app.seed` -> Seeded 10 customers and 40 orders.
- Verified database records directly via `psycopg2` query script.