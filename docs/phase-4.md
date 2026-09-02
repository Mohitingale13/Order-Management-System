# Phase 4: API Validation & Error Handling

## Goal
Harden the API boundary against invalid inputs, enforce resource existence checks, and safely mask database failures without leaking sensitive credentials or stack traces.

## What Was Done
- **Pydantic Validation**:
  - Enforced `amount > 0` with 2 decimal places using `Field(gt=0, decimal_places=2)`.
  - Restricted status values strictly to `OrderStatus` enum (`pending`, `completed`, `cancelled`).
  - Bounded pagination: `page >= 1`, `1 <= page_size <= 100`.
- **Resource Existence**: Standardized 404 responses for nonexistent customers and orders (`{"detail": "Customer not found"}`).
- **Empty Result Semantics**: Valid queries with 0 matches return HTTP 200 with `items: []` and `total: 0`, not an error or 404.
- **Global Error Masking (`app/main.py`)**:
  - `SQLAlchemyError` and runtime `Exception` handlers catch database or unexpected failures, log them server-side, and return a clean generic 500 response (`{"detail": "Unable to process the request at this time."}`).

## Key Decisions
- **Boundary vs Service Validation**: Pydantic validates input types and bounds at the entry point; the service layer checks relational state (such as customer existence).
- **Security & Error Masking**: Never return raw database errors, connection strings, or Python tracebacks to the client.

## Verification
- Negative amount (`amount = -100`) -> HTTP 422 Unprocessable Entity.
- Invalid status (`status = banana`) -> HTTP 422.
- Nonexistent resource (`GET /customers/99999`) -> HTTP 404.
- Live database outage: stopped PostgreSQL container (`docker compose stop postgres`) -> API returned controlled 500 without crashing -> restarted container -> recovered 200 OK.