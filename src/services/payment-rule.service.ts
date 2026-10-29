import { apiClient } from './apiClient';

export interface PaymentRule {
  id: string;
  payment_method: 'MP' | 'MOBBEX' | 'TRANSFERENCIA';
  installments: number;
  coefficient: number;
  is_global: boolean;
  category_id?: string | null;
  product_id?: string | null;
  is_active: boolean;
  category?: { name: string };
  product?: { sku: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface PaymentRulePayload {
  payment_method: 'MP' | 'MOBBEX' | 'TRANSFERENCIA';
  installments: number;
  coefficient: number;
  is_global: boolean;
  category_id?: string | null;
  product_id?: string | null;
}

const BASE_PATH = 'payment-rules';

export const PaymentRuleService = {
  getAll: async (): Promise<PaymentRule[]> => {
    const response = await apiClient.get(BASE_PATH);
    return response.data.data;
  },

  create: async (data: PaymentRulePayload): Promise<PaymentRule> => {
    const response = await apiClient.post(BASE_PATH, data);
    return response.data.data;
  },

  update: async (id: string, coefficient: number, is_active: boolean): Promise<PaymentRule> => {
    const response = await apiClient.patch(`${BASE_PATH}/${id}`, { coefficient, is_active });
    return response.data.data;
  },

  softDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  }
};