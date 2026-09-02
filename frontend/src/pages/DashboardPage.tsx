import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboard';
import type { DashboardSummary } from '../types/dashboard';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
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
          setError(err.message || 'Failed to connect to API');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Operations summary and performance metrics.</p>
      </div>

      <div className="foundation-box">
        <h3>Backend Connectivity Check</h3>
        {loading && <p className="text-muted">Connecting to API...</p>}
        {error && <p className="text-danger">Error: {error}</p>}
        {summary && (
          <div className="connectivity-details">
            <p className="status-success">[CONNECTED] FastAPI and PostgreSQL connection verified.</p>
            <div className="summary-pills">
              <div className="pill">
                <span className="pill-label">Total Orders</span>
                <span className="pill-val">{summary.total_orders}</span>
              </div>
              <div className="pill">
                <span className="pill-label">Total Customers</span>
                <span className="pill-val">{summary.total_customers}</span>
              </div>
              <div className="pill">
                <span className="pill-label">Completed Value</span>
                <span className="pill-val">${Number(summary.total_completed_order_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}
        <p className="note">Full metrics display, trends, and charts will be implemented in Phase 9.</p>
      </div>
    </div>
  );
};