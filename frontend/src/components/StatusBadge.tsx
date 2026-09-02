import React from 'react';
import type { OrderStatus } from '../types/order';

interface StatusBadgeProps {
  status: OrderStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase();
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`status-badge status-${normalized}`}>
      {label}
    </span>
  );
};