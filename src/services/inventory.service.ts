import { apiClient } from './apiClient';

const BASE_PATH = 'restock';

export interface RestockPayload {
  provider_name?: string;
  reference_document?: string;
  items: { sku: string; quantity: number }[];
}

export const InventoryService = {
  processRestock: async (data: RestockPayload): Promise<any> => {
    const response = await apiClient.post(BASE_PATH, data);
    return response.data;
  },

  getHistory: async (page = 1, limit = 20): Promise<any> => {
    const response = await apiClient.get(`${BASE_PATH}/all?page=${page}&limit=${limit}`);
    return response.data;
  }
};