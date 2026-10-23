import { apiClient } from './apiClient';
import type { Product, ProductFormData } from '../types/product';

const BASE_PATH = 'products';

export const ProductService = {
  getAll: async (): Promise<Product[]> => {
    const response = await apiClient.get(`${BASE_PATH}/admin`);
    return response.data.data; 
  },
  
  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`${BASE_PATH}/${id}`);
    return response.data;
  },

  create: async (data: ProductFormData): Promise<Product> => {
    const response = await apiClient.post(BASE_PATH, data);
    return response.data.product;
  },

  update: async (id: string, data: Partial<ProductFormData>): Promise<Product> => {
    const response = await apiClient.patch(`${BASE_PATH}/${id}`, data);
    return response.data.product;
  },

  toggleStatus: async (id: string, isActive: boolean): Promise<void> => {
    if (isActive) {
      await apiClient.delete(`${BASE_PATH}/${id}`);
    } else {
      await apiClient.patch(`${BASE_PATH}/${id}/restore`);
    }
  }
};