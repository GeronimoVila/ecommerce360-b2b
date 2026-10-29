import { apiClient } from './apiClient';

export interface Supplier {
  id: string;
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
}

export const SupplierService = {
  getAll: async (): Promise<Supplier[]> => {
    const response = await apiClient.get('suppliers');
    return response.data;
  },

  create: async (data: Omit<Supplier, 'id'>): Promise<Supplier> => {
    const response = await apiClient.post('suppliers', data);
    return response.data;
  }
};