import { apiClient } from './apiClient';
import type { GroupedCommission, LiquidatePayload, PayoutHistory } from '../types/commission';

export const CommissionService = {
  getAvailable: async (): Promise<GroupedCommission[]> => {
    const response = await apiClient.get('/commissions/available');
    return response.data.data;
  },

  liquidate: async (payload: LiquidatePayload): Promise<any> => {
    const response = await apiClient.post('/commissions/liquidate', payload);
    return response.data;
  },

  getPayouts: async (): Promise<PayoutHistory[]> => {
    const response = await apiClient.get('/commissions/payouts');
    return response.data.data;
  }
};