import { apiClient } from './apiClient';
import type { Product, ProductFormData } from '../types/product';

const BASE_PATH = 'products';

export const ProductService = {
  getAll: async (type?: 'simple' | 'combo'): Promise<Product[]> => {
    const query = type ? `?type=${type}` : '';
    const response = await apiClient.get(`${BASE_PATH}/admin${query}`);
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

  createCombo: async (data: {
    sku: string;
    name: string;
    base_price: number;
    commission_rate: number;
    parts: { sku: string; quantity: number }[]
  }): Promise<Product> => {
    const response = await apiClient.post(`${BASE_PATH}/combos`, data);
    return response.data.combo;
  },

  updateCombo: async (id: string, data: {
    sku: string;
    name: string;
    base_price: number;
    commission_rate: number;
    parts: { sku: string; quantity: number }[]
  }): Promise<Product> => {
    const response = await apiClient.patch(`${BASE_PATH}/combos/${id}`, data);
    return response.data.combo;
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