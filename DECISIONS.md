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

## Customer Aggregation (Phase 7)
Completed order count and completed order value are calculated server-side using SQL aggregation (`COUNT` and `SUM` filtered by `status = 'completed'` with a `LEFT JOIN` and `COALESCE`) rather than computed in the frontend.

## Customer Detail Separation
Customer profile metrics and order collections are served through separate endpoints (`GET /customers/{id}` and `GET /customers/{id}/orders`) so loading customer details does not unnecessarily transfer complete order histories.

## Customers With No Completed Orders
Customers remain visible in the summary even when they have no completed orders. Their completed order count and value are represented as zero (`0` and `₹0.00`).

## Order Creation Route (Phase 8)
Order creation is provided through a dedicated route (`/orders/new`) rather than an overlay modal. This keeps the creation flow deep-linkable, simplifies error and loading state management, and avoids complex modal backdrop and focus trapping code.

## Status Update via PATCH
Order status changes use `PATCH /orders/{order_id}/status` because the mutation only updates a single field rather than replacing the complete order entity.

## Unrestricted Status Transitions
Order status transitions between `pending`, `completed`, and `cancelled` are unconstrained because the business specifications define no restrictive state transition rules. If transition constraints are introduced in the future, they should be centralized within the backend service layer.

## Status Update Reversal on Failure
When a status change request fails, the frontend reverts the dropdown to its previous value and displays an error message, preventing the UI from misrepresenting unpersisted database state.

## Dynamic Customer Metrics Propagation
Customer summary metrics are dynamically computed from the underlying orders in PostgreSQL. Updating an order's status immediately updates the customer's completed order count and value on subsequent requests without requiring manual client-side synchronization or denormalized counter updates.

## Dashboard Summary Endpoint (Phase 9)
Dashboard metrics (`total_orders`, `total_completed_order_value`, `total_customers`) are computed server-side in PostgreSQL and returned via a single summary endpoint (`GET /dashboard/summary`). This eliminates the need to execute multiple network round-trips and prevents transferring entire record sets to the client.

## Scope Discipline on Visual Analytics
Dedicated chart libraries, analytics widgets, or real-time polling were omitted to keep the implementation simple, reliable, and easily testable under network constraints. On-demand refresh provides operations users with real-time database state when needed.

## Reliability & State Modeling (Phase 10)
API-driven pages explicitly model loading, success, empty, and error states. Asynchronous operations guarantee loading indicators are cleared in `.finally()` handlers to prevent perpetual loading lockups on network or server failures. Mutation actions disable during active requests to prevent duplicate submissions, and backend database failures are rolled back with controlled 500 responses without exposing internal stack traces.