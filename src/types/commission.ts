export type CommissionStatus =
  | 'PENDING_CLEARANCE'
  | 'AVAILABLE'
  | 'LIQUIDATED'
  | 'CANCELED';

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

export interface MyCommissionSummary {
  seller_id: string;
  seller_name: string;
  cbu_alias: string | null;
  available_balance: number;
  pending_clearance_balance: number;
  liquidated_total: number;
  counts: {
    available: number;
    pending_clearance: number;
    liquidated: number;
    canceled: number;
  };
}

export interface MyCommissionItem {
  id: string;
  order_id: string;
  order_date: string;
  order_total: number;
  order_status: string;
  customer_name: string;
  items_summary: string;
  amount: number;
  status: CommissionStatus;
  clearing_date: string | null;
  payout_id: string | null;
  created_at: string;
}

export interface MyCommissionsResponse {
  summary: MyCommissionSummary;
  commissions: MyCommissionItem[];
}

export interface MyPayoutItem {
  id: string;
  total_amount: number;
  transaction_ref: string;
  status: string;
  commissions_count: number;
  created_at: string;
}