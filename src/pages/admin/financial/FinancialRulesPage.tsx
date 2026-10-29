import { useState, useEffect } from 'react';
import { PaymentRuleService, type PaymentRule } from '../../../services/payment-rule.service';
import { PaymentRuleModal } from '../../../components/admin/financial/PaymentRuleModal';

export const FinancialRulesPage = () => {
  const [rules, setRules] = useState<PaymentRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<PaymentRule | null>(null);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const data = await PaymentRuleService.getAll();
      setRules(data);
    } catch (error) {
      console.error('Error cargando reglas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenNew = () => {
    setRuleToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: PaymentRule) => {
    setRuleToEdit(rule);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (rule: PaymentRule) => {
    try {
      if (rule.is_active) {
        await PaymentRuleService.softDelete(rule.id);
      } else {
        await PaymentRuleService.update(rule.id, Number(rule.coefficient), true);
      }
      fetchRules();
    } catch (error) {
      alert('Error al cambiar el estado de la regla.');
    }
  };

  const renderScope = (rule: PaymentRule) => {
    if (rule.is_global) return <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">Global</span>;
    if (rule.category_id) return <span className="px-2.5 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">Categoría: {rule.category?.name || 'ID'}</span>;
    if (rule.product_id) return <span className="px-2.5 py-1 text-xs font-semibold bg-fuchsia-100 text-fuchsia-800 rounded-full">Producto: {rule.product?.sku || 'ID'}</span>;
    return <span className="text-gray-400">Desconocido</span>;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Reglas Financieras</h1>
          <p className="text-sm text-gray-500 mt-1">Configura coeficientes de cuotas e intereses para el motor de precios (Pricing Engine).</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-slate-800 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-slate-700 transition-colors font-semibold text-sm"
        >
          + Nueva Regla
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div></div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">No hay reglas configuradas. Todas las ventas procesarán con base al precio de lista.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Método</th>
                  <th className="p-4">Cuotas</th>
                  <th className="p-4">Coeficiente</th>
                  <th className="p-4">Alcance (Jerarquía)</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {rules.map((rule) => (
                  <tr key={rule.id} className={`hover:bg-gray-50 transition-colors ${!rule.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="p-4 font-bold text-slate-800">{rule.payment_method}</td>
                    <td className="p-4 font-semibold">{rule.installments} {rule.installments === 1 ? 'pago' : 'cuotas'}</td>
                    <td className="p-4">
                      <span className="font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold text-sm">
                        x {Number(rule.coefficient).toFixed(4)}
                      </span>
                    </td>
                    <td className="p-4">{renderScope(rule)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${rule.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {rule.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button onClick={() => handleOpenEdit(rule)} className="text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                      <button 
                        onClick={() => handleToggleStatus(rule)} 
                        className={`font-medium ${rule.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {rule.is_active ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaymentRuleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { setIsModalOpen(false); fetchRules(); }} 
        ruleToEdit={ruleToEdit}
      />
    </div>
  );
};