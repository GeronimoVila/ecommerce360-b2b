import React, { useEffect, useState, useMemo } from 'react';
import { CommissionService } from '../../../services/commission.service';
import type { GroupedCommission, PayoutHistory } from '../../../types/commission';
import { LiquidateModal } from './LiquidateModal';
import {
  Landmark,
  Wallet,
  History,
  Search,
  Send,
  RotateCcw,
  X,
  ArrowUpDown,
  FilterX,
  AlertTriangle,
} from 'lucide-react';

type TabState = 'PENDING' | 'HISTORY';
type CbuReadinessFilter = 'ALL' | 'READY' | 'MISSING';
type PendingSortOption = 'AMOUNT_DESC' | 'AMOUNT_ASC' | 'COUNT_DESC' | 'NAME_ASC';
type PeriodFilter = 'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'LAST_90_DAYS';
type HistorySortOption = 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC';

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const normalizeText = (value?: string | null) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const hasValidCbu = (cbuAlias?: string | null) => {
  if (!cbuAlias) return false;
  const normalized = cbuAlias.trim().toLowerCase();
  return normalized !== '' && normalized !== 'no registrado';
};

export const CommissionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabState>('PENDING');

  const [commissions, setCommissions] = useState<GroupedCommission[]>([]);
  const [payouts, setPayouts] = useState<PayoutHistory[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedCommission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cbuFilter, setCbuFilter] = useState<CbuReadinessFilter>('ALL');
  const [pendingSort, setPendingSort] = useState<PendingSortOption>('AMOUNT_DESC');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [historySort, setHistorySort] = useState<HistorySortOption>('DATE_DESC');

  const loadData = async (tab: TabState) => {
    setIsLoading(true);
    setError(null);
    try {
      if (tab === 'PENDING') {
        const data = await CommissionService.getAvailable();
        setCommissions(data);
      } else {
        const data = await CommissionService.getPayouts();
        setPayouts(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error de conexión con el motor financiero.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  const handleLiquidate = async (transactionRef: string) => {
    if (!selectedGroup) return;
    try {
      await CommissionService.liquidate({
        seller_id: selectedGroup.seller_id,
        transaction_ref: transactionRef,
        commission_ids: selectedGroup.commission_ids,
      });
      setSelectedGroup(null);
      await loadData('PENDING');
      alert('✅ Pago registrado con éxito.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fallo al liquidar. Refresca la página.');
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    (activeTab === 'PENDING'
      ? cbuFilter !== 'ALL' || pendingSort !== 'AMOUNT_DESC'
      : periodFilter !== 'ALL' || historySort !== 'DATE_DESC');

  const handleResetFilters = () => {
    setSearchQuery('');
    setCbuFilter('ALL');
    setPendingSort('AMOUNT_DESC');
    setPeriodFilter('ALL');
    setHistorySort('DATE_DESC');
  };

  const filteredCommissions = useMemo(() => {
    const query = normalizeText(searchQuery);

    const filtered = commissions.filter((group) => {
      const cbuReady = hasValidCbu(group.cbu_alias);
      if (cbuFilter === 'READY' && !cbuReady) return false;
      if (cbuFilter === 'MISSING' && cbuReady) return false;

      if (query) {
        const sellerName = normalizeText(group.seller_name);
        const cbuAlias = normalizeText(group.cbu_alias);
        const shortId = normalizeText(`vnd-${group.seller_id}`);
        if (
          !sellerName.includes(query) &&
          !cbuAlias.includes(query) &&
          !shortId.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (pendingSort) {
        case 'AMOUNT_ASC':
          return a.total_amount - b.total_amount;
        case 'COUNT_DESC':
          return b.count - a.count;
        case 'NAME_ASC':
          return a.seller_name.localeCompare(b.seller_name, 'es');
        case 'AMOUNT_DESC':
        default:
          return b.total_amount - a.total_amount;
      }
    });
  }, [commissions, searchQuery, cbuFilter, pendingSort]);

  const filteredPayouts = useMemo(() => {
    const query = normalizeText(searchQuery);
    const now = new Date();

    const filtered = payouts.filter((payout) => {
      if (periodFilter !== 'ALL') {
        const createdAt = new Date(payout.created_at);
        if (periodFilter === 'THIS_MONTH') {
          if (
            createdAt.getMonth() !== now.getMonth() ||
            createdAt.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else {
          const days = periodFilter === 'LAST_30_DAYS' ? 30 : 90;
          const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
          if (createdAt.getTime() < cutoff) return false;
        }
      }

      if (query) {
        const sellerName = normalizeText(payout.seller_name);
        const txnRef = normalizeText(payout.transaction_ref);
        if (!sellerName.includes(query) && !txnRef.includes(query)) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (historySort) {
        case 'DATE_ASC':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'AMOUNT_DESC':
          return b.total_amount - a.total_amount;
        case 'DATE_DESC':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [payouts, searchQuery, periodFilter, historySort]);

  const filteredTotalAmount = useMemo(() => {
    if (activeTab === 'PENDING') {
      return filteredCommissions.reduce((acc, item) => acc + item.total_amount, 0);
    }
    return filteredPayouts.reduce((acc, item) => acc + item.total_amount, 0);
  }, [activeTab, filteredCommissions, filteredPayouts]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B50D6] flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Liquidación de Comisiones
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona los pagos pendientes a vendedores y revisa el historial de transferencias.
            </p>
          </div>
        </div>

        {!isLoading && (
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm flex flex-col items-start md:items-end">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {activeTab === 'PENDING' ? 'Total Neto a Liquidar' : 'Total Transferido (Filtro)'}
            </span>
            <span className="text-2xl font-black font-mono text-[#5B50D6]">
              ${filteredTotalAmount.toLocaleString('es-AR')}
            </span>
          </div>
        )}
      </div>

      <div className="inline-flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'PENDING'
              ? 'bg-white text-[#5B50D6] shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <Wallet className="w-4 h-4" /> Pendientes de Pago
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'HISTORY'
              ? 'bg-white text-[#5B50D6] shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <History className="w-4 h-4" /> Historial de Transferencias
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-60 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'PENDING'
                  ? 'Buscar por vendedor o CBU/Alias...'
                  : 'Buscar por vendedor o N° referencia...'
              }
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeTab === 'PENDING' ? (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="filter-cbu-readiness" className="text-xs font-semibold text-slate-500">
                  Destino:
                </label>
                <select
                  id="filter-cbu-readiness"
                  value={cbuFilter}
                  onChange={(e) => setCbuFilter(e.target.value as CbuReadinessFilter)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 outline-none cursor-pointer"
                >
                  <option value="ALL">Todos</option>
                  <option value="READY">Con CBU / Alias</option>
                  <option value="MISSING">Sin CBU registrado</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-pending"
                  className="text-xs font-semibold text-slate-500 flex items-center gap-1"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  Orden:
                </label>
                <select
                  id="sort-pending"
                  value={pendingSort}
                  onChange={(e) => setPendingSort(e.target.value as PendingSortOption)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 outline-none cursor-pointer"
                >
                  <option value="AMOUNT_DESC">Mayor monto a pagar</option>
                  <option value="AMOUNT_ASC">Menor monto a pagar</option>
                  <option value="COUNT_DESC">Mayor cantidad de ventas</option>
                  <option value="NAME_ASC">Vendedor (A - Z)</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="filter-period" className="text-xs font-semibold text-slate-500">
                  Período:
                </label>
                <select
                  id="filter-period"
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 outline-none cursor-pointer"
                >
                  <option value="ALL">Todo el historial</option>
                  <option value="THIS_MONTH">Mes corriente</option>
                  <option value="LAST_30_DAYS">Últimos 30 días</option>
                  <option value="LAST_90_DAYS">Últimos 90 días</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-history"
                  className="text-xs font-semibold text-slate-500 flex items-center gap-1"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  Orden:
                </label>
                <select
                  id="sort-history"
                  value={historySort}
                  onChange={(e) => setHistorySort(e.target.value as HistorySortOption)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 outline-none cursor-pointer"
                >
                  <option value="DATE_DESC">Más recientes</option>
                  <option value="DATE_ASC">Más antiguos</option>
                  <option value="AMOUNT_DESC">Mayor monto transferido</option>
                </select>
              </div>
            </>
          )}

          <div className="flex-1" />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]" />
          </div>
        ) : activeTab === 'PENDING' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Vendedor</th>
                  <th className="py-4 px-6">Destino (CBU / Alias)</th>
                  <th className="py-4 px-6 text-center">Ventas</th>
                  <th className="py-4 px-6 text-center">Monto Neto a Liquidar</th>
                  <th className="py-4 px-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium text-sm">
                      No hay comisiones maduras pendientes de pago.
                    </td>
                  </tr>
                ) : filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <FilterX className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-bold text-slate-700">
                          No hay liquidaciones pendientes que coincidan con el filtro
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 px-3.5 py-1.5 text-xs font-bold text-[#5B50D6] bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Restablecer filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((group) => {
                    const cbuReady = hasValidCbu(group.cbu_alias);
                    return (
                      <tr key={group.seller_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                              {getInitials(group.seller_name)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">
                                {group.seller_name}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                ID: VND-{group.seller_id.substring(0, 6).toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {cbuReady ? (
                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-xs">
                              {group.cbu_alias}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-xs">
                              <AlertTriangle className="w-3.5 h-3.5" /> Sin CBU / Alias
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-sm font-semibold text-slate-700">
                            {group.count}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-base font-extrabold text-[#5B50D6] font-mono">
                            ${group.total_amount.toLocaleString('es-AR')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedGroup(group)}
                            className="inline-flex items-center justify-center gap-1.5 bg-[#1A1D27] hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" /> Liquidar Pago
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6">Vendedor</th>
                  <th className="py-4 px-6">Referencia (TXN)</th>
                  <th className="py-4 px-6 text-right">Monto</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium text-sm">
                      No hay historial de transferencias.
                    </td>
                  </tr>
                ) : filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <FilterX className="w-8 h-8 text-slate-300" />
                        <p className="text-sm font-bold text-slate-700">
                          No hay transferencias registradas para los filtros seleccionados
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-1 px-3.5 py-1.5 text-xs font-bold text-[#5B50D6] bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Restablecer filtros
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-semibold text-slate-600">
                        {new Date(payout.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-bold text-slate-900">
                          {payout.seller_name}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                          {payout.transaction_ref}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-extrabold text-slate-900 font-mono">
                          ${payout.total_amount.toLocaleString('es-AR')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {payout.status === 'COMPLETED' ? 'Completado' : payout.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LiquidateModal
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onConfirm={handleLiquidate}
        sellerId={selectedGroup?.seller_name || selectedGroup?.seller_id || ''}
        totalAmount={selectedGroup?.total_amount || 0}
      />
    </div>
  );
};