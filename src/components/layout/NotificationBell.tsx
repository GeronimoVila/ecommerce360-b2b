import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Wallet,
  AlertTriangle,
  PackageX,
  TrendingUp,
  BadgeDollarSign,
  RotateCcw,
  Truck,
  Info,
  X,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuthStore } from '../../store/authStore';
import type { AppNotification, NotificationType } from '../../types/notification';

const NOTIFICATION_ICONS: Record<
  NotificationType,
  { icon: typeof Bell; wrapperClass: string }
> = {
  PAYOUT_REQUESTED: {
    icon: Wallet,
    wrapperClass: 'bg-indigo-50 text-[#5B50D6] border-indigo-100',
  },
  CRITICAL_STOCK_SHORTAGE: {
    icon: PackageX,
    wrapperClass: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  INTEGRATION_FAILURE: {
    icon: AlertTriangle,
    wrapperClass: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  COMMISSION_EARNED: {
    icon: TrendingUp,
    wrapperClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  COMMISSION_RELEASED: {
    icon: BadgeDollarSign,
    wrapperClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  PAYOUT_PROCESSED: {
    icon: Wallet,
    wrapperClass: 'bg-indigo-50 text-[#5B50D6] border-indigo-100',
  },
  COMMISSION_REVERSED: {
    icon: RotateCcw,
    wrapperClass: 'bg-rose-50 text-rose-600 border-rose-200',
  },
  PAYMENT_ACTION_REQUIRED: {
    icon: AlertTriangle,
    wrapperClass: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  ORDER_OUT_FOR_DELIVERY: {
    icon: Truck,
    wrapperClass: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  SHIPPING_ISSUE: {
    icon: AlertTriangle,
    wrapperClass: 'bg-rose-50 text-rose-600 border-rose-200',
  },
};

function resolveNotificationRoute(
  notification: AppNotification,
  role?: 'ADMIN' | 'SELLER'
): string | null {
  if (role === 'ADMIN') {
    switch (notification.type) {
      case 'PAYOUT_REQUESTED':
        return '/admin/commissions';
      case 'CRITICAL_STOCK_SHORTAGE':
        return '/admin/catalog';
      case 'INTEGRATION_FAILURE':
        return '/admin/financial/rules';
      default:
        break;
    }
  }

  if (role === 'SELLER') {
    switch (notification.type) {
      case 'COMMISSION_EARNED':
      case 'COMMISSION_RELEASED':
      case 'PAYOUT_PROCESSED':
      case 'COMMISSION_REVERSED':
        return '/portal/commissions';
      default:
        break;
    }
  }

  return notification.action_url;
}

function formatRelativeTime(isoDate: string): string {
  const diffSec = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diffSec < 60) return 'Hace un momento';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  return new Date(isoDate).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
}

interface NotificationBellProps {
  variant?: 'light' | 'dark';
}

export const NotificationBell = ({ variant = 'light' }: NotificationBellProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = async (notification: AppNotification) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);

    const targetRoute = resolveNotificationRoute(notification, user?.role);
    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  const visibleNotifications = filterUnread
    ? notifications.filter((n) => !n.read_at)
    : notifications;

  const buttonClasses =
    variant === 'dark'
      ? 'text-slate-300 hover:text-white bg-slate-800/70 border-slate-700/60'
      : 'text-slate-600 hover:text-slate-900 bg-white border-slate-200 hover:bg-slate-50 shadow-sm';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2.5 rounded-xl border transition-all ${buttonClasses}`}
        aria-label="Notificaciones"
        title={isConnected ? 'Notificaciones en tiempo real activas' : 'Notificaciones'}
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        <span
          className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 md:inset-x-auto md:absolute md:right-0 md:top-12 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[80vh]">
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-[#5B50D6]">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-[#5B50D6] hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Leer todas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="md:hidden text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 bg-white">
            <button
              type="button"
              onClick={() => setFilterUnread(false)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                !filterUnread
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFilterUnread(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterUnread
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              No leídas ({unreadCount})
            </button>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#5B50D6]" />
              </div>
            ) : visibleNotifications.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">
                  {filterUnread
                    ? 'No tienes notificaciones pendientes de lectura.'
                    : 'Aún no tienes notificaciones.'}
                </p>
              </div>
            ) : (
              visibleNotifications.map((item) => {
                const visual = NOTIFICATION_ICONS[item.type] || {
                  icon: Info,
                  wrapperClass: 'bg-slate-100 text-slate-600 border-slate-200',
                };
                const IconComponent = visual.icon;
                const isUnread = !item.read_at;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 hover:bg-slate-50 ${
                      isUnread ? 'bg-indigo-50/35' : 'bg-white'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${visual.wrapperClass}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs leading-snug ${
                            isUnread
                              ? 'font-extrabold text-slate-900'
                              : 'font-semibold text-slate-700'
                          }`}
                        >
                          {item.title}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#5B50D6] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-1.5">
                        {formatRelativeTime(item.created_at)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};