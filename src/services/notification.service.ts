import { apiClient } from './apiClient';
import type { NotificationsListResponse } from '../types/notification';

export const NotificationService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsListResponse> => {
    const response = await apiClient.get<NotificationsListResponse>('notifications', {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        ...(params?.unreadOnly ? { unreadOnly: 'true' } : {}),
      },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ success: boolean; unread_count: number }>(
      'notifications/unread-count'
    );
    return response.data.unread_count ?? 0;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.patch(`notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('notifications/read-all');
  },

  getStreamUrl: (): string => {
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/').replace(
      /\/$/,
      ''
    );
    return `${baseUrl}/notifications/stream`;
  },
};