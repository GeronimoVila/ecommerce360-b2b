import { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">
            {ruleToEdit ? 'Editar Regla Financiera' : 'Nueva Regla Financiera'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Método de Pago *</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleChange} disabled={!!ruleToEdit} required className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                <option value="MP">Mercado Pago (MP)</option>
                <option value="MOBBEX">Mobbex</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Cuotas *</label>
              <input type="number" name="installments" min="1" max="24" value={formData.installments} onChange={handleChange} disabled={!!ruleToEdit} required className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="block text-xs font-bold text-blue-800 mb-1">Coeficiente Financiero *</label>
            <p className="text-xs text-blue-600 mb-2">Ej: 1.0000 = Sin interés. 1.1500 = 15% de recargo.</p>
            <input type="number" name="coefficient" step="0.0001" min="0.1000" max="3.0000" value={formData.coefficient} onChange={handleChange} required className="w-full border-blue-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-900" />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="block text-xs font-bold text-gray-600 mb-2">Alcance de la Regla (Jerarquía) *</label>
            <select value={targetType} onChange={handleTargetChange} disabled={!!ruleToEdit} className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 mb-3 disabled:bg-gray-100">
              <option value="GLOBAL">Global (Aplica a todo el catálogo)</option>
              <option value="CATEGORY">Específica de Categoría</option>
              <option value="PRODUCT">Específica de Producto (SKU)</option>
            </select>

            {targetType === 'CATEGORY' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ID de Categoría *</label>
                <input type="text" name="category_id" value={formData.category_id || ''} onChange={handleChange} disabled={!!ruleToEdit} required placeholder="UUID de la categoría" className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
              </div>
            )}
            
            {targetType === 'PRODUCT' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ID de Producto *</label>
                <input type="text" name="product_id" value={formData.product_id || ''} onChange={handleChange} disabled={!!ruleToEdit} required placeholder="UUID del producto" className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm">
              {isSubmitting ? 'Guardando...' : (ruleToEdit ? 'Actualizar Coeficiente' : 'Crear Regla')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};