import React, { useEffect, useState } from 'react';
import { orderService } from '../services/orders';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';
import type { Order } from '../types/order';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    orderService
      .getOrders()
      .then((data) => {
        if (isMounted) {
          setOrders(data.items);
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
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Orders</h1>
        <p>Operations order management and status tracking.</p>
      </div>

      <div className="orders-content">
        {loading && <div className="state-box">Loading orders...</div>}

        {error && (
          <div className="state-box error-box">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
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
        )}
      </div>
    </div>
  );
};