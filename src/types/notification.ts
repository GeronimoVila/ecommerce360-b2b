export type NotificationType =
  | 'PAYOUT_REQUESTED'
  | 'CRITICAL_STOCK_SHORTAGE'
  | 'INTEGRATION_FAILURE'
  | 'COMMISSION_EARNED'
  | 'COMMISSION_RELEASED'
  | 'PAYOUT_PROCESSED'
  | 'COMMISSION_REVERSED'
  | 'PAYMENT_ACTION_REQUIRED'
  | 'ORDER_OUT_FOR_DELIVERY'
  | 'SHIPPING_ISSUE';

export interface AppNotification {
  id: string;
  user_id: string;
  role: 'ADMIN' | 'SELLER' | 'CUSTOMER';
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsListResponse {
  success: boolean;
  data: AppNotification[];
  unread_count: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}