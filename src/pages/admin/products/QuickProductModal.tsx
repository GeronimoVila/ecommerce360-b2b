import { useState } from 'react';
import { ProductService } from '../../../services/product.service';
import type { Product } from '../../../types/product';

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
}

export const QuickProductModal = ({ isOpen, onClose, onSuccess }: QuickProductModalProps) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    purchase_cost: 0,
    vat_rate: 21,
    profit_margin: 30,
    commission_rate: 5
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        physical_stock: 0,
      };

      const newProduct = await ProductService.create(payload);
      onSuccess(newProduct);
      setFormData({ sku: '', name: '', purchase_cost: 0, vat_rate: 21, profit_margin: 30, commission_rate: 5 });
    } catch (error: any) {
      console.error('Error creando producto rápido:', error);
      alert(error.response?.data?.error || 'No se pudo crear el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Alta Rápida de Producto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-gray-500 mb-4">El stock inicial será 0. La cantidad recibida se sumará al confirmar el remito.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">SKU *</label>
              <input type="text" name="sku" required value={formData.sku} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ej. TAZA-B-01" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Nombre *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Taza Blanca" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Costo Compra ($) *</label>
              <input type="number" name="purchase_cost" min="0" step="0.01" required value={formData.purchase_cost} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">IVA (%) *</label>
              <input type="number" name="vat_rate" min="0" step="0.1" required value={formData.vat_rate} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Margen Ganancia (%) *</label>
              <input type="number" name="profit_margin" min="0" step="0.1" required value={formData.profit_margin} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Comisión Vendedor (%) *</label>
              <input type="number" name="commission_rate" min="0" step="0.1" required value={formData.commission_rate} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};