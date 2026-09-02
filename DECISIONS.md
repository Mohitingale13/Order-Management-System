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

## Validation (Phase 4)
Request-level validation is handled with Pydantic, while checks that require database state (such as customer existence during order creation) are handled in the service layer.

## Error Handling & Exception Masking
Known client errors return appropriate 4xx responses. Unexpected database or application errors are handled server-side without exposing internal exception details or stack traces to API clients, returning a controlled HTTP 500 response.

## Pagination Limits
The API requires page numbers to be at least 1 and limits page size to 100 to prevent accidentally large payloads or denial-of-service queries.

## Empty Results
A valid query that produces no records returns a successful HTTP 200 response with an empty result set (`total: 0`, `total_pages: 0`) rather than an error or 404 response.

## Frontend API Client (Phase 5)
API communication is separated into dedicated service modules (`services/orders.ts`, `services/customers.ts`, `services/dashboard.ts`) rather than executing `fetch()` calls directly inside UI components. This isolates presentation concerns from network protocol details and centralizes base URL and error parsing logic.

## HTTP Client
The native browser `fetch` API is used in `services/api.ts` rather than pulling in external dependencies like Axios. Because the API surface is small and standard, native `fetch` reduces bundle size and keeps dependencies minimal.

## State Management
Standard React component state (`useState`, `useEffect`) is used. The application currently has localized UI workflows, and server data is already abstracted through service modules. Global state management libraries (Redux, Zustand) would introduce unnecessary boilerplate without clear benefit.

## Client-Side Routing
React Router (`react-router-dom`) is used to provide instant navigation across `/dashboard`, `/orders`, and `/customers` without full-page browser reloads, wrapped in a unified layout and sidebar.

## Orders Filtering and Pagination (Phase 6)
Search, status filtering, sorting, and pagination are performed strictly server-side. The frontend sends query parameters to the backend and renders only the returned slice. This prevents transferring complete datasets (e.g. millions of orders) to the browser.

## Search Debouncing
Customer search is debounced by 300ms so network requests are only triggered after the user pauses typing, reducing superfluous API traffic.

## Pagination Reset
Changing search text, status filter, or sorting option immediately resets pagination to page 1 because the total record count and page boundaries change.

## Error Recovery
If the API fails to respond (such as during network or database outages), the Orders screen renders an error state with an interactive Retry button, allowing operations users to recover gracefully once service is restored without a hard browser refresh.