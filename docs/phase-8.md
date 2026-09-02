# Phase 8: Order Creation & Status Management

## Goal
Implement order creation with validation and in-place order status updates, verifying that status changes dynamically propagate to customer summaries.

## What Was Done
- **Create Order (`CreateOrderPage.tsx` at `/orders/new`)**:
  - Customer dropdown populated dynamically from `customerService.getCustomers()`.
  - Amount input with instant validation enforcing positive values (`amount > 0`).
  - Status selector defaulting to `Pending`.
  - Submits `POST /orders` and navigates back to `/orders` on success.
- **In-Place Status Updates (`OrdersPage.tsx`)**:
  - Transformed the table's Status column into an interactive dropdown (`Pending`, `Completed`, `Cancelled`).
  - Displays in-flight loading indicator (`...`) while calling `PATCH /orders/{id}/status`.
  - Automatically reverts to previous status if the network request fails.
- **Orders Page Action**: Added `+ Create Order` button in the header.

## Key Decisions
- **Dedicated Route**: Used `/orders/new` instead of an overlay modal to keep the form deep-linkable and avoid complex modal focus/backdrop handling.
- **PATCH for Status**: `PATCH` expresses partial modification of a single field without replacing the entire entity.
- **Unconstrained Transitions**: Allowed all status transitions (pending <-> completed <-> cancelled) as the business requirements did not define specific state machine rules.

## Verification
- **Cross-Feature Propagation**:
  1. Created a `Pending` order for Customer 1 -> Customer summary metrics remained unchanged.
  2. Changed order to `Completed` -> Customer summary completed orders and value increased dynamically.
  3. Changed order to `Cancelled` -> Customer summary metrics decreased back to original values.
- Edge cases: Negative amount (422), zero amount (422), missing customer (404), missing order (404).
- `npm run build` passed with 0 errors.