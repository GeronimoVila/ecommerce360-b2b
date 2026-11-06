import React, { useEffect, useState } from 'react';
import { CommissionService } from '../../../services/commission.service';
import type { GroupedCommission, PayoutHistory } from '../../../types/commission';
import { LiquidateModal } from '../../../components/admin/financial/LiquidateModal';

type TabState = 'PENDING' | 'HISTORY';

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
    <div className="p-8">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-2xl font-bold">Panel de Liquidación de Comisiones</h1>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`${
              activeTab === 'PENDING'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pendientes de Pago
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`${
              activeTab === 'HISTORY'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Historial de Transferencias
          </button>
        </nav>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Cargando datos financieros...</div>
      ) : activeTab === 'PENDING' ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destino (CBU/Alias)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ventas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay comisiones maduras pendientes.</td>
                </tr>
              ) : (
                commissions.map((group) => (
                  <tr key={group.seller_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{group.seller_name}</div>
                      <div className="text-xs font-mono text-gray-500">{group.seller_id.split('-')[0]}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {group.cbu_alias}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                      ${group.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedGroup(group)}
                        className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                      >
                        Liquidar Pago
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia (TXN)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay historial de transferencias.</td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payout.seller_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {payout.transaction_ref}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ${payout.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
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