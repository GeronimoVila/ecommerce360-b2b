import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductService } from '../../../services/product.service';
import type { Product } from '../../../types/product';

export const ComboFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    base_price: 0,
    commission_rate: 0,
  });

  const [parts, setParts] = useState<{ sku: string; quantity: number }[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(isEditMode);

  useEffect(() => {
    const initForm = async () => {
      try {
        const data = await ProductService.getAll('simple');
        const baseProducts = data.filter(p => !p.is_combo && p.is_active);
        setAvailableProducts(baseProducts);

        if (isEditMode && id) {
          const comboData = await ProductService.getById(id);
          
          setFormData({
            sku: comboData.sku || '',
            name: comboData.name || '',
            base_price: Number(comboData.base_price) || 0,
            commission_rate: Number(comboData.commission_rate) || 0,
          });

          if (comboData.combo_parts) {
             const mappedParts = comboData.combo_parts.map((cp: any) => ({
                 sku: cp.product.sku,
                 quantity: cp.quantity
             }));
             setParts(mappedParts);
          }
        }
      } catch (error) {
        console.error("Error inicializando combo:", error);
        alert("No se pudo cargar la información del combo.");
        navigate('/admin/catalog');
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    initForm();
  }, [id, isEditMode, navigate]);

  const originalTotalValue = parts.reduce((acc, part) => {
    const product = availableProducts.find(p => p.sku === part.sku);
    return acc + (Number(product?.purchase_cost || product?.base_price || 0) * part.quantity);
  }, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const addPart = () => setParts([...parts, { sku: '', quantity: 1 }]);

  const updatePart = (index: number, field: 'sku' | 'quantity', value: string | number) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const removePart = (index: number) => setParts(parts.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parts.length === 0) {
      alert("El combo debe tener al menos 1 producto componente.");
      return;
    }
    if (parts.some(p => p.sku === '' || p.quantity <= 0)) {
      alert("Verifica que todos los componentes tengan un producto seleccionado y cantidad mayor a 0.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      sku: formData.sku,
      name: formData.name,
      base_price: Number(formData.base_price),
      commission_rate: Number(formData.commission_rate),
      parts: parts.map(p => ({ sku: p.sku, quantity: Number(p.quantity) }))
    };

    try {
      if (isEditMode && id) {
          await ProductService.updateCombo(id, payload);
      } else {
          await ProductService.createCombo(payload);
      }
      navigate('/admin/catalog');
    } catch (error: any) {
      console.error('[Arquitectura] Error guardando combo:', error);
      alert(error.response?.data?.error || 'Hubo un error al guardar el combo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitialData) {
      return (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
      );
  }

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
            {isEditMode ? 'Editar Combo' : 'Armador de Combos'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">El stock se calculará automáticamente vía Redis basado en los componentes.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        
        <div className="bg-white p-5 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Información del Paquete</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SKU del Combo *</label>
              <input 
                type="text" name="sku" value={formData.sku} onChange={handleChange} required
                disabled={isEditMode}
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
                placeholder="Ej. COMBO-VERANO-24"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre Comercial *</label>
              <input 
                type="text" name="name" value={formData.name} onChange={handleChange} required
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-bold text-gray-800">Componentes (Partes)</h2>
            <button 
              type="button" onClick={addPart}
              className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              + Añadir Producto
            </button>
          </div>

          <div className="space-y-4">
            {parts.length === 0 ? (
              <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 text-sm">
                No has añadido productos a este combo.
              </div>
            ) : (
              parts.map((part, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-full sm:flex-1">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Producto</label>
                    <select 
                      value={part.sku}
                      onChange={(e) => updatePart(index, 'sku', e.target.value)}
                      required
                      className="block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm bg-white"
                    >
                      <option value="" disabled>Selecciona un producto...</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.sku}>
                          {p.name} (${Number(p.base_price).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-24">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad</label>
                    <input 
                      type="number" min="1" required
                      value={part.quantity}
                      onChange={(e) => updatePart(index, 'quantity', Number(e.target.value))}
                      className="block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm"
                    />
                  </div>
                  <button 
                    type="button" onClick={() => removePart(index)}
                    className="w-full sm:w-auto mt-2 sm:mt-0 px-3 py-3 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-5 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Precios y Comisiones</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Precio Final del Combo ($) *</label>
              <input 
                type="number" name="base_price" step="0.01" min="0" required
                value={formData.base_price} onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Comisión Vendedor (%) *</label>
              <input 
                type="number" name="commission_rate" step="0.1" min="0" required
                value={formData.commission_rate} onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-slate-600 font-medium">Suma del costo individual de productos:</p>
              <p className="text-xl font-bold text-slate-800">${originalTotalValue.toFixed(2)}</p>
            </div>
            {Number(formData.base_price) > 0 && (
              <div className={`px-4 py-2 rounded-lg text-sm font-bold ${
                Number(formData.base_price) < originalTotalValue 
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                Margen Bruto: ${(Number(formData.base_price) - originalTotalValue).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 md:gap-4 pb-10">
          <button 
            type="button" onClick={() => navigate('/admin/catalog')}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button 
            type="submit" disabled={isSubmitting}
            className={`w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-lg text-white font-bold transition-all shadow-sm ${
              isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
            }`}
          >
            {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar Combo' : 'Crear Combo')}
          </button>
        </div>
      </form>
    </div>
  );
};