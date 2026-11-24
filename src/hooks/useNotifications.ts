import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationService } from '../services/notification.service';
import type { AppNotification } from '../types/notification';
import { useAuthStore } from '../store/authStore';

export function useNotifications() {
  const { isAuthenticated, user } = useAuthStore();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const retryTimeoutRef = useRef<number | null>(null);
  const retryAttemptRef = useRef<number>(0);

  const fetchInitial = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      setIsLoading(true);
      const res = await NotificationService.getAll({ page: 1, limit: 25 });
      setNotifications(res.data);
      setUnreadCount(res.unread_count);
    } catch (error) {
      console.error('[useNotifications] Error cargando bandeja inicial:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

    fetchInitial();

    let eventSource: EventSource | null = null;
    let isUnmounted = false;

    const connectSSE = () => {
      if (isUnmounted) return;

      const streamUrl = NotificationService.getStreamUrl();
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.onopen = () => {
        if (isUnmounted) return;
        setIsConnected(true);
        retryAttemptRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        if (isUnmounted || !event.data) return;
        try {
          const parsed = JSON.parse(event.data);

          if (parsed.type === 'CONNECTED' || parsed.type === 'PING') return;

          const incoming = parsed as AppNotification;
          if (!incoming.id) return;

          setNotifications((prev) => {
            if (prev.some((n) => n.id === incoming.id)) return prev;
            return [incoming, ...prev].slice(0, 50);
          });

          if (!incoming.read_at) {
            setUnreadCount((prev) => prev + 1);
          }
        } catch {
        }
      };

      eventSource.onerror = () => {
        if (isUnmounted) return;
        setIsConnected(false);
        eventSource?.close();

        const delay = Math.min(30000, 2000 * Math.pow(2, retryAttemptRef.current));
        retryAttemptRef.current += 1;

        retryTimeoutRef.current = window.setTimeout(() => {
          connectSSE();
        }, delay);
      };
    };

    connectSSE();

    return () => {
      isUnmounted = true;
      setIsConnected(false);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      eventSource?.close();
    };
  }, [isAuthenticated, user, fetchInitial]);

  const markAsRead = useCallback(async (notificationId: string) => {
    let wasUnread = false;

    setNotifications((prev) =>
      prev.map((item) => {
        if (item.id === notificationId && !item.read_at) {
          wasUnread = true;
          return { ...item, read_at: new Date().toISOString() };
        }
        return item;
      })
    );

    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await NotificationService.markAsRead(notificationId);
    } catch (error) {
      console.error('[useNotifications] Error marcando como leída:', error);
      fetchInitial();
    }
  }, [fetchInitial]);

  const markAllAsRead = useCallback(async () => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((item) => (item.read_at ? item : { ...item, read_at: nowIso }))
    );
    setUnreadCount(0);

    try {
      await NotificationService.markAllAsRead();
    } catch (error) {
      console.error('[useNotifications] Error marcando todas como leídas:', error);
      fetchInitial();
    }
  }, [fetchInitial]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    refresh: fetchInitial,
  };
}