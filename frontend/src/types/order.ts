export type OrderStatus = 'pending' | 'completed' | 'cancelled';

export type OrderSortBy = 'created_at' | 'amount' | 'status';

export type SortOrder = 'asc' | 'desc';

export interface OrderCustomer {
  id: number;
  name: string;
}

export interface Order {
  id: number;
  customer: OrderCustomer;
  amount: string;
  status: OrderStatus;
  created_at: string;
}

export interface PaginatedOrders {
  items: Order[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface OrderFilterParams {
  search?: string;
  status?: OrderStatus;
  sort_by?: OrderSortBy;
  sort_order?: SortOrder;
  page?: number;
  page_size?: number;
}

export interface CreateOrderPayload {
  customer_id: number;
  amount: number | string;
  status?: OrderStatus;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}