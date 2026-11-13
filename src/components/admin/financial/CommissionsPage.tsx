import React, { useEffect, useState } from 'react';
import { CommissionService } from '../../../services/commission.service';
import type { GroupedCommission, PayoutHistory } from '../../../types/commission';
import { LiquidateModal } from '../../../components/admin/financial/LiquidateModal';
import { 
  Landmark, Wallet, History, Search, 
  ChevronDown, Send 
} from 'lucide-react';

type TabState = 'PENDING' | 'HISTORY';

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.split(' ');
  return parts.length > 1 
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

export const CommissionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabState>('PENDING');
  
  const [commissions, setCommissions] = useState<GroupedCommission[]>([]);
  const [payouts, setPayouts] = useState<PayoutHistory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupedCommission | null>(null);

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
      alert('Pago registrado con éxito.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Fallo al liquidar. Refresca la página.');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B50D6] flex items-center justify-center shrink-0">
          <Landmark className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Liquidación de Comisiones</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona los pagos pendientes a vendedores y revisa el historial de transferencias.</p>
        </div>
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
          <div className="relative flex-1 min-w-50 max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Filtrar por asesor o CUIT..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#5B50D6]/20 outline-none transition-colors"
            />
          </div>
          
          <button className="flex items-center justify-between gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
            Todas las Carteras <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50">
            Período: Mes Corriente
          </button>
          
          <div className="flex-1"></div>
        </div>

        {isLoading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
          </div>
        ) : activeTab === 'PENDING' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Vendedor & CUIT</th>
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
                ) : (
                  commissions.map((group) => (
                    <tr key={group.seller_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm shrink-0">
                            {getInitials(group.seller_name)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{group.seller_name}</div>
                            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>VND-{group.seller_id.split('-')[0].substring(0,3)}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span>CUIT: {group.seller_id}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-wide">
                            {group.cbu_alias}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Banco X (CBU: ...{group.cbu_alias.substring(group.cbu_alias.length - 4)})
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm font-semibold text-slate-700">{group.count}</span>
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
                  ))
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
                ) : (
                  payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-semibold text-slate-600">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-bold text-slate-900">{payout.seller_name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
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
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {payout.status}
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