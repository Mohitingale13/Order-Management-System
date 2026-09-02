import React, { useEffect, useState } from 'react';
import { orderService } from '../services/orders';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Order, OrderSortBy, OrderStatus, SortOrder } from '../types/order';

type SortPreset = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & search states
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sortPreset, setSortPreset] = useState<SortPreset>('newest');

  // Pagination state (default page 1, size 10)
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  // 6B: Debounce customer search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // 6.8: Search resets pagination to page 1
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  // Fetch orders whenever search, status filter, sort preset, or page changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    // Map user-friendly sort preset to backend parameters
    let sortBy: OrderSortBy = 'created_at';
    let sortOrder: SortOrder = 'desc';

    if (sortPreset === 'oldest') {
      sortBy = 'created_at';
      sortOrder = 'asc';
    } else if (sortPreset === 'amount_desc') {
      sortBy = 'amount';
      sortOrder = 'desc';
    } else if (sortPreset === 'amount_asc') {
      sortBy = 'amount';
      sortOrder = 'asc';
    }

    orderService
      .getOrders({
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
      })
      .then((data) => {
        if (isMounted) {
          setOrders(data.items);
          setTotalCount(data.total);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Unable to load orders.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, statusFilter, sortPreset, page, pageSize]);

  // Handler for status filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as OrderStatus | 'all');
    setPage(1); // Reset to page 1 on filter change
  };

  // Handler for sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortPreset(e.target.value as SortPreset);
    setPage(1); // Reset to page 1 on sort change
  };

  // Handler to clear all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setSortPreset('newest');
    setPage(1);
  };

  const isFiltered = debouncedSearch !== '' || statusFilter !== 'all' || sortPreset !== 'newest';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Orders</h1>
        <p>Operations order management, customer search, status filtering, and sorting.</p>
      </div>

      {/* 6B, 6C, 6D: Operations Controls Toolbar */}
      <div className="orders-toolbar">
        <div className="toolbar-group">
          <label htmlFor="customer-search" className="form-label">
            Search Customer
          </label>
          <input
            id="customer-search"
            type="text"
            className="form-input search-input"
            placeholder="Search by customer name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="toolbar-group">
          <label htmlFor="status-filter" className="form-label">
            Status
          </label>
          <select
            id="status-filter"
            className="form-select"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="toolbar-group">
          <label htmlFor="sort-preset" className="form-label">
            Sort By
          </label>
          <select
            id="sort-preset"
            className="form-select"
            value={sortPreset}
            onChange={handleSortChange}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>

        {isFiltered && (
          <div className="toolbar-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Orders Table & State View */}
      <div className="orders-content">
        {loading && <div className="state-box">Loading orders...</div>}

        {error && (
          <div className="state-box error-box">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="state-box empty-box">
            <h3>No orders found</h3>
            <p className="text-secondary">Try adjusting your search query or status filter.</p>
            {isFiltered && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '12px' }}
                onClick={handleResetFilters}
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <>
            <div className="orders-meta">
              <span className="text-secondary">
                Showing <strong>{orders.length}</strong> of <strong>{totalCount}</strong> matching orders
              </span>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '100px' }}>Order</th>
                    <th>Customer</th>
                    <th style={{ textAlign: 'right', width: '150px' }}>Amount</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Status</th>
                    <th style={{ width: '190px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-mono text-muted">#{order.id}</td>
                      <td className="font-medium">{order.customer.name}</td>
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
          </>
        )}
      </div>
    </div>
  );
};