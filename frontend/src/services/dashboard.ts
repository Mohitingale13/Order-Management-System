import { request } from './api';
import type { DashboardSummary } from '../types/dashboard';

export const dashboardService = {
  getSummary(): Promise<DashboardSummary> {
    return request<DashboardSummary>('/dashboard/summary');
  },
};