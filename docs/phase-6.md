# Phase 6 - Orders Screen Feature

This document records the design, implementation, and verification of Phase 6: creating the primary Orders screen supporting customer search, status filtering, multi-field sorting, server-side pagination, and resilient loading, empty, and error recovery states.

---

## 1. Feature Architecture

```text
                  Orders Page (UI)
                         |
             +-----------+-----------+
             |           |           |
          Search       Filter       Sort
             |           |           |
             +-----------+-----------+
                         |
                 Query State & Page
                         |
                         v
              orderService.getOrders()
                         |
                         v
                 GET /orders (params)
                         |
                         v
                  FastAPI Backend
                         |
                         v
              SQLAlchemy Query Builder
                         |
                         v
                     PostgreSQL
                         |
              filter -> sort -> paginate
                         |
                         v
              PaginatedOrders Response
                         |
                         v
               Orders Table Component
```

---

## 2. Step-by-Step Implementation

### Step 6A - Basic Orders Table
- Built tabular display in `OrdersPage.tsx` with columns:
  - **Order #**: Compact monospaced identifier.
  - **Customer**: Customer company name.
  - **Amount**: Formatted Indian Rupee currency (`₹2,500.00`) via `formatCurrency()` utility.
  - **Status**: Visual status badge (`Completed`, `Pending`, `Cancelled`).
  - **Date**: Human-readable timestamp formatted with `formatDate()`.
- Built reusable `StatusBadge.tsx` with a high-contrast monochrome design.

### Step 6B - Customer Search with Debouncing
- Added customer search text input with a `300ms` `setTimeout` debounce handler.
- Prevents triggering network queries for every individual keystroke.
- Resets pagination to page 1 on search input change.

### Step 6C - Status Filtering
- Added status dropdown filter (`All Statuses`, `Pending`, `Completed`, `Cancelled`).
- Omitted query parameter when "All" is selected to retrieve records across all statuses.
- Resets pagination to page 1 on filter change.

### Step 6D - Multi-Field Sorting
- Added user-friendly sort dropdown mapping friendly labels to backend query parameters:
  - **Newest First**: `sort_by=created_at`, `sort_order=desc`
  - **Oldest First**: `sort_by=created_at`, `sort_order=asc`
  - **Highest Amount**: `sort_by=amount`, `sort_order=desc`
  - **Lowest Amount**: `sort_by=amount`, `sort_order=asc`
- Resets pagination to page 1 on sort change.

### Step 6E - Server-Side Pagination
- Built reusable `Pagination.tsx` component.
- Displays current range: `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`.
- Provides accessible `Previous` and `Next` buttons with boundary disabling (`page <= 1` and `page >= total_pages`).
- Renders direct numeric page buttons with an active highlight.

### Step 6F - Loading, Empty, and Error States
- **Loading State**: Displays clean status text while queries are in-flight.
- **Empty State**: Displays an informative message (`No orders found`) with a one-click `Clear Search & Filters` button.
- **Error State**: Displays `Unable to load orders` alongside an interactive `Retry` button that re-triggers the query.

### Step 6G - Verification & Polish
- Verified all query parameter combinations against the live backend:
  - `GET /orders?page=1&page_size=10` (10 items, total 40, total pages 4)
  - `GET /orders?page=4&page_size=10` (10 items on page 4)
  - `GET /orders?search=Acme&status=completed&sort_by=amount&sort_order=desc` (filtered & sorted)
  - `GET /orders?search=doesnotexist` (0 items, HTTP 200 OK)
- Verified clean TypeScript build (`npm run build` completed with 0 errors).

---

## 3. Invigilator Checkpoint Q&A

**Q: Where does order filtering, sorting, and pagination happen?**  
A: Strictly on the backend in PostgreSQL via SQLAlchemy. The frontend only manages the UI query state and translates it into HTTP query parameters.

**Q: Why not download all orders and filter them in React?**  
A: For a system handling millions of orders, downloading the entire dataset into the browser would cause massive network latency and browser memory exhaustion. Server-side processing ensures the browser only ever handles the active page of records.

**Q: Why debounce the customer search?**  
A: Typing "Acme" without debouncing would fire 4 separate network requests (`A`, `Ac`, `Acm`, `Acme`). A 300ms debounce waits until the user pauses typing, reducing superfluous server and database load.

**Q: Why reset pagination to page 1 when changing filters or search?**  
A: Changing a filter or search text changes the total number of matching records. If a user was on page 4 of all orders and applies a search matching only 1 page, remaining on page 4 would display an empty result. Resetting to page 1 ensures valid boundaries.

**Q: Why does sorting happen on the database before pagination?**  
A: Sorting on the client would only sort the 10 records currently visible on that page. Sorting on PostgreSQL sorts the entire matching dataset before applying `LIMIT` and `OFFSET`, ensuring users see true top or bottom records.

---

## 4. Phase 6 Verification Checklist
- [x] Basic Orders table built with Order ID, Customer, Amount, Status, and Date
- [x] StatusBadge component styled with classic monochrome theme
- [x] Intl.NumberFormat and Intl.DateTimeFormat formatters implemented
- [x] Customer search debounced by 300ms
- [x] Status filter dropdown connected to API
- [x] Sorting dropdown supporting date and amount directions
- [x] Server-side Pagination component with page counts and direct navigation
- [x] Loading, empty, and error recovery states with interactive Retry button
- [x] Verified zero in-memory client filtering (100% server-side)
- [x] TypeScript build check passed (0 errors)
- [x] README.md and DECISIONS.md updated
- [x] docs/phase-6.md created