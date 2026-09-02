# Phase 8 - Order Creation & Status Management

This document logs the design, implementation, and verification of Phase 8: building the dedicated Order Creation form (`/orders/new`), adding in-place order status management (`PATCH /orders/{id}/status`), and verifying cross-feature propagation to the Customer Summary aggregations.

---

## 1. Feature Architecture

```text
                     React Frontend
                           |
           +---------------+---------------+
           |                               |
      Create Order                   Orders Table
      (/orders/new)                  (OrdersPage)
           |                               |
     Select Customer                 Change Status
     Positive Amount                       |
     Initial Status                        |
           |                               |
           v                               v
      POST /orders             PATCH /orders/{id}/status
           |                               |
           +---------------+---------------+
                           |
                           v
                    FastAPI Routers
                           |
                           v
                     OrderService
                           |
                           v
                    SQLAlchemy 2.0
                           |
                           v
                      PostgreSQL
                           |
                    Orders Mutation
                           |
                           v
             Dynamic Customer Aggregation
```

---

## 2. Step-by-Step Implementation

### Step 8A - Order Creation Backend API
- `POST /orders` accepts `customer_id` (positive integer), `amount` (numeric > 0), and `status` (`pending`, `completed`, `cancelled`).
- Verifies referenced customer existence, returning `404 Customer not found` if missing.
- Persists transaction with `try...except...db.rollback()` safety to prevent broken transaction sessions.
- Returns HTTP `201 Created` with created order object.

### Step 8B - Order Creation Frontend (`/orders/new`)
- Built `CreateOrderPage.tsx` registered at `/orders/new` in `App.tsx`.
- Form features:
  - **Customer Selection**: `<select>` dropdown populated dynamically via `customerService.getCustomers()`.
  - **Amount Input**: `<input type="number" step="0.01" min="0.01">` with instant validation preventing 0 or negative inputs.
  - **Status Selection**: Dropdown supporting `Pending`, `Completed`, or `Cancelled` (defaults to `Pending`).
  - **Validation & Submission**: Enforces customer selection and positive decimal values; displays clear error banners if the API rejects the input.
  - **Navigation**: Automatically redirects to `/orders` upon successful creation.

### Step 8C - Connection to Orders Screen
- Added primary `+ Create Order` button in the header of `OrdersPage.tsx`.
- Newly created orders immediately appear in the Orders table according to active sort and filter parameters.

### Step 8D - Status Update Backend API
- `PATCH /orders/{order_id}/status` partially updates an existing order.
- Validates order existence (returns `404 Order not found` if invalid).
- Enforces valid `OrderStatus` enum values and executes transaction with rollback on failure.

### Step 8E - In-Place Status Update UI
- In `OrdersPage.tsx`, transformed the Status column into an interactive dropdown.
- Provides visual loading feedback (`...` indicator and disabled state) while the patch request is in-flight.
- Automatically reverts the dropdown to its previous status if the network or server rejects the update.
- Renders an informative feedback banner confirming the updated status.

### Step 8F - Cross-Feature Integration Verification
Verified end-to-end propagation between Order mutations and Customer Summary metrics:
1. Checked Customer #1 metrics: `3 completed orders`, `₹2,700.00 completed value`.
2. Created a new `pending` order for Customer #1 (amount: `₹3,000.00`).
3. Verified Customer #1 summary metrics remained completely unchanged.
4. Changed order status from `pending` to `completed`.
5. Verified Customer #1 metrics automatically increased to `4 completed orders` and `₹5,700.00 completed value`.
6. Changed order status from `completed` to `cancelled`.
7. Verified Customer #1 metrics automatically decreased back to `3 completed orders` and `₹2,700.00 completed value`.

### Step 8G - Reliability & Edge Cases
- Negative Amount (`POST /orders` with `-50.00`) -> Rejected with HTTP 422.
- Zero Amount (`POST /orders` with `0.00`) -> Rejected with HTTP 422.
- Invalid Status (`POST /orders` with `"banana"`) -> Rejected with HTTP 422.
- Nonexistent Customer (`POST /orders` with `customer_id: 99999`) -> Returns HTTP 404.
- Nonexistent Order (`PATCH /orders/99999/status`) -> Returns HTTP 404.

---

## 3. Invigilator Checkpoint Q&A

**Q: Why validate on both frontend and backend?**  
A: Frontend validation provides instantaneous feedback to the user and avoids unnecessary network round-trips. Backend validation protects data integrity and database constraints because requests can easily bypass the frontend (e.g. via direct curl or Postman).

**Q: Why check customer existence when creating an order?**  
A: `orders.customer_id` is a foreign key relationship. Validating that the customer exists before attempting insertion provides clean, predictable `404 Customer not found` responses rather than raw foreign key violation errors.

**Q: Why use PATCH instead of PUT for updating status?**  
A: `PATCH` expresses partial modification of an existing entity (updating only the `status` field), whereas `PUT` represents replacing the complete entity representation.

**Q: Why allow unconstrained status transitions (e.g. Completed -> Cancelled)?**  
A: The assessment specifications define the three valid statuses but do not prescribe business state machine transition constraints. Keeping transitions unconstrained avoids artificial restrictions. If transition rules are introduced later, they should be centralized within the backend service layer.

**Q: What happens to Customer Summary when an order status changes?**  
A: Because Customer Summary metrics are computed dynamically using PostgreSQL aggregations (`COUNT` and `SUM` where `status = 'completed'`), any status transition automatically updates customer metrics on the next request without needing manual synchronization or denormalized counters.

---

## 4. Phase 8 Verification Checklist
- [x] POST /orders creates orders with customer, positive amount, and status
- [x] Dedicated /orders/new page with customer dropdown and amount validation
- [x] Header "+ Create Order" action on Orders page
- [x] PATCH /orders/{id}/status updates order status with validation
- [x] In-place status editor dropdown in Orders table with loading indicator
- [x] UI reverts to previous status if patch mutation fails
- [x] Cross-feature test passed: Customer summary reflects pending -> completed -> cancelled transitions
- [x] Edge cases verified: negative amounts (422), invalid status (422), missing customer (404), missing order (404)
- [x] Clean TypeScript build (npm run build passed with 0 errors)
- [x] README.md and DECISIONS.md updated
- [x] docs/phase-8.md created