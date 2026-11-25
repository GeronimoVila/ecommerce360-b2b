import { apiClient } from './apiClient';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number | string;
  min_purchase_amount?: number | string | null;
  max_uses?: number | null;
  used_count: number;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponPayload {
  code: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount?: number | null;
  max_uses?: number | null;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
}

export const CouponService = {
  getAll: async (): Promise<Coupon[]> => {
    const response = await apiClient.get('coupons');
    return response.data.data;
  },

  create: async (payload: CouponPayload): Promise<Coupon> => {
    const response = await apiClient.post('coupons', payload);
    return response.data.coupon;
  },

  update: async (id: string, payload: Partial<CouponPayload>): Promise<Coupon> => {
    const response = await apiClient.patch(`coupons/${id}`, payload);
    return response.data.coupon;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`coupons/${id}`);
  },
};