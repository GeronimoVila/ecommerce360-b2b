import { useState } from 'react';
import { X, PackagePlus } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5B50D6] flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Alta Rápida de Producto</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">SKU *</label>
              <input 
                type="text" 
                name="sku" 
                required 
                value={formData.sku} 
                onChange={handleChange} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono" 
                placeholder="Ej. TAZA-B-01" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre *</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm" 
                placeholder="Taza Blanca" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Costo Compra ($) *</label>
              <input 
                type="number" 
                name="purchase_cost" 
                min="0" 
                step="0.01" 
                required 
                value={formData.purchase_cost} 
                onChange={handleChange} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">IVA (%) *</label>
              <input 
                type="number" 
                name="vat_rate" 
                min="0" 
                step="0.1" 
                required 
                value={formData.vat_rate} 
                onChange={handleChange} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Margen Ganancia (%) *</label>
              <input 
                type="number" 
                name="profit_margin" 
                min="0" 
                step="0.1" 
                required 
                value={formData.profit_margin} 
                onChange={handleChange} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono" 
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Comisión Vendedor (%) *</label>
              <input 
                type="number" 
                name="commission_rate" 
                min="0" 
                step="0.1" 
                required 
                value={formData.commission_rate} 
                onChange={handleChange} 
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono" 
              />
            </div>
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
              {isSubmitting ? 'Guardando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};