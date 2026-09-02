# Phase 10 - Reliability & Error Resilience Pass

This document details the audit, implementation, and verification of Phase 10: enforcing strict state modeling (Loading, Success, Empty, Error) across all views, guaranteeing non-blocking loading resolution via `.finally()`, preventing duplicate mutation submissions, verifying database transaction rollbacks, and testing resilience under destructive failure scenarios.

---

## 1. Reliability State Architecture

### Read Requests (Query State Modeling)
```text
                     API REQUEST
                          |
                    +-----+-----+
                    |           |
                 Success     Failure
                    |           |
             +------+-----+     v
             |            |   Error UI
             v            v     |
          Has Data      Empty   |
             |            |     v
             v            v   Retry
           Render     Empty UI
```

### Write Operations (Mutation State Modeling)
```text
                  User Submits Form
                          |
                Frontend Validation
                          |
                Backend Validation
                          |
                Resource Existence Check
                          |
                Database Transaction
                          |
                    +-----+-----+
                    |           |
                 Success     Failure
                    |           |
                    v           v
               Update UI     Rollback
                            + Error UI
```

---

## 2. Step-by-Step Implementation

### Step 10A & 10C - Asynchronous Lifecycle & Loading Audit
- Audited all asynchronous fetching routines across `DashboardPage.tsx`, `OrdersPage.tsx`, `CustomersPage.tsx`, and `CustomerDetailsPage.tsx`.
- Guaranteed that `setLoading(false)` executes unconditionally inside `.finally()` blocks:
  ```typescript
  try {
    const data = await getSummary();
    setSummary(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false); // Guarantees loading is never stuck on failure
  }
  ```
- Eliminates perpetual `Loading...` lockups if a network failure or server error occurs.

### Step 10B - Standardized Frontend Error Messages & Recovery
- Converted low-level technical errors into clear, actionable messages:
  `Unable to load data. Please check connection and retry.`
- Provided an interactive **Retry** button on all data-driven views that re-executes the query without requiring a full browser refresh.

### Step 10D - Empty State Differentiation
- Confirmed that successful queries yielding zero records are treated as valid states rather than errors:
  - **Orders Search**: When a customer filter matches 0 records, displays `No orders found. Try adjusting your search query or status filter.` with a one-click `Clear Search & Filters` button.
  - **Customers List**: Displays `No customers found` if database accounts are empty.
  - **Customer Orders**: Displays `No orders found for this customer` when viewing an account with 0 order history.

### Step 10E - Multi-Tiered Mutation Validation
- **Frontend Validation**:
  - Requires selecting an existing customer.
  - Requires entering a numeric amount strictly greater than 0.
  - Provides instant inline validation feedback.
- **Backend Validation**:
  - FastAPI and Pydantic enforce `amount > 0` and `OrderStatus` enum membership, rejecting invalid direct requests with HTTP `422 Unprocessable Entity`.
  - Service layer enforces customer existence, rejecting nonexistent foreign keys with HTTP `404 Customer not found`.

### Step 10F - Duplicate Mutation Prevention
- During order creation, the submit button is locked to `disabled` and displays `Creating Order...` while the HTTP request is in-flight.
- In the in-place status editor, dropdowns display an active in-flight indicator (`...`) and remain disabled until the server responds, preventing duplicate clicks.
- If status update fails, the frontend automatically reverts the select dropdown to its previous status value.

### Step 10G - Backend Transaction Rollbacks & Error Masking
- Mutation service methods wrap database operations in `try...except...db.rollback()` blocks, guaranteeing failed operations do not leave contaminated transaction sessions in SQLAlchemy.
- Global exception handlers in `app/main.py` log the raw stack trace server-side while masking the client response with a safe, generic HTTP 500 error (`Unable to process the request at this time.`).

---

## 3. Destructive Failure & Reliability Test Suite

All failure scenarios were executed against the live system:

| Test Case | Scenario | Input / Action | Result | Verification |
|---|---|---|---|---|
| Test 1 | Empty Search Query | `GET /orders?search=zzzzzzzz` | **HTTP 200 OK** | Returned `items: []`, `total: 0`. No error thrown. |
| Test 2 | Negative Order Amount | `POST /orders` (`amount: -100`) | **HTTP 422** | Rejected by Pydantic `gt=0` constraint. |
| Test 3 | Zero Order Amount | `POST /orders` (`amount: 0`) | **HTTP 422** | Rejected by Pydantic `gt=0` constraint. |
| Test 4 | Invalid Status Enum | `POST /orders` (`status: invalid`) | **HTTP 422** | Rejected by Pydantic `OrderStatus` constraint. |
| Test 5 | Nonexistent Customer FK | `POST /orders` (`customer_id: 99999`)| **HTTP 404** | Clean `{"detail": "Customer not found"}` response. |
| Test 6 | Nonexistent Order Patch | `PATCH /orders/99999/status` | **HTTP 404** | Clean `{"detail": "Order not found"}` response. |
| Test 7 | Database Outage | `docker compose stop postgres` | **HTTP 500** | Clean masked response: `Unable to process the request at this time.`. Zero stack traces or credentials leaked. |
| Test 8 | Automatic Recovery | `docker compose start postgres` | **HTTP 200 OK** | Resumed normal query serving within 2 seconds without restarting the FastAPI application. |

---

## 4. Invigilator Checkpoint Q&A

**Q: What happens if the backend goes down?**  
A: The frontend network request rejects. The error is caught, the loading state is cleared in `.finally()`, and the view displays a controlled error card with an interactive **Retry** button.

**Q: Why isn't an empty result an error?**  
A: Because the request succeeded and the database query executed properly; there simply aren't matching records. The UI distinguishes between successful empty data and an actual network or server failure.

**Q: Why validate on both frontend and backend?**  
A: Frontend validation improves user experience with instant visual feedback, but backend validation is authoritative because any client can bypass the browser and issue requests directly to the API.

**Q: What happens if the database fails during order creation?**  
A: The service layer executes `db.rollback()` to clear the failed transaction state, logs the exception server-side for developer diagnostics, and returns a controlled HTTP 500 response to the client.

**Q: Why use finally blocks for loading states?**  
A: It guarantees that `setLoading(false)` executes regardless of whether the promise resolves successfully or throws an error, eliminating permanent loading lockups.

**Q: What happens if the user clicks Create Order twice rapidly?**  
A: The submit button and form controls are disabled upon initial submission, preventing concurrent duplicate requests from reaching the server.

**Q: Why not automatically retry every failed API request?**  
A: Automatic retries can be dangerous for mutation requests (POST/PATCH) because they could inadvertently duplicate operations. A manual **Retry** button gives the user intentional control over when to resend requests.

---

## 5. Phase 10 Verification Checklist
- [x] All frontend API calls guarantee loading resolution via finally blocks
- [x] Clear, non-technical error messages displayed with Retry buttons
- [x] Empty states cleanly differentiated from error states across all collections
- [x] Frontend validation blocks invalid order submissions
- [x] Backend validation strictly rejects negative amounts, zero amounts, and invalid statuses (422)
- [x] Missing customer and order IDs return clean 404 responses
- [x] Duplicate mutations prevented via in-flight control locks
- [x] Failed status updates automatically revert the UI to the previous status
- [x] Transaction rollbacks verified on database write operations
- [x] Live container stop/start outage test verified with automatic recovery
- [x] Clean TypeScript build (npm run build passed with 0 errors)
- [x] README.md and DECISIONS.md updated
- [x] docs/phase-10.md created