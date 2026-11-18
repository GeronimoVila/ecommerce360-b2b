import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  Landmark,
  Receipt,
  Filter,
} from 'lucide-react';
import { CommissionService } from '../../../services/commission.service';
import type {
  CommissionStatus,
  MyCommissionSummary,
  MyCommissionItem,
  MyPayoutItem,
} from '../../../types/commission';

type TabKey = 'COMMISSIONS' | 'PAYOUTS';
type StatusFilter = 'ALL' | CommissionStatus;

const STATUS_BADGES: Record<
  CommissionStatus,
  { label: string; className: string }
> = {
  AVAILABLE: {
    label: 'Disponible para cobro',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  PENDING_CLEARANCE: {
    label: 'Por acreditar',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  LIQUIDATED: {
    label: 'Liquidada',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  CANCELED: {
    label: 'Cancelada',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

const FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Todas' },
  { value: 'AVAILABLE', label: 'Disponibles' },
  { value: 'PENDING_CLEARANCE', label: 'Por acreditar' },
  { value: 'LIQUIDATED', label: 'Liquidadas' },
  { value: 'CANCELED', label: 'Canceladas' },
];

export default function SellerCommissionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('COMMISSIONS');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const [summary, setSummary] = useState<MyCommissionSummary | null>(null);
  const [commissions, setCommissions] = useState<MyCommissionItem[]>([]);
  const [payouts, setPayouts] = useState<MyPayoutItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [commissionsRes, payoutsRes] = await Promise.all([
        CommissionService.getMyCommissions(),
        CommissionService.getMyPayouts(),
      ]);

      setSummary(commissionsRes.summary);
      setCommissions(commissionsRes.commissions);
      setPayouts(payoutsRes);
    } catch (err: any) {
      console.error('[SellerCommissions] Error cargando comisiones:', err);
      setError(
        err?.response?.data?.error ||
          'No se pudo cargar la información de tus comisiones.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleFilterChange = async (nextFilter: StatusFilter) => {
    if (nextFilter === statusFilter) return;
    setStatusFilter(nextFilter);

    try {
      setFiltering(true);
      setError(null);
      const res = await CommissionService.getMyCommissions(
        nextFilter === 'ALL' ? undefined : nextFilter
      );
      setSummary(res.summary);
      setCommissions(res.commissions);
    } catch (err: any) {
      setError(
        err?.response?.data?.error || 'Error al filtrar las comisiones.'
      );
    } finally {
      setFiltering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex justify-center bg-[#F8FAFC] min-h-screen items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]" />
      </div>
    );
  }

  const availableBalance = summary?.available_balance ?? 0;
  const pendingBalance = summary?.pending_clearance_balance ?? 0;
  const liquidatedTotal = summary?.liquidated_total ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Mis Comisiones
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Estado de tu saldo disponible, Por acreditar e historial de pagos recibidos.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-[#5B50D6]">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CBU / Alias de Cobro
            </p>
            {summary?.cbu_alias ? (
              <p className="text-sm font-mono font-bold text-slate-800">
                {summary.cbu_alias}
              </p>
            ) : (
              <Link
                to="/portal/profile"
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                Configurar alias ahora <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {!summary?.cbu_alias && !error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Aún no registraste un <strong>CBU o Alias</strong>. Administración lo necesita para transferirte tu saldo disponible.
            </span>
          </div>
          <Link
            to="/portal/profile"
            className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            Ir a Mi Perfil
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-[#1A1D27] rounded-2xl p-6 md:p-8 text-white shadow-lg grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border-b md:border-b-0 md:border-r border-slate-700/80 pb-5 md:pb-0 md:pr-6">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Wallet className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Disponible para Liquidar
            </span>
          </div>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl lg:text-4xl font-black text-emerald-400 font-mono">
              ${availableBalance.toLocaleString('es-AR')}
            </h2>
            <span className="text-emerald-400/80 font-bold mb-1 text-xs">ARS</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {summary?.counts.available ?? 0}{' '}
            {summary?.counts.available === 1 ? 'comisión lista' : 'comisiones listas'} para transferencia
          </p>
        </div>

        <div className="border-b md:border-b-0 md:border-r border-slate-700/80 pb-5 md:pb-0 md:px-4">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Por acreditar
            </span>
          </div>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl lg:text-4xl font-black text-amber-300 font-mono">
              ${pendingBalance.toLocaleString('es-AR')}
            </h2>
            <span className="text-amber-300/80 font-bold mb-1 text-xs">ARS</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {summary?.counts.pending_clearance ?? 0}{' '}
            {summary?.counts.pending_clearance === 1 ? 'operación' : 'operaciones'} en ventana de garantía
          </p>
        </div>

        <div className="md:pl-4">
          <div className="flex items-center gap-2 text-[#8b84e6] mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Cobrado Histórico
            </span>
          </div>
          <div className="flex items-end gap-2">
            <h2 className="text-3xl lg:text-4xl font-black text-white font-mono">
              ${liquidatedTotal.toLocaleString('es-AR')}
            </h2>
            <span className="text-slate-400 font-bold mb-1 text-xs">ARS</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {summary?.counts.liquidated ?? 0}{' '}
            {summary?.counts.liquidated === 1 ? 'comisión liquidada' : 'comisiones liquidadas'} en {payouts.length}{' '}
            {payouts.length === 1 ? 'pago' : 'pagos'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('COMMISSIONS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'COMMISSIONS'
                ? 'bg-[#5B50D6] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Detalle de Comisiones
          </button>

          <button
            onClick={() => setActiveTab('PAYOUTS')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'PAYOUTS'
                ? 'bg-[#5B50D6] text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Historial de Liquidaciones ({payouts.length})
          </button>
        </div>

        {activeTab === 'COMMISSIONS' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 mr-1 hidden sm:inline" />
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                disabled={filtering}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'COMMISSIONS' && (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Movimientos Generados por Ventas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cada comisión pasa por un período antes de habilitarse para transferencia.
              </p>
            </div>
            {filtering && (
              <span className="text-xs font-semibold text-[#5B50D6] animate-pulse">
                Actualizando...
              </span>
            )}
          </div>

          {commissions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50/50">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                No hay comisiones registradas con este filtro.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Comparte tu enlace de referido desde Inicio para comenzar a generar comisiones.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4 md:p-5">Orden / Fecha</th>
                    <th className="p-4 md:p-5">Detalle de Venta</th>
                    <th className="p-4 md:p-5">Estado</th>
                    <th className="p-4 md:p-5">Fecha Liberación / Pago</th>
                    <th className="p-4 md:p-5 text-right">Tu Comisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {commissions.map((item) => {
                    const badge = STATUS_BADGES[item.status];
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="p-4 md:p-5">
                          <div className="font-mono font-bold text-slate-900">
                            #ORD-{item.order_id.substring(0, 6).toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {new Date(item.order_date).toLocaleDateString('es-AR')}
                          </div>
                        </td>

                        <td className="p-4 md:p-5 max-w-xs">
                          <div className="font-semibold text-slate-800 text-xs">
                            {item.customer_name} • Ticket ${item.order_total.toLocaleString('es-AR')}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1" title={item.items_summary}>
                            {item.items_summary}
                          </div>
                        </td>

                        <td className="p-4 md:p-5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="p-4 md:p-5 text-xs text-slate-600">
                          {item.clearing_date ? (
                            <div>
                              <span className="font-medium">
                                {new Date(item.clearing_date).toLocaleDateString('es-AR')}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {item.status === 'PENDING_CLEARANCE'
                                  ? 'Liberación estimada'
                                  : item.status === 'LIQUIDATED'
                                  ? 'Fecha de liquidación'
                                  : 'Acreditada en saldo'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="p-4 md:p-5 text-right">
                          <span
                            className={`font-mono font-extrabold text-base ${
                              item.status === 'CANCELED'
                                ? 'text-slate-400 line-through'
                                : item.status === 'AVAILABLE'
                                ? 'text-emerald-600'
                                : 'text-slate-900'
                            }`}
                          >
                            ${item.amount.toLocaleString('es-AR')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'PAYOUTS' && (
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              Historial de Transferencias Recibidas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprobantes de liquidaciones ejecutadas por administración hacia tu cuenta registrada.
            </p>
          </div>

          {payouts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50/50">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Aún no tienes liquidaciones abonadas.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Cuando administración liquide tu saldo disponible, verás aquí el comprobante y monto transferido.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4 md:p-5">Fecha de Pago</th>
                    <th className="p-4 md:p-5">Referencia / Comprobante</th>
                    <th className="p-4 md:p-5">Comisiones Incluidas</th>
                    <th className="p-4 md:p-5">Estado</th>
                    <th className="p-4 md:p-5 text-right">Monto Transferido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {payouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="p-4 md:p-5">
                        <div className="font-semibold text-slate-900">
                          {new Date(payout.created_at).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(payout.created_at).toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      <td className="p-4 md:p-5">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                          {payout.transaction_ref}
                        </span>
                      </td>

                      <td className="p-4 md:p-5 text-xs text-slate-600 font-medium">
                        {payout.commissions_count}{' '}
                        {payout.commissions_count === 1
                          ? 'operación liquidada'
                          : 'operaciones liquidadas'}
                      </td>

                      <td className="p-4 md:p-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {payout.status === 'COMPLETED' ? 'Acreditado' : payout.status}
                        </span>
                      </td>

                      <td className="p-4 md:p-5 text-right">
                        <span className="font-mono font-extrabold text-base text-emerald-600">
                          ${payout.total_amount.toLocaleString('es-AR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}