export interface GroupedCommission {
  seller_id: string;
  seller_name: string;
  cbu_alias: string;
  total_amount: number;
  count: number;
  commission_ids: string[];
}

export interface LiquidatePayload {
  seller_id: string;
  transaction_ref: string;
  commission_ids: string[];
}

export interface PayoutHistory {
  id: string;
  seller_id: string;
  seller_name: string;
  total_amount: number;
  transaction_ref: string;
  status: string;
  created_at: string;
}