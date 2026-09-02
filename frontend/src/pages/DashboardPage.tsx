import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboard';
import { formatCurrency } from '../utils/formatters';
import type { DashboardSummary } from '../types/dashboard';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    dashboardService
      .getSummary()
      .then((data) => {
        if (isMounted) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load dashboard metrics.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshCount]);

  const handleRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  return (
    <div className="page-container">
      {/* Dashboard Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Real-time operations summary and performance metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh metrics from PostgreSQL"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/orders/new" className="btn btn-primary btn-sm">
            + Create Order
          </Link>
        </div>
      </div>

      {/* Error state with retry action */}
      {error && (
        <div className="state-box error-box" style={{ marginBottom: '24px' }}>
          <h3>Unable to load dashboard metrics</h3>
          <p className="error-desc">{error}</p>
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

      {/* Loading state skeleton / indicator */}
      {loading && !error && (
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

      {/* 9D: Three Primary Operations Metric Cards */}
      {!loading && !error && summary && (
        <>
          <div className="metric-cards-grid">
            {/* Metric 1: Total Orders */}
            <div className="metric-card">
              <div>
                <div className="metric-card-header">
                  <span className="metric-card-label">Total Orders</span>
                  <span className="badge-subtle font-mono">COUNT</span>
                </div>
                <div className="metric-card-value">{summary.total_orders}</div>
                <p className="metric-card-description">
                  All recorded orders across pending, completed, and cancelled.
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
                  <span className="badge-subtle font-mono">SUM</span>
                </div>
                <div className="metric-card-value">
                  {formatCurrency(summary.total_completed_order_value)}
                </div>
                <p className="metric-card-description">
                  Revenue from orders with status completed.
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
                  <span className="badge-subtle font-mono">COUNT</span>
                </div>
                <div className="metric-card-value">{summary.total_customers}</div>
                <p className="metric-card-description">
                  Registered customer accounts in the database.
                </p>
              </div>
              <div className="metric-card-footer">
                <Link to="/customers" className="metric-card-link">
                  View customers &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Operations Shortcuts Card */}
          <div className="foundation-box" style={{ marginTop: '24px' }}>
            <h3>Operations Shortcuts</h3>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>
              Common workflows and navigation for operations team members.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/orders" className="btn btn-secondary btn-sm">
                View & Filter Orders
              </Link>
              <Link to="/orders/new" className="btn btn-secondary btn-sm">
                + Create New Order
              </Link>
              <Link to="/customers" className="btn btn-secondary btn-sm">
                Customer Performance
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};