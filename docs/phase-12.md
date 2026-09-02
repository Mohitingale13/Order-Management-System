# Phase 12 - Documentation & Engineering Runbook

This document details Phase 12: auditing the codebase reality, structuring a reproducible and concise `README.md`, creating a focused 1-page `DECISIONS.md`, testing the developer runbook from scratch, and establishing clear engineering documentation for reviewers.

---

## 1. Documentation Architecture

```text
                        Repository Root
                               |
              +----------------+----------------+
              |                                 |
          README.md                        DECISIONS.md
       (How to run it)                   (Why we built it)
              |                                 |
        - Prerequisites                   - PostgreSQL
        - Setup runbook                   - SQLAlchemy
        - API overview                    - Offset pagination
        - Seed data                       - Server-side filtering
        - Assumptions                     - Customer aggregation
        - Scale considerations            - Status update feature
                                          - State modeling & reliability
```

---

## 2. Step-by-Step Implementation

### Step 12A - Repository Audit
- Audited repository files, directory paths, environment templates, and entry points.
- Created `backend/.env.example` to complement `frontend/.env.example`, ensuring all secret/configuration requirements are clearly documented through non-sensitive templates.
- Confirmed file naming conventions: `services/` for API clients, `routers/` for FastAPI endpoints, `schemas/` for Pydantic contracts, and `models/` for SQLAlchemy tables.

### Step 12B & 12C - Standardized README.md
Rewrote `README.md` strictly following the requested structure:
1. `# Order Management Dashboard`
2. `## Overview` - Concise summary of what the application does.
3. `## Tech Stack` - Clean tabular overview of technologies used.
4. `## Features` - Realized operational capabilities.
5. `## Project Structure` - Exact ASCII directory tree matching current filesystem reality.
6. `## Prerequisites` - Exact local tools required (Git, Python 3.10+, Node.js 18+, Docker Desktop).
7. `## Environment Variables` - Documentation of backend and frontend `.env` configuration.
8. `## Database Setup` - Runbook commands for Docker PostgreSQL and Alembic migrations.
9. `## Running Backend` - Step-by-step commands to activate the venv and start Uvicorn.
10. `## Running Frontend` - Step-by-step commands to install dependencies and launch Vite.
11. `## Seed Data` - Explanation of deterministic seed script and loaded record counts.
12. `## API Overview` - Concise table of all implemented endpoints.
13. `## Assumptions` - Domain assumptions (email uniqueness, decimal precision, status enums, etc.).
14. `## Scale Considerations` - Concise scale summary referencing Phase 11 findings.

### Step 12D - Concise 1-Page DECISIONS.md
Rewrote `DECISIONS.md` to be compact, focused, and free of filler:
- **PostgreSQL**: Relational fit, joins, ACID transactions, and aggregations.
- **SQLAlchemy**: Layered ORM access isolating database queries within `app/services/`.
- **Offset Pagination**: Practical balance of simplicity and functionality; keyset/cursor pagination as a future path.
- **Server-Side Filtering**: Offloading computation to PostgreSQL to maintain constant browser memory and payload size.
- **Customer Aggregation**: Dynamic SQL computation from order records, avoiding redundant denormalized counters.
- **Status Update**: Selection of `PATCH` over `PUT`, backend enum validation, and UI error reversion.
- **State Modeling & Reliability**: Explicit state transitions and unconditional `.finally()` loading resolution.

### Step 12E - Fresh-Machine Runbook Verification
Tested every command documented in `README.md`:
- Database container: `docker compose up -d postgres` -> Running.
- Database migrations: `alembic upgrade head` -> Applied with 0 errors.
- Deterministic seeding: `python -m app.seed` -> Successfully seeded 10 customers and 40 orders.
- Frontend build: `npm run build` -> Compiled 38 modules in 335ms with 0 errors.

---

## 3. Invigilator Checkpoint Q&A

**Q1: Why PostgreSQL?**  
A: The domain is relational: customers have many orders, and the application relies on foreign keys, joins, transactional consistency, and aggregate queries. PostgreSQL is well-suited to these operational patterns.

**Q2: Why SQLAlchemy?**  
A: It provides structured ORM-based database access and lets us model the customer-order relationship cleanly while keeping database operations encapsulated behind a dedicated service layer.

**Q3: Why did you choose offset pagination?**  
A: Offset pagination is simple to implement, predictable to test, and fully satisfies the assessment requirements, including direct page jumping. For very large datasets or deep traversal, keyset/cursor pagination is the documented next step.

**Q4: Why is filtering server-side?**  
A: The browser should never load the entire order dataset just to filter it. PostgreSQL executes the filtering and sorting directly, returning only the active page slice (<5 KB) to keep memory usage minimal.

**Q5: Why aren't completed order counts stored on Customer?**  
A: Completed metrics are derived values. Storing them directly on the customer record would introduce denormalized state that requires manual synchronization whenever an order's status changes. Computing them dynamically via SQL aggregations guarantees consistency.

**Q6: Why did you add status update as the additional feature?**  
A: The assessment asks for one meaningful additional feature. Order status management directly extends the operational workflow of managing orders without introducing unrelated complexity.

**Q7: Why is DECISIONS.md separate from README.md?**  
A: `README.md` is a runbook and operational guide for running and understanding the project. `DECISIONS.md` captures the engineering rationale and architectural trade-offs behind the choices made.

---

## 4. Phase 12 Verification Checklist
- [x] Repository audited against actual directories and entry points
- [x] backend/.env.example and frontend/.env.example verified
- [x] README.md structured with all 14 required sections
- [x] DECISIONS.md rewritten as a focused, 1-page document
- [x] Fresh-machine runbook commands tested and verified
- [x] Clean TypeScript build (npm run build passed with 0 errors)
- [x] docs/phase-12.md created