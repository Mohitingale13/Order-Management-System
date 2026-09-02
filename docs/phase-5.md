# Phase 5 - Frontend Foundation & API Client

This document logs the implementation and verification of Phase 5: creating the React + TypeScript frontend architecture, installing client-side routing, building the persistent application layout and sidebar, setting up a centralized API client with native fetch, defining TypeScript domain contracts, and validating end-to-end communication with the FastAPI backend.

---

## 1. Frontend Architecture

```text
                  Browser
                     |
                     v
           React + TypeScript (Vite)
                     |
                     v
           React Router (App.tsx)
                     |
         +-----------+-----------+
         |           |           |
         v           v           v
     Dashboard     Orders    Customers
       Page         Page       Page
         |           |           |
         +-----------+-----------+
                     |
                     v
          API Services (services/)
          (orders, customers, dashboard)
                     |
                     v
             api.ts (native fetch)
                     |
                     v
            FastAPI Backend (:8000)
                     |
                     v
             PostgreSQL (:5432)
```

### Directory Structure
```text
frontend/src/
  components/
    Layout.tsx       # Header, persistent shell, sidebar wrapper, and Outlet
    Sidebar.tsx      # Navigation links with active routing indicators
  pages/
    DashboardPage.tsx # Overview shell and live backend connectivity indicator
    OrdersPage.tsx    # Shell for Phase 6 orders table and filters
    CustomersPage.tsx # Shell for Phase 7 customer summary
  services/
    api.ts           # Centralized base URL, error parsing, and fetch wrapper
    orders.ts        # Order API calls (getOrders, createOrder, updateOrderStatus)
    customers.ts     # Customer API calls (getCustomers, getCustomer, getCustomerOrders)
    dashboard.ts     # Dashboard API calls (getSummary)
  types/
    order.ts         # TypeScript interfaces for orders, filters, and pagination
    customer.ts      # TypeScript interfaces for customer summaries
    dashboard.ts     # TypeScript interface for metrics summary
  App.tsx            # Route declarations and layout nesting
  main.tsx           # Application entry point
  index.css          # Classic black-and-white high-contrast theme
```

---

## 2. Step-by-Step Implementation

### Step 5A - Client-Side Routing Installation
- Installed `react-router-dom`:
```powershell
npm install react-router-dom
```
- Configured routes in `App.tsx`:
  - `/` redirects to `/dashboard`
  - `/dashboard` renders `DashboardPage`
  - `/orders` renders `OrdersPage`
  - `/customers` renders `CustomersPage`
  - Unknown paths redirect to `/dashboard`

### Step 5B - Application Layout & Navigation
- Built `Layout.tsx` providing a persistent top header with operational status and main body shell.
- Built `Sidebar.tsx` utilizing `NavLink` for instant visual feedback on the active page.
- Styled in `index.css` using a classic, high-contrast monochrome design (black, white, subtle grays) without external CSS frameworks or neon themes.

### Step 5C - Shell Pages
- Created placeholder page components for `Dashboard`, `Orders`, and `Customers`.
- Focused purely on establishing the application structure without premature feature implementation.

### Step 5D - API Service Layer
- Created `services/api.ts` using the browser's native `fetch` API.
- Implemented `ApiError` to cleanly parse FastAPI error payloads (`{"detail": "..."}`) and expose HTTP status codes.
- Created `services/orders.ts`, `services/customers.ts`, and `services/dashboard.ts` mapping 1-to-1 with backend endpoints.
- Configured environment variables via `frontend/.env` (`VITE_API_BASE_URL=http://localhost:8000`) and created a commit-safe `frontend/.env.example`.

### Step 5E - TypeScript Domain Contracts
- Defined strict interfaces for all entity payloads, query parameters, and paginated responses in `types/`.
- Ensured types mirror the Pydantic schemas established in Phase 3.

### Step 5F - End-to-End Connectivity Verification
- Wired `DashboardPage.tsx` to query `dashboardService.getSummary()` on mount.
- Verified live end-to-end data retrieval:
  - React initiates `fetch` to `http://localhost:8000/dashboard/summary`.
  - FastAPI handles the request and queries PostgreSQL.
  - React renders verified summary metrics (Total Orders: 40, Total Customers: 10, Completed Value: $32,811.95).
- Compiled clean production build with TypeScript check (`npm run build` -> `tsc -b && vite build`) with 0 errors.

---

## 3. Invigilator Checkpoint Q&A

**Q: Why use native fetch instead of Axios?**  
A: The application's network requirements are small and focused. The browser's native `fetch` API handles JSON requests cleanly without adding an external dependency to the bundle.

**Q: Why aren't fetch calls placed directly inside page components?**  
A: Separating API logic into `services/` decouples HTTP communication, URL configuration, and error parsing from UI rendering and component state.

**Q: Why no Redux or global state management library?**  
A: Server data is already cached and fetched via targeted service functions, and UI state is local to each page. Adding Redux would introduce substantial boilerplate with no architectural benefit for this application scope.

**Q: Why define TypeScript types if FastAPI already validates data with Pydantic?**  
A: Pydantic validates data at runtime on the server. TypeScript provides compile-time safety and IDE autocompletion in the browser, ensuring frontend components consume the API contract correctly.

**Q: How would you add authentication in the future?**  
A: I would update `services/api.ts` to attach an `Authorization: Bearer <token>` header to outgoing requests and introduce an auth wrapper in React Router without touching individual page components.

---

## 4. Phase 5 Verification Checklist
- [x] react-router-dom installed and routes configured
- [x] Layout and Sidebar navigation built with active link styling
- [x] Classic black-and-white operations dashboard theme in index.css
- [x] Shell pages created for Dashboard, Orders, and Customers
- [x] Centralized API client using native fetch in services/api.ts
- [x] Dedicated service modules for orders, customers, and dashboard
- [x] TypeScript domain contracts defined matching backend schemas
- [x] Live end-to-end connectivity verified (React -> FastAPI -> PostgreSQL)
- [x] Clean TypeScript build verification (npm run build passed with 0 errors)
- [x] README.md and DECISIONS.md updated
- [x] docs/phase-5.md created