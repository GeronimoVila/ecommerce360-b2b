import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductService } from '../../../services/product.service';

export const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<any>({
    sku: '',
    name: '',
    purchase_cost: 0,
    vat_rate: 21,
    profit_margin: 0,
    physical_stock: 0,
    commission_rate: 0,
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      ProductService.getById(id).then(product => {
        setFormData({
          sku: product.sku || '',
          name: product.name || '',
          purchase_cost: Number(product.purchase_cost) || 0,
          vat_rate: Number(product.vat_rate) || 0,
          profit_margin: Number(product.profit_margin) || 0,
          physical_stock: Number(product.physical_stock) || 0,
          commission_rate: Number(product.commission_rate) || 0,
        });
      }).catch(err => console.error("Error hidratando datos:", err));
    }
  }, [id, isEditMode]);

  useEffect(() => {
    const cost = Number(formData.purchase_cost) || 0;
    const vat = Number(formData.vat_rate) || 0;
    const margin = Number(formData.profit_margin) || 0;
    
    const costWithVat = cost * (1 + (vat / 100));
    const finalPrice = costWithVat * (1 + (margin / 100));
    setCalculatedPrice(finalPrice);
  }, [formData.purchase_cost, formData.vat_rate, formData.profit_margin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({ 
      ...prev, 
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const validatePayload = (): boolean => {
    if (!formData.sku || formData.sku.trim() === '') {
      alert("El SKU es obligatorio.");
      return false;
    }
    if (!formData.name || formData.name.trim() === '') {
      alert("El nombre del producto es obligatorio.");
      return false;
    }
    
    const numericFields = ['purchase_cost', 'vat_rate', 'profit_margin', 'commission_rate', 'physical_stock'];
    for (const field of numericFields) {
      if (formData[field] === '' || formData[field] === null || formData[field] === undefined) {
        alert(`El campo ${field} no puede estar vacío.`);
        return false;
      }
      if (Number(formData[field]) < 0) {
        alert(`El campo ${field} no puede ser un valor negativo.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayload()) return;
    
    setIsSubmitting(true);

    const sanitizedPayload = {
      sku: formData.sku,
      name: formData.name,
      purchase_cost: Number(formData.purchase_cost),
      vat_rate: Number(formData.vat_rate),
      profit_margin: Number(formData.profit_margin),
      physical_stock: Number(formData.physical_stock),
      commission_rate: Number(formData.commission_rate),
    };

    try {
      if (isEditMode && id) {
        await ProductService.update(id, sanitizedPayload);
      } else {
        await ProductService.create(sanitizedPayload);
      }
      navigate('/admin/catalog');
    } catch (error: any) {
      console.error('[Arquitectura] Error de red/backend:', error);
      alert(error.response?.data?.error || 'Hubo un error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      
      <div className="mb-6">
        <button 
          type="button" 
          onClick={() => navigate('/admin/catalog')}
          className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al catálogo
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {isEditMode ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-6 md:space-y-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">SKU (Código Único) *</label>
            <input 
              type="text" name="sku" value={formData.sku} onChange={handleChange} required
              disabled={isEditMode} 
              className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Producto *</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleChange} required
              className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 border-t border-gray-100 pt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Costo Compra ($) *</label>
            <input 
              type="number" name="purchase_cost" step="0.01" min="0"
              value={formData.purchase_cost} onChange={handleChange} required
              className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">IVA (%) *</label>
            <input 
              type="number" name="vat_rate" step="0.1" min="0"
              value={formData.vat_rate} onChange={handleChange} required
              className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Margen Ganancia (%) *</label>
            <input 
              type="number" name="profit_margin" step="0.1" min="0"
              value={formData.profit_margin} onChange={handleChange} required
              className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 p-4 md:p-5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <p className="text-sm text-blue-800 font-semibold">Precio Base Calculado</p>
            <p className="text-xs text-blue-600 mt-0.5">Precio final para el cliente B2C</p>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-blue-900 mt-2 sm:mt-0">
            ${calculatedPrice.toFixed(2)}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 border-t border-gray-100 pt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Comisión Vendedor (%) *</label>
            <input 
              type="number" name="commission_rate" step="0.1" min="0"
              value={formData.commission_rate} onChange={handleChange} required
              className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Físico</label>
            <input 
              type="number" name="physical_stock" min="0"
              value={formData.physical_stock} onChange={handleChange} required
              disabled={isEditMode}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 md:gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/admin/catalog')}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-lg text-white font-bold transition-all shadow-sm ${
              isSubmitting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-95'
            }`}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
};