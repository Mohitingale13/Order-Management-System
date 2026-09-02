# Engineering Decisions

## Frontend
React with TypeScript was chosen because React and TypeScript are part of the required technology stack. TypeScript also provides type safety for frontend models and API responses.

## Backend
FastAPI was selected for the Python backend because it provides a lightweight REST API framework with built-in request validation and API documentation.

## Database
PostgreSQL was selected because the application has a relational data model consisting of customers and their orders.

## Database Environment
PostgreSQL is run through Docker to provide a reproducible local database environment without requiring PostgreSQL to be installed directly on the host machine.

## ORM
SQLAlchemy is used as the database access layer, utilizing modern DeclarativeBase mappings.

## Migrations
Alembic is used to version database schema changes, ensuring reproducible database structure across development and deployment environments without manual SQL scripts.

## Data Model (Phase 2)
The application uses a strict one-to-many relationship between customers and orders:
- One customer can have multiple orders.
- Each order references its customer through `orders.customer_id` via a foreign key constraint (`FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE`).
- Referential integrity is enforced directly at the database engine level, not solely in application code.

## Monetary Values
Order amounts use fixed-precision `NUMERIC(12, 2)` rather than floating-point values (`Float`) to prevent binary floating-point rounding errors common in currency arithmetic.

## Order Status Strategy
Order status is stored as a `VARCHAR(20)` in PostgreSQL and validated at the application layer using a Python Enum (`OrderStatus` with `pending`, `completed`, `cancelled`). This provides type safety while allowing new business statuses (e.g., `refunded`, `partially_fulfilled`) to be introduced in the future without requiring complex PostgreSQL enum type migrations.

## Primary Keys
Integer auto-incrementing primary keys are used for both `customers.id` and `orders.id`. Because this is an internal operations dashboard rather than a multi-tenant or externally exposed public API, integer IDs are compact, performant, and simple to navigate.

## Database Indexes
Targeted B-tree indexes were added to optimize queries anticipated by the dashboard specifications (and scalability for 5M+ records):
- `orders.customer_id`: Accelerates customer-order joins and filtering orders by customer.
- `orders.status`: Accelerates dashboard filtering by order status (`completed`, `pending`, `cancelled`).
- `orders.created_at`: Optimizes chronological sorting for recent order views.
- `customers.email`: Accelerates customer lookup and enforces uniqueness.

## Customer Email Uniqueness
Customer emails are treated as unique as a domain assumption for distinct customer identification. If business rules change to permit shared or duplicate emails, this constraint can be dropped via an Alembic migration without affecting customer data integrity.

## Deterministic Seeding
The database seed script generates 10 customers and 40 orders deterministically (same IDs, dates, statuses, and amounts on every run). This ensures consistent test scenarios and predictable customer-level metrics during review and testing.

## API Design (Phase 3)
The API is organized around core Customer and Order resources. Filtering, sorting, and pagination are implemented as query parameters on the `/orders` endpoint rather than fragmenting functionality across separate endpoints (`/orders/search`, `/orders/filter`).

## Server-side Pagination
Pagination is performed strictly at the API and database layer using SQL `LIMIT` and `OFFSET`. The API calculates and returns total items and total pages. The browser only receives the requested page slice, ensuring stability and performance as dataset sizes scale.

## Sortable Fields Whitelist
Sorting uses a strict whitelist of supported fields (`created_at`, `amount`, `status`) and sort directions (`asc`, `desc`). This prevents SQL injection vulnerabilities and ensures client queries only hit indexed columns.
