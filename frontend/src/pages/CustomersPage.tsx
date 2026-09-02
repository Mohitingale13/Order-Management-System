import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../services/customers';
import { Pagination } from '../components/Pagination';
import { formatCurrency } from '../utils/formatters';
import type { CustomerSummary } from '../types/customer';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Retry trigger for error recovery
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    customerService
      .getCustomers(page, pageSize)
      .then((data) => {
        if (isMounted) {
          setCustomers(data.items);
          setTotalCount(data.total);
          setTotalPages(data.total_pages);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load customer summaries.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Customers</h1>
        <p>Operations customer summaries, completed order performance, and account inspection.</p>
      </div>

      <div className="customers-content">
        {loading && <div className="state-box">Loading customers...</div>}

        {error && (
          <div className="state-box error-box">
            <h3>Unable to load customers</h3>
            <p className="error-desc">{error}</p>
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

        {!loading && !error && customers.length === 0 && (
          <div className="state-box empty-box">
            <h3>No customers found</h3>
            <p className="text-secondary">There are currently no customer accounts registered.</p>
          </div>
        )}

        {!loading && !error && customers.length > 0 && (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th style={{ width: '160px', textAlign: 'center' }}>Completed Orders</th>
                    <th style={{ width: '180px', textAlign: 'right' }}>Completed Value</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <Link
                          to={`/customers/${customer.id}`}
                          className="customer-link"
                        >
                          {customer.name} &rarr;
                        </Link>
                      </td>
                      <td className="text-secondary">{customer.email}</td>
                      <td style={{ textAlign: 'center' }} className="font-mono">
                        {customer.completed_orders}
                      </td>
                      <td style={{ textAlign: 'right' }} className="font-mono font-medium">
                        {formatCurrency(customer.completed_order_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Server-side Pagination */}
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalCount}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </div>
    </div>
  );
};