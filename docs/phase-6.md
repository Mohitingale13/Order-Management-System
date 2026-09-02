# Phase 6: Orders Screen (Search, Filter, Sort, Pagination)

## Goal
Build the operations orders screen allowing users to view orders, search by customer, filter by status, sort by multiple presets, and paginate server-side.

## What Was Done
- **Orders Table (`OrdersPage.tsx`)**: Displays Order #, Customer (link to detail), Amount, Status badge, and Date.
- **Customer Search**: Input field with 300ms debounce to prevent firing network requests on every keystroke. Resets pagination to page 1.
- **Status Filter**: Dropdown supporting `All`, `Pending`, `Completed`, and `Cancelled`. Resets pagination to page 1.
- **Sorting**: Presets for `Newest First`, `Oldest First`, `Highest Amount`, and `Lowest Amount`. Resets pagination to page 1.
- **Server-Side Pagination (`Pagination.tsx`)**: Reusable pagination component showing item ranges (`Showing X-Y of Z`), previous/next navigation, and direct page buttons.
- **States & Formatting**: Non-blocking loading state, empty state with "Clear Filters", error card with "Retry", and INR currency formatting (`formatCurrency()`).

## Key Decisions
- **Server-Side Execution**: The database performs filtering, sorting, and pagination; the browser only receives the requested page slice (<5 KB).
- **Auto-Reset Pagination**: Any change to search text, filter status, or sort option resets to page 1 because the total result boundaries change.
- **Monochrome Theme**: Clean, high-contrast black-and-white theme with distinct status badges (`Pending`, `Completed`, `Cancelled`).

## Verification
- Search for "John" -> returns filtered orders with total count.
- Filter by "completed" -> only completed orders displayed.
- Sorting by "highest amount" -> orders reordered server-side.
- Error recovery: simulated offline API -> clicked "Retry" -> recovered on reconnection.
- `npm run build` compiled with 0 errors.