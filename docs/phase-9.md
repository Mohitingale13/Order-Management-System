# Phase 9 - Dashboard Summary Feature

This document records the design, implementation, and verification of Phase 9: replacing placeholder dashboard components with live PostgreSQL-backed summary metrics, building resilient card layouts, and verifying live metric updates upon data mutations.

---

## 1. Feature Architecture

```text
                     DASHBOARD (UI)
                           |
                           | GET /dashboard/summary
                           v
                        FastAPI
                           |
                 +---------+---------+
                 v                   v
          COUNT(orders)       COUNT(customers)
                 |
                 +---- SUM(completed orders)
                           |
                           v
                      PostgreSQL
                           |
                           v
                    JSON response
                           |
                           v
                    React Frontend
                           |
            +--------------+--------------+
            v              v              v
       Total Orders   Completed Value   Customers
```

---

## 2. Step-by-Step Implementation

### Step 9A - Dashboard API Verification
- Verified `GET /dashboard/summary` executes three SQL aggregations in PostgreSQL:
  - `COUNT(orders)` -> Total order count across all statuses.
  - `COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0)` -> Total monetary value strictly from completed orders.
  - `COUNT(customers)` -> Total registered client accounts.
- Confirmed that null or zero cases cleanly evaluate to `0` and `0.00` rather than `null`.

### Step 9B - TypeScript Types & Contracts
- Verified `frontend/src/types/dashboard.ts` defines `DashboardSummary` matching the backend contract (`total_orders: number`, `total_completed_order_value: string`, `total_customers: number`).

### Step 9C - API Service Layer
- Verified `frontend/src/services/dashboard.ts` provides `getSummary()` mapping to `GET /dashboard/summary` via native `fetch`.

### Step 9D - Metric Cards & Operations Dashboard View
- Built `DashboardPage.tsx` rendering three primary cards:
  1. **Total Orders**: Total orders recorded in the system, with navigation shortcut to Orders.
  2. **Completed Value**: Total monetary revenue from completed orders, formatted in Indian Rupees (`formatCurrency()`).
  3. **Total Customers**: Total customer accounts, with navigation shortcut to Customers.
- Added quick action shortcuts for common operations tasks (`View & Filter Orders`, `+ Create New Order`, `Customer Performance`).

### Step 9E - Resilient States & Error Recovery
- **Loading State**: Displays skeleton cards with `...` values to avoid displaying misleading zeros while queries are in-flight.
- **Error State**: Displays `Unable to load dashboard metrics` with an interactive **Retry** button.
- **On-Demand Refresh**: Provides a **Refresh** button allowing operations users to query latest PostgreSQL metrics without hard browser reloads.

### Step 9F - Integration Verification
Verified that dashboard metrics dynamically track database mutations:
1. Initial baseline: 42 orders, ₹33,811.45 completed value, 10 customers.
2. Created a completed order (₹2,000.00) -> Total orders increased to 43, completed value increased to ₹35,811.45.
3. Created a pending order (₹1,500.00) -> Total orders increased to 44, completed value remained ₹35,811.45.
4. Changed pending order to completed -> Completed value increased to ₹37,311.45.

### Step 9G - Build & TypeScript Check
- Ran `npm run build` (`tsc -b && vite build`) — passed with **0 errors** (38 modules transformed).

---

## 3. Invigilator Checkpoint Q&A

**Q: Why use a single summary endpoint instead of three separate endpoints?**  
A: A single endpoint (`GET /dashboard/summary`) returns all three related aggregate metrics in one network round-trip. This reduces HTTP overhead and guarantees the frontend renders a consistent snapshot of system state.

**Q: Why calculate metrics in PostgreSQL instead of React?**  
A: Transferring potentially millions of order records to the client to calculate `COUNT` and `SUM` would exhaust network bandwidth and client memory. PostgreSQL is purpose-built for fast database aggregations and returns a compact JSON payload under 100 bytes.

**Q: What contributes to Completed Order Value?**  
A: Strictly orders whose status is `completed`. Orders with `pending` or `cancelled` status are excluded from monetary revenue totals.

**Q: What happens if there are no completed orders?**  
A: The SQL query uses `COALESCE(SUM(...), 0)` to guarantee the API returns `0.00` rather than `null`, preventing frontend rendering errors.

**Q: Why not poll the dashboard endpoint automatically every 2 seconds?**  
A: Without an explicit requirement for real-time monitoring, polling generates unnecessary server and database load. Providing an on-demand refresh button gives operations users up-to-date metrics whenever needed without background overhead.

---

## 4. Phase 9 Verification Checklist
- [x] GET /dashboard/summary returns total_orders, total_completed_order_value, and total_customers
- [x] Three primary metric cards rendered on Dashboard page
- [x] Currency formatted via formatCurrency utility (INR)
- [x] Loading state displays clean placeholders without misleading zero values
- [x] Error state displays helpful notice with interactive Retry action
- [x] Live refresh button queries PostgreSQL on demand
- [x] Integration verified: creating orders and updating statuses immediately reflects in dashboard metrics
- [x] Clean TypeScript build (npm run build passed with 0 errors)
- [x] README.md and DECISIONS.md updated
- [x] docs/phase-9.md created