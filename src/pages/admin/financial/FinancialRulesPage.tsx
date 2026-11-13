import { useState, useEffect } from 'react';
import { 
Plus, Sliders,
} from 'lucide-react';
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
    if (rule.is_global) return <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-[#5B50D6] border border-indigo-100 rounded-lg">Global</span>;
    if (rule.category_id) return <span className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100 rounded-lg">Categoría: {rule.category?.name || 'ID'}</span>;
    if (rule.product_id) return <span className="px-2.5 py-1 text-xs font-bold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 rounded-lg">Producto: {rule.product?.sku || 'ID'}</span>;
    return <span className="text-slate-400">Desconocido</span>;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Reglas Financieras</h1>
          <p className="text-sm text-slate-500 mt-1">Configura coeficientes de cuotas e intereses para el motor de precios (Pricing Engine).</p>
        </div>
        <button 
          onClick={handleOpenNew}
          className="bg-[#1A1D27] text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-slate-800 transition-colors font-semibold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nueva Regla
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-3">
            <Sliders className="w-8 h-8 text-slate-300" />
            No hay reglas configuradas. Todas las ventas procesarán con base al precio de lista.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Método</th>
                  <th className="py-3.5 px-6">Cuotas</th>
                  <th className="py-3.5 px-6">Coeficiente</th>
                  <th className="py-3.5 px-6">Alcance (Jerarquía)</th>
                  <th className="py-3.5 px-6">Estado</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rules.map((rule) => (
                  <tr key={rule.id} className={`hover:bg-slate-50/50 transition-colors ${!rule.is_active ? 'opacity-60 bg-slate-50/40' : ''}`}>
                    <td className="py-4 px-6 font-bold text-slate-900">{rule.payment_method}</td>
                    <td className="py-4 px-6 font-semibold text-slate-700">{rule.installments} {rule.installments === 1 ? 'pago' : 'cuotas'}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono bg-indigo-50/80 text-[#5B50D6] border border-indigo-100 px-2.5 py-1 rounded-lg font-bold text-xs">
                        x {Number(rule.coefficient).toFixed(4)}
                      </span>
                    </td>
                    <td className="py-4 px-6">{renderScope(rule)}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border ${
                        rule.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rule.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {rule.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button 
                        onClick={() => handleOpenEdit(rule)} 
                        className="text-[#5B50D6] hover:text-indigo-800 font-semibold text-xs transition-colors"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(rule)} 
                        className={`font-semibold text-xs transition-colors ${
                          rule.is_active ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'
                        }`}
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