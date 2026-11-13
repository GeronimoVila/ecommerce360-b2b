import { useState, useEffect } from 'react';
import { X, Sliders } from 'lucide-react';
import { PaymentRuleService, type PaymentRulePayload, type PaymentRule } from '../../../services/payment-rule.service';

interface PaymentRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ruleToEdit?: PaymentRule | null;
}

export const PaymentRuleModal = ({ isOpen, onClose, onSuccess, ruleToEdit }: PaymentRuleModalProps) => {
  const [formData, setFormData] = useState<PaymentRulePayload>({
    payment_method: 'MP',
    installments: 1,
    coefficient: 1.0000,
    is_global: true,
    category_id: '',
    product_id: ''
  });
  
  const [targetType, setTargetType] = useState<'GLOBAL' | 'CATEGORY' | 'PRODUCT'>('GLOBAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ruleToEdit) {
      setFormData({
        payment_method: ruleToEdit.payment_method,
        installments: ruleToEdit.installments,
        coefficient: Number(ruleToEdit.coefficient),
        is_global: ruleToEdit.is_global,
        category_id: ruleToEdit.category_id || '',
        product_id: ruleToEdit.product_id || ''
      });
      if (ruleToEdit.is_global) setTargetType('GLOBAL');
      else if (ruleToEdit.category_id) setTargetType('CATEGORY');
      else if (ruleToEdit.product_id) setTargetType('PRODUCT');
    } else {
      setFormData({
        payment_method: 'MP',
        installments: 1,
        coefficient: 1.0000,
        is_global: true,
        category_id: '',
        product_id: ''
      });
      setTargetType('GLOBAL');
    }
  }, [ruleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'GLOBAL' | 'CATEGORY' | 'PRODUCT';
    setTargetType(type);
    setFormData(prev => ({
      ...prev,
      is_global: type === 'GLOBAL',
      category_id: type === 'CATEGORY' ? prev.category_id : '',
      product_id: type === 'PRODUCT' ? prev.product_id : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'CATEGORY' && !formData.category_id) {
      alert("Debes proporcionar un ID de categoría.");
      return;
    }
    if (targetType === 'PRODUCT' && !formData.product_id) {
      alert("Debes proporcionar un ID de producto.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (ruleToEdit) {
        await PaymentRuleService.update(ruleToEdit.id, formData.coefficient, true);
      } else {
        const payload: PaymentRulePayload = {
          ...formData,
          category_id: targetType === 'CATEGORY' ? formData.category_id : null,
          product_id: targetType === 'PRODUCT' ? formData.product_id : null
        };
        await PaymentRuleService.create(payload);
      }
      
      onSuccess();
    } catch (error: any) {
      console.error('[PaymentRuleModal] Error:', error);
      alert(error.response?.data?.error || 'Error al guardar la regla financiera.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5B50D6] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {ruleToEdit ? 'Editar Regla Financiera' : 'Nueva Regla Financiera'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Método de Pago *</label>
              <select 
                name="payment_method" 
                value={formData.payment_method} 
                onChange={handleChange} 
                disabled={!!ruleToEdit} 
                required 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 disabled:text-slate-500 shadow-sm"
              >
                <option value="MP">Mercado Pago (MP)</option>
                <option value="MOBBEX">Mobbex</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cuotas *</label>
              <input 
                type="number" 
                name="installments" 
                min="1" 
                max="24" 
                value={formData.installments} 
                onChange={handleChange} 
                disabled={!!ruleToEdit} 
                required 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 disabled:text-slate-500 shadow-sm font-mono" 
              />
            </div>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/70">
            <label className="block text-xs font-bold text-[#5B50D6] mb-1">Coeficiente Financiero *</label>
            <p className="text-xs text-slate-500 mb-2.5">Ej: 1.0000 = Sin interés. 1.1500 = 15% de recargo.</p>
            <input 
              type="number" 
              name="coefficient" 
              step="0.0001" 
              min="0.1000" 
              max="3.0000" 
              value={formData.coefficient} 
              onChange={handleChange} 
              required 
              className="w-full border border-indigo-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] font-mono font-bold text-slate-900 shadow-sm" 
            />
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alcance de la Regla (Jerarquía) *</label>
              <select 
                value={targetType} 
                onChange={handleTargetChange} 
                disabled={!!ruleToEdit} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 disabled:text-slate-500 shadow-sm"
              >
                <option value="GLOBAL">Global (Aplica a todo el catálogo)</option>
                <option value="CATEGORY">Específica de Categoría</option>
                <option value="PRODUCT">Específica de Producto (SKU)</option>
              </select>
            </div>

            {targetType === 'CATEGORY' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID de Categoría *</label>
                <input 
                  type="text" 
                  name="category_id" 
                  value={formData.category_id || ''} 
                  onChange={handleChange} 
                  disabled={!!ruleToEdit} 
                  required 
                  placeholder="UUID de la categoría" 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 font-mono shadow-sm" 
                />
              </div>
            )}
            
            {targetType === 'PRODUCT' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID de Producto *</label>
                <input 
                  type="text" 
                  name="product_id" 
                  value={formData.product_id || ''} 
                  onChange={handleChange} 
                  disabled={!!ruleToEdit} 
                  required 
                  placeholder="UUID del producto" 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 font-mono shadow-sm" 
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#5B50D6] rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-600/25 transition-all"
            >
              {isSubmitting ? 'Guardando...' : (ruleToEdit ? 'Actualizar Coeficiente' : 'Crear Regla')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};