# Phase 2 - Database Models, Migrations & Seed Data

This document logs the step-by-step implementation of Phase 2: creating the relational database models with SQLAlchemy, managing schema versions with Alembic, generating and applying migrations to PostgreSQL, and writing a deterministic seeding script.

---

## 1. Objectives
- Design clean, maintainable SQLAlchemy models for Customer and Order.
- Enforce referential integrity in PostgreSQL via a foreign key constraint (orders.customer_id -> customers.id).
- Store monetary values using NUMERIC(12, 2) to eliminate floating-point precision hazards.
- Initialize and configure Alembic for automated, version-controlled database migrations.
- Verify migration execution and schema definition directly inside PostgreSQL.
- Build a repeatable, deterministic seed script creating 10 customers and 40 orders.

---

## 2. Implementation Steps

### Step 2A - SQLAlchemy Models
Created a modular model package under backend/app/models/:
- **backend/app/models/base.py**:
  Defines the standard SQLAlchemy 2.0 DeclarativeBase (Base).
- **backend/app/models/customer.py**:
  Defines Customer with id (Integer PK), name (String), email (String, unique, indexed), and created_at (DateTime with timezone).
  Establishes a 1-to-many relationship to Order with cascade="all, delete-orphan".
- **backend/app/models/order.py**:
  Defines Order with:
  - id (Integer PK)
  - customer_id (ForeignKey to customers.id with ondelete="CASCADE", indexed)
  - amount (Numeric(12, 2))
  - status (String length 20, indexed, validated with OrderStatus enum: pending, completed, cancelled)
  - created_at (DateTime with timezone, indexed)
  - customer relationship back to Customer
- **backend/app/models/__init__.py**:
  Exports Base, Customer, Order, and OrderStatus.

### Step 2B - Alembic Migration
1. Initialized Alembic inside backend/:
```powershell
alembic init alembic
```
2. Configured backend/alembic/env.py:
   - Pulled DATABASE_URL dynamically from app.config.settings (preventing credential leakage in alembic.ini).
   - Attached target_metadata = Base.metadata.
3. Generated the initial migration:
```powershell
alembic revision --autogenerate -m "create customers and orders tables"
```
4. Inspected the generated migration (9d398409b956_create_customers_and_orders_tables.py) and verified all constraints, foreign keys, and indexes.
5. Applied migration to PostgreSQL:
```powershell
alembic upgrade head
```
6. Directly inspected PostgreSQL via Docker:
   - Verified tables: customers, orders, alembic_version.
   - Verified foreign key orders_customer_id_fkey on delete cascade.
   - Verified indexes: ix_customers_email, ix_orders_customer_id, ix_orders_status, ix_orders_created_at.

### Step 2C - Deterministic Seed Data
Created backend/app/seed.py to populate realistic demonstration data:
- **10 Customers**: Realistic company names and emails.
- **40 Orders**:
  - 18 Completed
  - 14 Pending
  - 8 Cancelled
- **Deterministic**: Hardcoded timestamps and amounts so tests and demonstrations yield identical results every single run.
- **Idempotent**: Drops/cleans existing table records before inserting.
- Executed the script:
```powershell
python app/seed.py
```
- Verified counts and customer aggregate metrics directly via SQL in PostgreSQL.

### Step 2D - Documentation & Decisions
- Updated README.md with schema definitions, setup steps, migration commands, and seed instructions.
- Updated DECISIONS.md with rationale for monetary precision, enum strategy, indexing choices, and domain assumptions.

---

## 3. Invigilator Checkpoint Q&A

**Q: Why use NUMERIC(12, 2) instead of Float for order amounts?**  
A: Float uses binary floating-point representation, which introduces rounding inaccuracies in financial calculations. Fixed-precision NUMERIC guarantees exact decimal math.

**Q: Why store status as a String with application-level Enum validation?**  
A: It provides type safety in code while allowing future statuses (such as refunded) to be introduced without requiring complex PostgreSQL enum type migrations.

**Q: Why these specific indexes on orders?**  
A: They directly correspond to dashboard operations: filtering orders by customer (customer_id), filtering by status (status), and chronological sorting (created_at).

**Q: Why enforce a database Foreign Key instead of handling it only in Python?**  
A: Database-level foreign keys guarantee referential integrity even if records are touched outside the application or during concurrent transactions.

---

## 4. Phase 2 Verification Checklist
- [x] SQLAlchemy models created with proper relationships
- [x] Alembic initialized and connected to models
- [x] Migration generated, reviewed, and applied
- [x] PostgreSQL schema and indexes verified via psql
- [x] Seed script created and executed (10 customers, 40 orders)
- [x] SQL aggregation query verified in PostgreSQL
- [x] README.md and DECISIONS.md updated
- [x] docs/phase-2.md created