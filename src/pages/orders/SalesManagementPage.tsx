import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Search,
  RotateCcw,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  Store,
  UserCheck,
  AlertCircle,
  AlertTriangle,
  X,
  XCircle,
  Package,
  MapPin,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { OrderService } from '../../services/order.service';
import { UserService } from '../../services/user.service';
import type { ManageableOrder, OrderStatus } from '../../types/order';

const STATUS_META: Record<
  OrderStatus,
  {
    label: string;
    actionLabel: string;
    badgeClass: string;
    dotClass: string;
    buttonClass: string;
  }
> = {
  PENDING: {
    label: 'Pendiente de Pago',
    actionLabel: 'Marcar Pendiente',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    buttonClass: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
  BUDGET: {
    label: 'Presupuesto',
    actionLabel: 'Pasar a Presupuesto',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500',
    buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  PAID: {
    label: 'Pagada (A preparar)',
    actionLabel: 'Volver a Pagada',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
    buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  SHIPPED: {
    label: 'Enviada',
    actionLabel: 'Enviada',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  DELIVERED: {
    label: 'Entregada',
    actionLabel: 'Entregada',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  CANCELED: {
    label: 'Cancelada',
    actionLabel: 'Cancelar',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
    buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
};

const PAYMENT_LABELS: Record<string, string> = {
  MP: 'Mercado Pago',
  MOBBEX: 'Mobbex',
  TRANSFERENCIA: 'Transferencia',
};

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING_CLEARANCE: 'En maduración',
  AVAILABLE: 'Disponible',
  LIQUIDATED: 'Liquidada',
  CANCELED: 'Cancelada',
};

export const SalesManagementPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [orders, setOrders] = useState<ManageableOrder[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [pendingStatusChange, setPendingStatusChange] = useState<{
    order: ManageableOrder;
    nextStatus: OrderStatus;
  } | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [attributionFilter, setAttributionFilter] = useState<'ALL' | 'SELLER' | 'DIRECT'>('ALL');
  const [selectedSellerId, setSelectedSellerId] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 15;

  const [selectedOrder, setSelectedOrder] = useState<ManageableOrder | null>(null);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueReason, setIssueReason] = useState('');
  const [isReportingIssue, setIsReportingIssue] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!isAdmin) return;
    UserService.getSellers()
      .then((data) => setSellers(Array.isArray(data) ? data : []))
      .catch((err) => console.error('[SalesManagementPage] Error cargando vendedores:', err));
  }, [isAdmin]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await OrderService.getManageableOrders({
        page,
        limit,
        status: statusFilter,
        attribution: isAdmin ? attributionFilter : 'ALL',
        seller_id: isAdmin ? selectedSellerId : undefined,
        search: debouncedSearch,
      });

      setOrders(Array.isArray(response?.data) ? response.data : []);
      setTotalPages(response?.meta?.totalPages || 1);
      setTotalCount(response?.meta?.total || 0);
    } catch (error: any) {
      console.error('[SalesManagementPage] Error cargando órdenes:', error);
      setErrorMsg(error.response?.data?.error || 'No se pudieron cargar las ventas.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, attributionFilter, selectedSellerId, debouncedSearch, isAdmin]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const openStatusConfirmModal = (order: ManageableOrder, nextStatus: OrderStatus) => {
    if (nextStatus === order.status) return;
    if (!STATUS_META[nextStatus]) return;
    setPendingStatusChange({ order, nextStatus });
  };

  const cancelStatusChange = () => {
    if (updatingOrderId) return;
    setPendingStatusChange(null);
    toast.info('Cambio de estado cancelado.');
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    const { order, nextStatus } = pendingStatusChange;
    const targetMeta = STATUS_META[nextStatus];

    setUpdatingOrderId(order.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await OrderService.updateOrderStatus(order.id, nextStatus);

      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id
            ? {
                ...item,
                status: res.data.status,
                allowed_next_statuses: res.data.allowed_next_statuses || [],
              }
            : item
        )
      );

      if (selectedOrder?.id === order.id) {
        setSelectedOrder((prev) =>
          prev
            ? {
                ...prev,
                status: res.data.status,
                allowed_next_statuses: res.data.allowed_next_statuses || [],
              }
            : null
        );
      }

      setPendingStatusChange(null);
      toast.success(`Orden #ORD-${order.order_number} ${targetMeta.label}.`);
    } catch (error: any) {
      console.error('[SalesManagementPage] Error actualizando estado:', error);
      const msg = error.response?.data?.error || 'No se pudo actualizar el estado de la orden.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSubmitShippingIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!issueReason.trim()) {
      toast.warning('Debes ingresar el motivo de la incidencia.');
      return;
    }

    try {
      setIsReportingIssue(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await OrderService.reportShippingIssue(selectedOrder.id, issueReason.trim());
      setSuccessMsg(res.message);
      toast.success(res.message);
      setIssueReason('');
      setIsIssueModalOpen(false);
    } catch (error: any) {
      const msg =
        error.response?.data?.error || 'No se pudo registrar la incidencia logística.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsReportingIssue(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatusFilter('');
    setAttributionFilter('ALL');
    setSelectedSellerId('');
    setPage(1);
  };

  const hasActiveFilters =
    searchInput.trim() !== '' ||
    statusFilter !== '' ||
    (isAdmin && (attributionFilter !== 'ALL' || selectedSellerId !== ''));

  const paidCount = orders.filter((o) => o.status === 'PAID').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const formatShippingAddress = (addr: ManageableOrder['shipping_address'], cp: string | null) => {
    if (!addr && !cp) return 'Retiro en local / Sin dirección especificada';
    if (typeof addr === 'string') return `${addr}${cp ? ` (CP ${cp})` : ''}`;
    if (typeof addr === 'object' && addr !== null) {
      const parts = [addr.street, addr.number, addr.city, addr.province].filter(Boolean);
      const formatted = parts.join(', ');
      return `${formatted || 'Dirección registrada'}${cp ? ` (CP ${cp})` : ''}`;
    }
    return cp ? `CP ${cp}` : 'Sin dirección';
  };

  const renderStatusIcon = (status: OrderStatus) => {
    if (status === 'SHIPPED') return <Truck className="w-3.5 h-3.5" />;
    if (status === 'DELIVERED') return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (status === 'CANCELED') return <XCircle className="w-3.5 h-3.5" />;
    return <RotateCcw className="w-3.5 h-3.5" />;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B50D6] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              {isAdmin ? 'Gestión Global de Ventas' : 'Mis Ventas y Entregas'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isAdmin
                ? 'Monitoreo de todas las órdenes, origen de atribución (vendedor vs. tienda directa) y estados logísticos.'
                : 'Consulta tus operaciones confirmadas y márcalas como enviadas o entregadas directamente.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Operaciones
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalCount}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
              A Preparar
            </p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{paidCount}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Enviadas
            </p>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{shippedCount}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Entregadas
            </p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{deliveredCount}</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              isAdmin
                ? 'Buscar por cliente, email, vendedor, SKU o producto...'
                : 'Buscar por cliente, email, SKU o producto...'
            }
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sales-status-filter" className="text-xs font-semibold text-slate-500">
            Estado:
          </label>
          <select
            id="sales-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | '');
              setPage(1);
            }}
            className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none shadow-sm cursor-pointer"
          >
            <option value="">Todas confirmadas</option>
            <option value="PAID">Pagada (A preparar)</option>
            <option value="SHIPPED">Enviada</option>
            <option value="DELIVERED">Entregada</option>
            {isAdmin && <option value="PENDING">Pendiente de Pago</option>}
            {isAdmin && <option value="BUDGET">Presupuesto</option>}
            {isAdmin && <option value="CANCELED">Cancelada</option>}
          </select>
        </div>

        {isAdmin && (
          <>
            <div className="flex items-center gap-2">
              <label htmlFor="sales-origin-filter" className="text-xs font-semibold text-slate-500">
                Origen:
              </label>
              <select
                id="sales-origin-filter"
                value={attributionFilter}
                onChange={(e) => {
                  const val = e.target.value as 'ALL' | 'SELLER' | 'DIRECT';
                  setAttributionFilter(val);
                  if (val === 'DIRECT') setSelectedSellerId('');
                  setPage(1);
                }}
                className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none shadow-sm cursor-pointer"
              >
                <option value="ALL">Todos los canales</option>
                <option value="SELLER">Con Vendedor</option>
                <option value="DIRECT">Tienda Directa (Sin vendedor)</option>
              </select>
            </div>

            {attributionFilter !== 'DIRECT' && (
              <div className="flex items-center gap-2">
                <label htmlFor="sales-seller-filter" className="text-xs font-semibold text-slate-500">
                  Vendedor:
                </label>
                <select
                  id="sales-seller-filter"
                  value={selectedSellerId}
                  onChange={(e) => {
                    setSelectedSellerId(e.target.value);
                    if (e.target.value) setAttributionFilter('SELLER');
                    setPage(1);
                  }}
                  className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none shadow-sm cursor-pointer max-w-52"
                >
                  <option value="">Todos los vendedores</option>
                  {sellers
                    .filter((s) => s.seller_profile?.id)
                    .map((s) => (
                      <option key={s.seller_profile.id} value={s.seller_profile.id}>
                        {s.seller_profile.first_name} {s.seller_profile.last_name} (
                        {s.seller_profile.ref_code})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={handleResetFilters}
          disabled={!hasActiveFilters}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" /> Limpiar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-14 text-center text-slate-400 flex flex-col items-center gap-2">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">
              No se encontraron ventas con los criterios actuales
            </p>
            <p className="text-xs text-slate-400">
              {hasActiveFilters
                ? 'Intenta limpiar los filtros para ver el historial completo.'
                : 'Las órdenes confirmadas aparecerán aquí automáticamente.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Orden / Fecha</th>
                  <th className="py-4 px-5">Cliente</th>
                  {isAdmin && <th className="py-4 px-5">Origen / Vendedor</th>}
                  <th className="py-4 px-5">Productos</th>
                  <th className="py-4 px-5">Total</th>
                  <th className="py-4 px-5">Estado Actual</th>
                  <th className="py-4 px-5 text-right">Marcar Estado / Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {orders.map((order) => {
                  const statusInfo = STATUS_META[order.status] || STATUS_META.PENDING;
                  const isUpdating = updatingOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          #ORD-{order.order_number}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-800">{order.customer?.name || 'Cliente'}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {order.customer?.email || order.customer?.phone || 'Sin contacto'}
                        </div>
                      </td>

                      {isAdmin && (
                        <td className="py-4 px-5">
                          {order.attribution_type === 'SELLER' && order.seller ? (
                            <div className="inline-flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-[#5B50D6] border border-indigo-100">
                                <UserCheck className="w-3.5 h-3.5" />
                                {order.seller.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 pl-1">
                                REF: {order.seller.ref_code}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <Store className="w-3.5 h-3.5 text-slate-500" />
                              Tienda Directa
                            </span>
                          )}
                        </td>
                      )}

                      <td className="py-4 px-5">
                        <div className="text-xs font-semibold text-slate-700">
                          {order.items.length === 1
                            ? `${order.items[0].quantity}x ${order.items[0].name}`
                            : `${order.items.reduce((acc, i) => acc + i.quantity, 0)} unidades (${
                                order.items.length
                              } ítems)`}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {order.items[0]?.sku}
                          {order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-mono font-extrabold text-slate-900">
                          ${order.total_amount.toLocaleString('es-AR')}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                        </div>
                      </td>

                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusInfo.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {(order.allowed_next_statuses || []).map((nextStatus) => {
                            const nextMeta = STATUS_META[nextStatus];
                            if (!nextMeta) return null;
                            return (
                              <button
                                key={nextStatus}
                                type="button"
                                disabled={isUpdating}
                                onClick={() => openStatusConfirmModal(order, nextStatus)}
                                title={
                                  order.status === 'PAID' && nextStatus === 'DELIVERED'
                                    ? 'Marcar como entregada directamente (sin envío)'
                                    : `Cambiar estado a ${nextMeta.label}`
                                }
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 ${nextMeta.buttonClass}`}
                              >
                                {renderStatusIcon(nextStatus)}
                                <span>{isUpdating ? '...' : nextMeta.actionLabel}</span>
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 text-slate-500 hover:text-[#5B50D6] hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors"
                            title="Ver detalle completo de la orden"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
            <span className="text-xs text-slate-500 font-medium">
              Página <strong className="text-slate-900">{page}</strong> de{' '}
              <strong className="text-slate-900">{totalPages}</strong> ({totalCount} ventas)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-extrabold text-slate-900 font-mono">
                    #ORD-{selectedOrder.order_number}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                      (STATUS_META[selectedOrder.status] || STATUS_META.PENDING).badgeClass
                    }`}
                  >
                    {(STATUS_META[selectedOrder.status] || STATUS_META.PENDING).label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registrada el {new Date(selectedOrder.created_at).toLocaleString('es-AR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Cliente
                  </p>
                  <p className="text-sm font-bold text-slate-900">{selectedOrder.customer?.name || 'Cliente'}</p>
                  {selectedOrder.customer?.email && (
                    <p className="text-xs text-slate-600">{selectedOrder.customer.email}</p>
                  )}
                  {selectedOrder.customer?.phone && (
                    <p className="text-xs text-slate-600 font-mono">
                      Tel: {selectedOrder.customer.phone}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Canal y Pago
                  </p>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {selectedOrder.attribution_type === 'SELLER' && selectedOrder.seller ? (
                      <>
                        <UserCheck className="w-4 h-4 text-[#5B50D6]" />
                        Vendedor: {selectedOrder.seller.name}
                      </>
                    ) : (
                      <>
                        <Store className="w-4 h-4 text-slate-500" />
                        Tienda Directa
                      </>
                    )}
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    {PAYMENT_LABELS[selectedOrder.payment_method] || selectedOrder.payment_method}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#5B50D6] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Destino de Entrega
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      {formatShippingAddress(
                        selectedOrder.shipping_address,
                        selectedOrder.shipping_cp
                      )}
                    </p>
                  </div>
                </div>

                {isAdmin && (selectedOrder.status === 'PAID' || selectedOrder.status === 'SHIPPED') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIssueReason('');
                      setIsIssueModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shrink-0"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Reportar Incidencia</span>
                  </button>
                )}
              </div>

              {selectedOrder.commission && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-[#5B50D6]" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Comisión Asociada</p>
                      <p className="text-[11px] text-slate-500">
                        Estado:{' '}
                        {COMMISSION_STATUS_LABELS[selectedOrder.commission.status] ||
                          selectedOrder.commission.status}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-extrabold text-[#5B50D6] text-base">
                    ${selectedOrder.commission.amount.toLocaleString('es-AR')}
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> Artículos ({selectedOrder.items.length})
                </h3>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 flex items-center justify-between gap-3 bg-white"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                          <p className="text-xs font-mono text-slate-400">
                            SKU: {item.sku} · {item.quantity} x $
                            {item.unit_price.toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-sm shrink-0">
                        ${item.subtotal.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col items-end space-y-1 text-sm">
                {selectedOrder.discount_amount > 0 && (
                  <p className="text-xs text-emerald-600 font-semibold">
                    Descuento aplicado ({selectedOrder.coupon_code || 'Cupón'}): -$
                    {selectedOrder.discount_amount.toLocaleString('es-AR')}
                  </p>
                )}
                <p className="text-lg font-black text-slate-900 font-mono">
                  Total: ${selectedOrder.total_amount.toLocaleString('es-AR')} ARS
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cerrar
              </button>

              {(selectedOrder.allowed_next_statuses || []).length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 mr-1">
                    Cambiar estado a:
                  </span>
                  {(selectedOrder.allowed_next_statuses || []).map((nextStatus) => {
                    const nextMeta = STATUS_META[nextStatus];
                    if (!nextMeta) return null;
                    const isUpdating = updatingOrderId === selectedOrder.id;
                    return (
                      <button
                        key={nextStatus}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => openStatusConfirmModal(selectedOrder, nextStatus)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50 ${nextMeta.buttonClass}`}
                      >
                        {renderStatusIcon(nextStatus)}
                        <span>
                          {isUpdating
                            ? 'Guardando...'
                            : selectedOrder.status === 'PAID' && nextStatus === 'DELIVERED'
                            ? 'Entregada (Retiro directo)'
                            : `Marcar ${nextMeta.actionLabel}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isIssueModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmitShippingIssue}
            noValidate
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-rose-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-extrabold">
                  Incidencia Logística #ORD-{selectedOrder.order_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Este aviso quedará registrado en el historial de la orden y enviará una notificación inmediata al cliente (<strong>{selectedOrder.customer?.name || 'Cliente'}</strong>) en su portal de compras.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Motivo de la incidencia *
                </label>
                <textarea
                  rows={3}
                  required
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  placeholder="Ej: Domicilio cerrado en primer intento de visita. Se reprograma entrega para mañana."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isReportingIssue || !issueReason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-50"
              >
                {isReportingIssue ? 'Enviando aviso...' : 'Notificar al Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {pendingStatusChange && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div
              className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${
                pendingStatusChange.nextStatus === 'CANCELED'
                  ? 'bg-rose-50/70'
                  : 'bg-slate-50/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    pendingStatusChange.nextStatus === 'CANCELED'
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-indigo-50 text-[#5B50D6]'
                  }`}
                >
                  {pendingStatusChange.nextStatus === 'CANCELED' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    renderStatusIcon(pendingStatusChange.nextStatus)
                  )}
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Confirmar Cambio de Estado
                </h3>
              </div>
              <button
                type="button"
                onClick={cancelStatusChange}
                disabled={updatingOrderId !== null}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-2.5">
              <p className="text-sm text-slate-700 leading-relaxed">
                ¿Confirmas cambiar el estado de la orden{' '}
                <strong className="font-mono text-slate-900">
                  #ORD-{pendingStatusChange.order.order_number}
                </strong>{' '}
                a{' '}
                <strong className="text-slate-900">
                  "{STATUS_META[pendingStatusChange.nextStatus].label}"
                </strong>
                ?
              </p>

              {pendingStatusChange.nextStatus === 'CANCELED' && (
                <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  Se repondrá automáticamente el stock de los productos y se revertirá la comisión asociada si corresponde.
                </p>
              )}

              {pendingStatusChange.order.status === 'PAID' &&
                pendingStatusChange.nextStatus === 'DELIVERED' && (
                  <p className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    Entrega directa / retiro en local sin paso intermedio de envío.
                  </p>
                )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelStatusChange}
                disabled={updatingOrderId !== null}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmStatusChange}
                disabled={updatingOrderId !== null}
                className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm disabled:opacity-50 ${
                  STATUS_META[pendingStatusChange.nextStatus].buttonClass
                }`}
              >
                {updatingOrderId !== null
                  ? 'Guardando...'
                  : `Confirmar (${STATUS_META[pendingStatusChange.nextStatus].actionLabel})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};