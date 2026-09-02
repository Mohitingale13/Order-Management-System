import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboard';
import { orderService } from '../services/orders';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { DashboardSummary } from '../types/dashboard';
import type { Order } from '../types/order';

export const DashboardPage: React.FC = () => {
  // Metric summary state
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Recent activity (newest 5 orders) state
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [refreshCount, setRefreshCount] = useState<number>(0);

  // Fetch summary metrics
  useEffect(() => {
    let isMounted = true;
    setLoadingSummary(true);
    setSummaryError(null);

    dashboardService
      .getSummary()
      .then((data) => {
        if (isMounted) {
          setSummary(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setSummaryError(err.message || 'Unable to load dashboard metrics. Please check backend connectivity.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingSummary(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshCount]);

  // Fetch newest 5 orders for recent activity
  useEffect(() => {
    let isMounted = true;
    setLoadingOrders(true);
    setOrdersError(null);

    orderService
      .getOrders({
        page: 1,
        page_size: 5,
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      .then((data) => {
        if (isMounted) {
          setRecentOrders(data.items);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setOrdersError(err.message || 'Unable to load recent activity.');
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
  }, [refreshCount]);

  const handleRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  const isRefreshing = loadingSummary || loadingOrders;

  return (
    <div className="page-container">
      {/* Dashboard Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Real-time operations summary, performance metrics, and recent activity.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh metrics from PostgreSQL"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/orders/new" className="btn btn-primary btn-sm">
            + Create Order
          </Link>
        </div>
      </div>

      {/* Error state with retry action for summary */}
      {summaryError && (
        <div className="state-box error-box" style={{ marginBottom: '24px' }}>
          <h3>Unable to load dashboard metrics</h3>
          <p className="error-desc">{summaryError}</p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '14px' }}
            onClick={handleRefresh}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state skeleton */}
      {loadingSummary && !summaryError && (
        <div className="metric-cards-grid">
          <div className="metric-card loading-card">
            <span className="metric-card-label">Total Orders</span>
            <div className="metric-card-value font-mono">...</div>
            <span className="text-secondary text-sm">Querying database...</span>
          </div>
          <div className="metric-card loading-card">
            <span className="metric-card-label">Completed Value</span>
            <div className="metric-card-value font-mono">...</div>
            <span className="text-secondary text-sm">Calculating aggregation...</span>
          </div>
          <div className="metric-card loading-card">
            <span className="metric-card-label">Total Customers</span>
            <div className="metric-card-value font-mono">...</div>
            <span className="text-secondary text-sm">Querying database...</span>
          </div>
        </div>
      )}

      {/* Primary Operations Metric Cards */}
      {!loadingSummary && !summaryError && summary && (
        <div className="metric-cards-grid">
          {/* Metric 1: Total Orders */}
          <div className="metric-card">
            <div>
              <div className="metric-card-header">
                <span className="metric-card-label">Total Orders</span>
              </div>
              <div className="metric-card-value">{summary.total_orders}</div>
              <p className="metric-card-description">
                Total order volume across all statuses.
              </p>
            </div>
            <div className="metric-card-footer">
              <Link to="/orders" className="metric-card-link">
                Manage orders &rarr;
              </Link>
            </div>
          </div>

          {/* Metric 2: Completed Order Value */}
          <div className="metric-card">
            <div>
              <div className="metric-card-header">
                <span className="metric-card-label">Completed Value</span>
              </div>
              <div className="metric-card-value">
                {formatCurrency(summary.total_completed_order_value)}
              </div>
              <p className="metric-card-description">
                Total revenue from completed orders.
              </p>
            </div>
            <div className="metric-card-footer">
              <span className="text-muted text-sm">Excludes pending/cancelled</span>
            </div>
          </div>

          {/* Metric 3: Total Customers */}
          <div className="metric-card">
            <div>
              <div className="metric-card-header">
                <span className="metric-card-label">Total Customers</span>
              </div>
              <div className="metric-card-value">{summary.total_customers}</div>
              <p className="metric-card-description">
                Active customer accounts in the system.
              </p>
            </div>
            <div className="metric-card-footer">
              <Link to="/customers" className="metric-card-link">
                View customers &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Section (Newest 5 Orders) */}
      <div className="recent-activity-section" style={{ marginTop: '36px' }}>
        <div
          className="section-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '16px',
          }}
        >
          <div>
            <h2>Recent Activity</h2>
            <p className="text-secondary text-sm">
              Latest 5 orders and their current status.
            </p>
          </div>
          <Link to="/orders" className="btn btn-secondary btn-sm">
            View All Orders &rarr;
          </Link>
        </div>

        {loadingOrders && <div className="state-box">Loading recent activity...</div>}

        {ordersError && (
          <div className="state-box error-box">
            <p>{ordersError}</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '10px' }}
              onClick={handleRefresh}
            >
              Retry
            </button>
          </div>
        )}

        {!loadingOrders && !ordersError && recentOrders.length === 0 && (
          <div className="state-box empty-box">
            <p className="text-secondary">No recent order activity found.</p>
          </div>
        )}

        {!loadingOrders && !ordersError && recentOrders.length > 0 && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Order</th>
                  <th>Customer</th>
                  <th style={{ textAlign: 'right', width: '150px' }}>Amount</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '190px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-muted">#{order.id}</td>
                    <td className="font-medium">
                      <Link to={`/customers/${order.customer.id}`} className="customer-link">
                        {order.customer.name}
                      </Link>
                    </td>
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
        )}
      </div>
    </div>
  );
};