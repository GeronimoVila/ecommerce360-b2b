export type OrderStatus = 'PENDING' | 'BUDGET' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';
export type OrderAttributionType = 'SELLER' | 'DIRECT';
export type PaymentMethod = 'MP' | 'MOBBEX' | 'TRANSFERENCIA';

export interface ManageableOrderItem {
  id: string;
  product_id: string | null;
  sku: string;
  name: string;
  is_combo: boolean;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ManageableOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  allowed_next_statuses: OrderStatus[];
  total_amount: number;
  discount_amount: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  shipping_cp: string | null;
  shipping_address: Record<string, any> | string | null;
  created_at: string;
  updated_at: string;
  attribution_type: OrderAttributionType;
  seller: {
    id: string;
    name: string;
    ref_code: string;
    email: string | null;
  } | null;
  customer: {
    id: string | null;
    name: string;
    email: string | null;
    phone: string | null;
  };
  commission: {
    id: string;
    amount: number;
    status: 'PENDING_CLEARANCE' | 'AVAILABLE' | 'LIQUIDATED' | 'CANCELED';
  } | null;
  items: ManageableOrderItem[];
}

export interface ManageableOrdersQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus | '';
  attribution?: 'ALL' | 'SELLER' | 'DIRECT';
  seller_id?: string;
  search?: string;
}

export interface ManageableOrdersResponse {
  success: boolean;
  data: ManageableOrder[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}