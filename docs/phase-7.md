# Phase 7 - Customer Summary & Detail Feature

This document logs the design, implementation, and verification of Phase 7: creating the Customers summary screen with server-side database aggregations, the dedicated Customer Details route (`/customers/:customerId`), order history inspection, and resilient state handling.

---

## 1. Feature Architecture

```text
                     Customers Page
                           |
                           v
                    GET /customers
                           |
                           v
                        FastAPI
                           |
                           v
                       PostgreSQL
                           |
                 +---------+---------+
                 |                   |
            Customer data       Completed aggregates
                 |                   |
                 +---------+---------+
                           |
                           v
                    Customers Table
                           |
                    click customer
                           |
                           v
                /customers/:customerId
                           |
                +----------+----------+
                v                     v
       GET /customers/:id      GET /customers/:id/orders
                |                     |
                v                     v
         Customer details       Customer order list
```

---

## 2. Step-by-Step Implementation

### Step 7A - Backend Aggregation Verification
- Verified `GET /customers` executes SQL aggregations:
  - `COUNT(CASE WHEN order.status = 'completed' THEN order.id ELSE NULL END)`
  - `COALESCE(SUM(CASE WHEN order.status = 'completed' THEN order.amount ELSE 0 END), 0)`
  - Combined with a `LEFT JOIN` on `orders` so customers with zero completed orders (e.g., Customer #10) remain present with `completed_orders: 0` and `completed_order_value: 0`.
- Verified `GET /customers/{id}` returns customer profile information along with their completed metrics without dumping raw order collections.
- Verified `GET /customers/{id}/orders` returns paginated order records for that specific customer.

### Step 7B - Customers Summary Table
- Built `CustomersPage.tsx` displaying:
  - **Customer Name**: Clickable navigation link (`customer.name ->`) leading to the customer detail view.
  - **Email**: Customer contact email.
  - **Completed Orders**: Total completed orders count.
  - **Completed Value**: Total completed monetary value formatted in Indian Rupees (`formatCurrency()`).
- Integrated server-side pagination with the reusable `Pagination` component.
- Implemented loading and error states with an interactive `Retry` button.

### Step 7C - Customer Details Route (`/customers/:customerId`)
- Registered `/customers/:customerId` in `App.tsx`.
- Built `CustomerDetailsPage.tsx` featuring:
  - Accessible back navigation (`<- Back to Customers`).
  - Customer header displaying name, email, and customer ID.
  - Summary metric cards displaying `Completed Orders` and `Completed Value`.

### Step 7D - Customer Order Inspection
- Integrated `customerService.getCustomerOrders(customerId, page, pageSize)` on `CustomerDetailsPage.tsx`.
- Rendered an order history table displaying `Order #`, `Amount`, `Status` (using `StatusBadge`), and `Date`.
- Implemented dedicated pagination for the customer's order list.
- Reused all existing formatters and badge styling from Phase 6.

### Step 7E - Reliability & Edge Cases
- Tested and verified:
  - Customer with multiple orders (Customer #1 Acme Corporation): renders 2 completed orders, ₹1,700.50 value, and 4 total orders.
  - Customer with zero completed orders (Customer #10 Solstice Systems): renders 0 completed orders and ₹0.00 value.
  - Nonexistent customer (`GET /customers/99999`): cleanly returns HTTP 404, prompting a user-facing "Customer not found" error box.
  - Outage simulation: handled via the Retry button upon service recovery.

### Step 7F - TypeScript Build Check
- Ran `npm run build` (`tsc -b && vite build`) — passed with **0 errors** (37 modules transformed).

---

## 3. Invigilator Checkpoint Q&A

**Q: How are Completed Orders and Completed Value calculated?**  
A: The backend calculates both metrics using PostgreSQL database aggregations (`COUNT` and `SUM` filtered by `status = 'completed'`). The frontend receives pre-aggregated values and performs no in-memory financial math.

**Q: Why use a LEFT JOIN instead of an INNER JOIN?**  
A: An inner join would exclude any customer who has not yet completed an order. A `LEFT JOIN` ensures all customers remain visible in the operations dashboard, displaying 0 completed orders and ₹0.00 value.

**Q: Why use COUNT(order.id) instead of COUNT(*)?**  
A: With a `LEFT JOIN`, when a customer has no matching completed orders, the joined order fields are `NULL`. `COUNT(order.id)` evaluates to `0`, whereas `COUNT(*)` would count the customer row itself and mistakenly return `1`.

**Q: Why separate customer details and customer orders into two API calls?**  
A: Keeping the customer profile (`GET /customers/{id}`) and the order collection (`GET /customers/{id}/orders`) separate prevents accidentally transferring hundreds or thousands of order records when only high-level customer information is needed.

**Q: What happens if a user navigates to an invalid customer ID?**  
A: The API returns `404 Not Found`, and the frontend gracefully displays an informative error card with a link back to the customers table without crashing.

---

## 4. Phase 7 Verification Checklist
- [x] Customers page displays real seeded data from PostgreSQL
- [x] Completed order count and value computed via server-side database aggregations
- [x] Customers with zero completed orders remain visible
- [x] Clickable customer links navigate to /customers/:customerId
- [x] Customer details page displays customer profile and aggregated metrics
- [x] Customer order history table displays orders with status badges and formatters
- [x] Customer order list pagination verified
- [x] 404 error handling for nonexistent customers verified
- [x] TypeScript build check passed (0 errors)
- [x] README.md and DECISIONS.md updated
- [x] docs/phase-7.md created