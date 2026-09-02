import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerService } from '../services/customers';
import { orderService } from '../services/orders';
import type { CustomerSummary } from '../types/customer';
import type { OrderStatus } from '../types/order';

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();

  // Customer options
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);
  const [customersError, setCustomersError] = useState<string | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [status, setStatus] = useState<OrderStatus>('pending');

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ customerId?: string; amount?: string }>({});

  // Load existing customers for the dropdown
  useEffect(() => {
    let isMounted = true;
    setLoadingCustomers(true);
    setCustomersError(null);

    // Fetch up to 100 customers for the selection list
    customerService
      .getCustomers(1, 100)
      .then((data) => {
        if (isMounted) {
          setCustomers(data.items);
          setLoadingCustomers(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCustomersError(err.message || 'Unable to load customer list.');
          setLoadingCustomers(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const validate = (): boolean => {
    const errors: { customerId?: string; amount?: string } = {};

    if (!customerId || Number(customerId) <= 0) {
      errors.customerId = 'Please select a customer.';
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      errors.amount = 'Order amount is required.';
    } else if (numAmount <= 0) {
      errors.amount = 'Amount must be greater than zero.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await orderService.createOrder({
        customer_id: Number(customerId),
        amount: parseFloat(amount),
        status,
      });

      // On success, redirect to Orders list
      navigate('/orders');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create order.';
      setFormError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '640px' }}>
      <div className="back-navigation">
        <Link to="/orders" className="back-link">
          &larr; Back to Orders
        </Link>
      </div>

      <div className="page-header">
        <h1>Create Order</h1>
        <p>Record a new customer order in the operations database.</p>
      </div>

      {formError && (
        <div className="state-box error-box" style={{ padding: '16px', marginBottom: '20px' }}>
          <strong>Could not create order:</strong> {formError}
        </div>
      )}

      <form className="form-card" onSubmit={handleSubmit} noValidate>
        {/* Customer Selection */}
        <div className="form-group">
          <label htmlFor="customer-select" className="form-label">
            Customer <span className="required-star">*</span>
          </label>
          {loadingCustomers ? (
            <p className="text-secondary text-sm">Loading customer list...</p>
          ) : customersError ? (
            <p className="text-danger text-sm">{customersError}</p>
          ) : (
            <select
              id="customer-select"
              className={`form-select ${fieldErrors.customerId ? 'input-error' : ''}`}
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (fieldErrors.customerId) {
                  setFieldErrors((prev) => ({ ...prev, customerId: undefined }));
                }
              }}
              disabled={submitting}
            >
              <option value="">-- Select an existing customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          )}
          {fieldErrors.customerId && (
            <span className="field-error-text">{fieldErrors.customerId}</span>
          )}
        </div>

        {/* Order Amount */}
        <div className="form-group">
          <label htmlFor="order-amount" className="form-label">
            Amount (INR) <span className="required-star">*</span>
          </label>
          <input
            id="order-amount"
            type="number"
            step="0.01"
            min="0.01"
            className={`form-input ${fieldErrors.amount ? 'input-error' : ''}`}
            placeholder="e.g. 2500.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (fieldErrors.amount) {
                setFieldErrors((prev) => ({ ...prev, amount: undefined }));
              }
            }}
            disabled={submitting}
          />
          {fieldErrors.amount && (
            <span className="field-error-text">{fieldErrors.amount}</span>
          )}
        </div>

        {/* Order Status */}
        <div className="form-group">
          <label htmlFor="order-status" className="form-label">
            Initial Status
          </label>
          <select
            id="order-status"
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            disabled={submitting}
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-secondary text-sm" style={{ marginTop: '4px' }}>
            Defaults to Pending.
          </span>
        </div>

        {/* Form Actions */}
        <div className="form-actions" style={{ marginTop: '28px' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || loadingCustomers}
          >
            {submitting ? 'Creating Order...' : 'Create Order'}
          </button>
          <Link to="/orders" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};