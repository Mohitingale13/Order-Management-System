import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { customerService } from '../services/customers';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Customer } from '../types/customer';
import type { Order } from '../types/order';

export const CustomerDetailsPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const id = Number(customerId);

  // Customer profile state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState<boolean>(true);
  const [customerError, setCustomerError] = useState<string | null>(null);

  // Customer orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderPage, setOrderPage] = useState<number>(1);
  const [orderPageSize] = useState<number>(10);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalOrderPages, setTotalOrderPages] = useState<number>(0);

  // Retry trigger
  const [retryCount, setRetryCount] = useState<number>(0);

  // Fetch customer details
  useEffect(() => {
    if (isNaN(id) || id <= 0) {
      setCustomerError('Invalid customer ID provided.');
      setLoadingCustomer(false);
      return;
    }

    let isMounted = true;
    setLoadingCustomer(true);
    setCustomerError(null);

    customerService
      .getCustomer(id)
      .then((data) => {
        if (isMounted) {
          setCustomer(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setCustomerError(err.message || 'Unable to load customer details. Please check connection.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingCustomer(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, retryCount]);

  // Fetch customer orders with pagination
  useEffect(() => {
    if (isNaN(id) || id <= 0) return;

    let isMounted = true;
    setLoadingOrders(true);
    setOrdersError(null);

    customerService
      .getCustomerOrders(id, orderPage, orderPageSize)
      .then((data) => {
        if (isMounted) {
          setOrders(data.items);
          setTotalOrders(data.total);
          setTotalOrderPages(data.total_pages);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setOrdersError(err.message || 'Unable to load customer orders.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingOrders(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, orderPage, orderPageSize, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  return (
    <div className="page-container">
      {/* 7.19 Back navigation */}
      <div className="back-navigation">
        <Link to="/customers" className="back-link">
          &larr; Back to Customers
        </Link>
      </div>

      {loadingCustomer && <div className="state-box">Loading customer details...</div>}

      {customerError && (
        <div className="state-box error-box">
          <h3>Customer details unavailable</h3>
          <p className="error-desc">{customerError}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '14px' }}
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {!loadingCustomer && !customerError && customer && (
        <>
          {/* Customer Profile & Performance Summary Header */}
          <div className="page-header customer-detail-header">
            <div>
              <h1>{customer.name}</h1>
              <p className="customer-email">{customer.email}</p>
            </div>
          </div>

          <div className="summary-pills">
            <div className="pill">
              <span className="pill-label">Completed Orders</span>
              <span className="pill-val">{customer.completed_orders ?? 0}</span>
            </div>
            <div className="pill">
              <span className="pill-label">Completed Value</span>
              <span className="pill-val">
                {formatCurrency(customer.completed_order_value ?? '0.00')}
              </span>
            </div>
            <div className="pill">
              <span className="pill-label">Customer ID</span>
              <span className="pill-val font-mono">#{customer.id}</span>
            </div>
          </div>

          {/* Customer Order Inspection Section */}
          <div className="customer-orders-section" style={{ marginTop: '32px' }}>
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <h2>Order History</h2>
              <p className="text-secondary text-sm">
                Showing all recorded orders for this customer.
              </p>
            </div>

            {loadingOrders && <div className="state-box">Loading order history...</div>}

            {ordersError && (
              <div className="state-box error-box">
                <p>{ordersError}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '10px' }}
                  onClick={handleRetry}
                >
                  Retry Orders
                </button>
              </div>
            )}

            {!loadingOrders && !ordersError && orders.length === 0 && (
              <div className="state-box empty-box">
                <h3>No orders found for this customer</h3>
                <p className="text-secondary">This customer has not placed any orders yet.</p>
              </div>
            )}

            {!loadingOrders && !ordersError && orders.length > 0 && (
              <>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '100px' }}>Order</th>
                        <th style={{ textAlign: 'right', width: '160px' }}>Amount</th>
                        <th style={{ width: '140px', textAlign: 'center' }}>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="font-mono text-muted">#{order.id}</td>
                          <td style={{ textAlign: 'right' }} className="font-mono font-medium">
                            {formatCurrency(order.amount)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="text-secondary">{formatDate(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Customer Orders Pagination */}
                <Pagination
                  currentPage={orderPage}
                  totalPages={totalOrderPages}
                  pageSize={orderPageSize}
                  totalItems={totalOrders}
                  onPageChange={(newPage) => setOrderPage(newPage)}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};