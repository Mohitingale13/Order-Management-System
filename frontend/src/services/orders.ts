import { request } from './api';
import type {
  CreateOrderPayload,
  Order,
  OrderFilterParams,
  PaginatedOrders,
  UpdateOrderStatusPayload,
} from '../types/order';

export const orderService = {
  getOrders(params?: OrderFilterParams): Promise<PaginatedOrders> {
    const searchParams = new URLSearchParams();

    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.set('sort_order', params.sort_order);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.page_size) searchParams.set('page_size', String(params.page_size));

    const qs = searchParams.toString();
    return request<PaginatedOrders>(`/orders${qs ? `?${qs}` : ''}`);
  },

  createOrder(payload: CreateOrderPayload): Promise<Order> {
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateOrderStatus(orderId: number, payload: UpdateOrderStatusPayload): Promise<{ id: number; status: string }> {
    return request<{ id: number; status: string }>(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};