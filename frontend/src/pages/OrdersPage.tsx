import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orders';
import { Pagination } from '../components/Pagination';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Order, OrderSortBy, OrderStatus, SortOrder } from '../types/order';

type SortPreset = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Status mutation notification/error
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [statusActionMessage, setStatusActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Filter & search states
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sortPreset, setSortPreset] = useState<SortPreset>('newest');

  // Server-side pagination state (default 10 items per page)
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Retry trigger for error recovery
  const [retryCount, setRetryCount] = useState<number>(0);

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

  // Fetch orders whenever search, status filter, sort preset, page, or retry triggers
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
          setTotalPages(data.total_pages);
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
  }, [debouncedSearch, statusFilter, sortPreset, page, pageSize, retryCount]);

  // Handler for status filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as OrderStatus | 'all');
    setPage(1);
  };

  // Handler for sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortPreset(e.target.value as SortPreset);
    setPage(1);
  };

  // Handler to clear all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setSortPreset('newest');
    setPage(1);
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // 8E: Status Update Handler (PATCH /orders/{id}/status)
  const handleOrderStatusUpdate = async (
    orderId: number,
    newStatus: OrderStatus,
    prevStatus: OrderStatus
  ) => {
    if (newStatus === prevStatus) return;

    setUpdatingOrderId(orderId);
    setStatusActionMessage(null);

    try {
      await orderService.updateOrderStatus(orderId, { status: newStatus });

      // Optimistically update local state on success
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      setStatusActionMessage({
        type: 'success',
        text: `Order #${orderId} status updated to ${newStatus}.`,
      });

      // Clear success notification after 3 seconds
      setTimeout(() => {
        setStatusActionMessage(null);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to update order status.';
      setStatusActionMessage({
        type: 'error',
        text: `Failed to update Order #${orderId}: ${msg}`,
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const isFiltered = debouncedSearch !== '' || statusFilter !== 'all' || sortPreset !== 'newest';

  return (
    <div className="page-container">
      {/* Page Header with Create Order Action */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Orders</h1>
          <p>Operations order management, customer search, status filtering, and sorting.</p>
        </div>
        <Link to="/orders/new" className="btn btn-primary">
          + Create Order
        </Link>
      </div>

      {/* Mutation feedback banner */}
      {statusActionMessage && (
        <div
          className={`status-message-banner ${
            statusActionMessage.type === 'success' ? 'banner-success' : 'banner-error'
          }`}
        >
          {statusActionMessage.text}
        </div>
      )}

      {/* Operations Controls Toolbar */}
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
            <h3>Unable to load orders</h3>
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
                    <th style={{ width: '160px', textAlign: 'center' }}>Status</th>
                    <th style={{ width: '190px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
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
                        {/* 8E: In-place Status Editing */}
                        <div className="status-select-wrapper">
                          <select
                            className={`status-select status-select-${order.status}`}
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) =>
                              handleOrderStatusUpdate(
                                order.id,
                                e.target.value as OrderStatus,
                                order.status
                              )
                            }
                            title="Change order status"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {updatingOrderId === order.id && (
                            <span className="updating-indicator" title="Updating status...">
                              ...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-secondary">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Server-side Pagination Component */}
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