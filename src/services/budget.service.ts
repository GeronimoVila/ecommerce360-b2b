import { apiClient } from './apiClient';

export interface BudgetCreateItem {
  productId: string;
  quantity: number;
}

export interface CreateBudgetPayload {
  items: BudgetCreateItem[];
  customerId?: string;
  paymentMethod?: 'MP' | 'MOBBEX' | 'TRANSFERENCIA';
}

export interface CreateBudgetResponse {
  success: boolean;
  message: string;
  budget: {
    id: string;
    total_amount: number;
    expires_at: string;
  };
}

export const BudgetService = {
  create: async (payload: CreateBudgetPayload): Promise<CreateBudgetResponse> => {
    const response = await apiClient.post('checkout/budget/create', payload);
    return response.data;
  }
};