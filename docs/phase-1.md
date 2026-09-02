# Phase 1 - Project Setup and Environment Baseline

This document records the exact steps taken to set up the development environment, initialize the frontend and backend applications, configure PostgreSQL through Docker, and verify baseline connectivity across all components.

---

## Objectives
- Initialize a clean, maintainable monorepo structure.
- Scaffold a React + TypeScript frontend using Vite.
- Set up a Python FastAPI backend with an isolated virtual environment.
- Run PostgreSQL 16 via Docker Compose to keep the host environment clean.
- Configure environment variables and verify the backend can query the database.
- Document engineering decisions and maintain a disciplined Git workflow.

---

## Step-by-Step Implementation

### 1. Repository Setup & Version Control
- Confirmed the root project folder is initialized with Git on the main branch.
- Configured the remote origin pointing to the repository (https://github.com/Mohitingale13/Order-Management-System.git).
- Structured the workspace without unnecessary nesting to keep path management simple.

### 2. Monorepo Project Structure
Established the top-level directory structure:

```text
order-management-system/
  backend/
    app/
      config.py
      database.py
      main.py
    .env
    requirements.txt
  frontend/
    src/
    package.json
  docs/
    phase-1.md
  docker-compose.yml
  .gitignore
  README.md
  DECISIONS.md
```

### 3. Frontend Scaffolding (React + TypeScript)
- Scaffolded the frontend using Vite:
```powershell
npm create vite@latest frontend -- --template react-ts
```
- Installed all required npm dependencies:
```powershell
npm install
```
- Verified local dev server execution on http://localhost:5173/ (HTTP 200 OK).
- Applied a minimal, classic black-and-white theme in index.css to keep the UI clean, readable, and professional.

### 4. Backend Virtual Environment & Dependencies
- Navigated to backend/ and created a dedicated Python virtual environment:
```powershell
python -m venv .venv
```
- Installed the core dependencies required for the REST API and database layer:
  - fastapi and uvicorn (ASGI web server and framework)
  - sqlalchemy (ORM and connection management)
  - psycopg2-binary (PostgreSQL driver)
  - alembic (database schema migrations)
  - pydantic-settings (type-safe environment configuration)
- Pinned all installed dependencies to backend/requirements.txt using pip freeze.

### 5. FastAPI Application Initialization
- Created backend/app/main.py with an initial FastAPI application instance.
- Added a basic /health endpoint returning {"status": "ok"}.
- Verified that:
  - GET http://127.0.0.1:8000/health returns status ok.
  - GET http://127.0.0.1:8000/docs renders Swagger UI documentation.

### 6. Containerized PostgreSQL via Docker Compose
- Created docker-compose.yml in the project root defining a PostgreSQL 16 service:
  - Database name: order_management
  - User: app_user
  - Port mapping: 5432:5432
  - Persistent volume: postgres_data
- Started the container in detached mode:
```powershell
docker compose up -d
```
- Verified container health with docker compose ps (container order-management-postgres is Up).

### 7. Environment Configuration
- Created backend/.env with database connection string:
```env
DATABASE_URL=postgresql+psycopg2://app_user:app_password@localhost:5432/order_management
```
- Kept credentials externalized from source code to ensure security best practices.

### 8. Git Ignore Configuration
- Created root .gitignore ensuring that neither local virtual environments (backend/.venv/), secrets (.env, backend/.env), node modules (frontend/node_modules/), nor build artifacts (dist/) can be accidentally committed to source control.

### 9. Database Connection Layer
- Created backend/app/config.py using pydantic-settings to safely read DATABASE_URL from the .env file.
- Created backend/app/database.py initializing SQLAlchemy engine and SessionLocal.

### 10. Database Health Check Verification
- Added a /health/database endpoint to backend/app/main.py that executes a SELECT 1 query against PostgreSQL using SQLAlchemy's connection pool.
- Started the backend and tested the endpoint:
```text
GET http://127.0.0.1:8000/health/database -> {"database": "ok"} (HTTP 200 OK)
```
- Confirmed that FastAPI successfully communicates with the containerized PostgreSQL instance.

### 11 & 12. Documentation
- Created README.md with project tech stack, structure, and placeholders for progressive completion.
- Created DECISIONS.md documenting the architecture choices made in Phase 1 (why Docker was used for PostgreSQL, why FastAPI and React/TS were chosen, and why SQLAlchemy and Alembic were selected).

---

## Phase 1 Verification Checklist
- [x] React TypeScript frontend runs and builds cleanly
- [x] Python virtual environment active and isolated
- [x] FastAPI server starts and responds to /health and /docs
- [x] Docker Compose starts PostgreSQL 16 container
- [x] FastAPI successfully connects to PostgreSQL (/health/database returns ok)
- [x] Root .gitignore correctly ignores .venv, .env, and node_modules
- [x] README.md, DECISIONS.md, and docs/phase-1.md created