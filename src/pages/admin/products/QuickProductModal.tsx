import { useState } from 'react';
import { X, PackagePlus, AlertCircle } from 'lucide-react';
import { ProductService } from '../../../services/product.service';
import { CategoryCascader } from '../../../components/admin/catalog/CategoryCascader';
import type { Product } from '../../../types/product';

interface QuickProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
}

interface FieldErrors {
  sku?: string;
  name?: string;
  general?: string;
}

export const QuickProductModal = ({ isOpen, onClose, onSuccess }: QuickProductModalProps) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category_id: '',
    purchase_cost: 0,
    vat_rate: 21,
    profit_margin: 30,
    commission_rate: 5,
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isCategoryLeaf, setIsCategoryLeaf] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (name === 'sku' || name === 'name') {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || !isCategoryLeaf) {
      setFieldErrors({ general: 'Debes seleccionar una subcategoría final (hoja) válida.' });
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const payload = {
        ...formData,
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        purchase_cost: Number(formData.purchase_cost),
        vat_rate: Number(formData.vat_rate),
        profit_margin: Number(formData.profit_margin),
        commission_rate: Number(formData.commission_rate),
        physical_stock: 0,
      };

      const newProduct = await ProductService.create(payload);
      onSuccess(newProduct);
      setFormData({
        sku: '',
        name: '',
        category_id: '',
        purchase_cost: 0,
        vat_rate: 21,
        profit_margin: 30,
        commission_rate: 5,
      });
      setFieldErrors({});
      setIsCategoryLeaf(false);
    } catch (error: any) {
      console.error('Error creando producto rápido:', error);
      const status = error.response?.status;
      const backendError = error.response?.data?.error || 'No se pudo crear el producto.';
      const conflictField = error.response?.data?.field as 'sku' | 'name' | undefined;

      if (status === 409 && conflictField) {
        setFieldErrors({ [conflictField]: backendError });
      } else {
        setFieldErrors({ general: backendError });
      }
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
          {fieldErrors.general && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{fieldErrors.general}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                required
                value={formData.sku}
                onChange={handleChange}
                className={`w-full border rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 shadow-sm font-mono ${
                  fieldErrors.sku
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]'
                }`}
                placeholder="Ej. TAZA-B-01"
              />
              {fieldErrors.sku && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.sku}</p>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`w-full border rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 shadow-sm ${
                  fieldErrors.name
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]'
                }`}
                placeholder="Taza Blanca"
              />
              {fieldErrors.name && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">{fieldErrors.name}</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <CategoryCascader
              compact
              selectedCategoryId={formData.category_id}
              onChange={(catId, isLeaf) => {
                setFormData((prev) => ({ ...prev, category_id: catId }));
                setIsCategoryLeaf(isLeaf);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Costo Compra ($) *
              </label>
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
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                IVA (%) *
              </label>
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
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Margen Ganancia (%) *
              </label>
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
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Comisión Vendedor (%) *
              </label>
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
              disabled={isSubmitting || !isCategoryLeaf}
              className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${
                isSubmitting || !isCategoryLeaf
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-[#5B50D6] hover:bg-indigo-700 shadow-indigo-600/25'
              }`}
            >
              {isSubmitting ? 'Guardando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};