# Phase 5: Frontend Foundation & API Client

## Goal
Establish a clean, predictable React + TypeScript frontend structure, navigation shell, and centralized API communication layer.

## What Was Done
- **Routing & Layout**: Installed `react-router-dom` and built an app shell with `Layout.tsx`, `Sidebar.tsx`, and routes for `/dashboard`, `/orders`, and `/customers`.
- **Centralized API Client (`services/api.ts`)**: Built a lightweight wrapper around native browser `fetch` handling base URL resolution, headers, and HTTP error parsing.
- **Service Modules**: Created typed modules for `orders.ts`, `customers.ts`, and `dashboard.ts`.
- **Domain Types**: Defined TypeScript interfaces in `types/order.ts`, `types/customer.ts`, and `types/dashboard.ts` matching backend Pydantic schemas.
- **Environment**: Configured `frontend/.env` with `VITE_API_BASE_URL=http://localhost:8000` (and `frontend/.env.example`).

## Key Decisions
- **Native Fetch**: Used the browser's native `fetch` API instead of adding Axios to keep the bundle minimal and dependencies low.
- **Service Layer Separation**: Components never make raw `fetch()` calls directly; all communication goes through typed service modules.
- **Component State**: Used standard React `useState` and `useEffect`. Global state libraries (Redux, Zustand) were avoided as server data is already abstracted through service modules.

## Verification
- Verified end-to-end data pipeline: React -> API client -> FastAPI -> PostgreSQL.
- Dashboard successfully loaded and displayed live database connection verification.
- `npm run build` passed with 0 errors.