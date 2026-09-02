import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <span className="brand-title">Operations</span>
        <span className="brand-badge">OMS</span>
      </div>
      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Orders
        </NavLink>
        <NavLink
          to="/customers"
          className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
        >
          Customers
        </NavLink>
      </nav>
    </aside>
  );
};