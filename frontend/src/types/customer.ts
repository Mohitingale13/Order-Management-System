export interface Customer {
  id: number;
  name: string;
  email: string;
  created_at: string;
  completed_orders: number;
  completed_order_value: string;
}

export interface CustomerSummary {
  id: number;
  name: string;
  email: string;
  completed_orders: number;
  completed_order_value: string;
}

export interface CustomerList {
  items: CustomerSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}