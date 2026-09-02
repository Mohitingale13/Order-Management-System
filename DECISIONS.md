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

SQLAlchemy is used as the database access layer.

## Migrations

Alembic will be used to version database schema changes.
