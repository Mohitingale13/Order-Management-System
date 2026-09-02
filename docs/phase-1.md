# Phase 1: Project Setup & Environment Baseline

## Goal
Scaffold the monorepo, configure PostgreSQL 16 via Docker, set up FastAPI and Vite React + TypeScript, and verify end-to-end database connectivity.

## What Was Done
- **Repository Structure**: Organized into `backend/`, `frontend/`, `docs/`, and root `docker-compose.yml`.
- **Database**: PostgreSQL 16 container configured via Docker Compose (`order-management-postgres`) on port 5432.
- **Backend**: FastAPI app with Uvicorn, Python 3.10 virtual environment, and SQLAlchemy connection pool in `app/database.py`.
- **Frontend**: Scaffolded using Vite with React and TypeScript.
- **Config & Health**: Externalized database credentials via `pydantic-settings` (`.env`), added `/health` and `/health/database` probes.

## Key Decisions
- **Docker for PostgreSQL**: Keeps the local machine clean and ensures reviewers can start the database with a single command without local PostgreSQL installation.
- **SQLAlchemy 2.0**: Modern declarative ORM mappings for type-safe relational database access.
- **FastAPI**: Lightweight REST framework with automatic OpenAPI documentation (`/docs`) and built-in Pydantic validation.

## Verification
- `docker compose up -d postgres` -> Container healthy.
- `GET http://127.0.0.1:8000/health` -> `{"status": "ok"}`
- `GET http://127.0.0.1:8000/health/database` -> `{"database": "ok"}` (executes `SELECT 1`)
- Frontend dev server running on Vite.