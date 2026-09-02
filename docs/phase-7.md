# Phase 7: Customer Summary & Detail View

## Goal
Build the customer summary view with server-side aggregations, a dedicated customer detail route (`/customers/:id`), and order history inspection.

## What Was Done
- **Customer Summary (`CustomersPage.tsx`)**: Table displaying Customer name, Email, Completed Orders count, and Completed Value, with server-side pagination.
- **Customer Details (`CustomerDetailsPage.tsx` at `/customers/:customerId`)**: Dedicated view displaying customer profile cards and their paginated order history with status badges and formatters.
- **Database Aggregation**: `get_customers` and `get_customer_by_id` calculate completed metrics directly in PostgreSQL using `COUNT(CASE WHEN status = 'completed' THEN id END)` and `COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0)`.

## Key Decisions
- **LEFT JOIN on Orders**: Using `LEFT JOIN` ensures customers with zero completed orders (such as *Solstice Systems*) remain visible in the summary with `0` completed orders and `₹0.00` value.
- **COUNT(id) vs COUNT(*)**: `COUNT(id)` returns `0` when joined order fields are NULL, whereas `COUNT(*)` would mistakenly count the customer row itself and return `1`.
- **Separate Endpoints**: Kept profile (`GET /customers/{id}`) and orders (`GET /customers/{id}/orders`) separate to avoid transferring large order lists when only basic customer info is needed.

## Verification
- Customer #1 (Acme Corporation): Displays 2 completed orders and ₹1,700.50 completed value.
- Customer #10 (Solstice Systems): Displays 0 completed orders and ₹0.00 completed value.
- Nonexistent customer (`/customers/99999`): Handled cleanly with 404 error notice.
- `npm run build` passed with 0 errors.