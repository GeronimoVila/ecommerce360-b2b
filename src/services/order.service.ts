import { apiClient } from './apiClient';
import type {
  ManageableOrdersQuery,
  ManageableOrdersResponse,
  OrderStatus,
} from '../types/order';

export const OrderService = {
  getManageableOrders: async (
    params: ManageableOrdersQuery = {}
  ): Promise<ManageableOrdersResponse> => {
    const cleanParams: Record<string, string | number> = {};

    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.status) cleanParams.status = params.status;
    if (params.attribution && params.attribution !== 'ALL') {
      cleanParams.attribution = params.attribution;
    }
    if (params.seller_id) cleanParams.seller_id = params.seller_id;
    if (params.search && params.search.trim() !== '') {
      cleanParams.search = params.search.trim();
    }

    const response = await apiClient.get<ManageableOrdersResponse>('orders/manage', {
      params: cleanParams,
    });
    return response.data;
  },

  updateOrderStatus: async (
    orderId: string,
    status: OrderStatus
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      status: OrderStatus;
      allowed_next_statuses: OrderStatus[];
    };
  }> => {
    const response = await apiClient.patch(`orders/${orderId}/status`, { status });
    return response.data;
  },

  reportShippingIssue: async (
    orderId: string,
    reason: string
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`orders/${orderId}/shipping-issue`, { reason });
    return response.data;
  },
};