import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-title">Order Management Dashboard</div>
        <div className="header-status">
          <span className="status-dot"></span>
          System Online
        </div>
      </header>
      <div className="app-body">
        <Sidebar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};