import { request } from './api';
import type { Customer, CustomerList } from '../types/customer';
import type { PaginatedOrders } from '../types/order';

export const customerService = {
  getCustomers(page: number = 1, pageSize: number = 10): Promise<CustomerList> {
    return request<CustomerList>(`/customers?page=${page}&page_size=${pageSize}`);
  },

  getCustomer(customerId: number): Promise<Customer> {
    return request<Customer>(`/customers/${customerId}`);
  },

  getCustomerOrders(customerId: number, page: number = 1, pageSize: number = 10): Promise<PaginatedOrders> {
    return request<PaginatedOrders>(`/customers/${customerId}/orders?page=${page}&page_size=${pageSize}`);
  },
};