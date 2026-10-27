import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductService } from '../../../services/product.service';
import { InventoryService } from '../../../services/inventory.service';
import type { Product } from '../../../types/product';

export const RestockFormPage = () => {
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState({
    provider_name: '',
    reference_document: ''
  });

  const [items, setItems] = useState<{ sku: string; quantity: number }[]>([
    { sku: '', quantity: 1 }
  ]);

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    ProductService.getAll('simple').then(data => {
      setAvailableProducts(data.filter(p => p.is_active && !p.is_combo));
    }).catch(err => console.error('Error cargando catálogo:', err));
  }, []);

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const addItem = () => setItems([...items, { sku: '', quantity: 1 }]);

  const updateItem = (index: number, field: 'sku' | 'quantity', value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      alert('Debe ingresar al menos un producto.');
      return;
    }

    const invalidItems = items.filter(item => !item.sku || item.quantity <= 0);
    if (invalidItems.length > 0) {
      alert('Todos los ítems deben tener un producto seleccionado y cantidad mayor a 0.');
      return;
    }

    const consolidatedItems = items.reduce((acc, current) => {
      const existing = acc.find(item => item.sku === current.sku);
      if (existing) existing.quantity += current.quantity;
      else acc.push({ ...current });
      return acc;
    }, [] as { sku: string; quantity: number }[]);

    setIsSubmitting(true);

    try {
      await InventoryService.processRestock({
        provider_name: metadata.provider_name || undefined,
        reference_document: metadata.reference_document || undefined,
        items: consolidatedItems
      });
      
      alert('Ingreso procesado correctamente.');
      navigate('/admin/catalog'); 
    } catch (error: any) {
      console.error('[Arquitectura] Error en restock:', error);
      alert(error.response?.data?.error || 'Error al procesar el ingreso de mercadería.');
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Ingreso de Mercadería</h1>
        <p className="text-sm text-gray-500 mt-1">Registra remitos de proveedores para incrementar el stock físico.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
        
        <div className="bg-white p-5 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Datos del Remito / Factura</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Proveedor (Opcional)</label>
              <input 
                type="text" name="provider_name" value={metadata.provider_name} onChange={handleMetadataChange}
                placeholder="Ej. Sony Argentina S.A."
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nº Documento (Opcional)</label>
              <input 
                type="text" name="reference_document" value={metadata.reference_document} onChange={handleMetadataChange}
                placeholder="Ej. FC-0001-00459384"
                className="mt-1 block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b pb-3 gap-3">
            <h2 className="text-lg font-bold text-gray-800">Productos Ingresados</h2>
            <button 
              type="button" onClick={addItem}
              className="w-full sm:w-auto bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              + Añadir Fila
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 bg-slate-50 border border-slate-200 rounded-lg">
                
                <div className="w-full sm:flex-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Producto (SKU)</label>
                  <select 
                    value={item.sku}
                    onChange={(e) => updateItem(index, 'sku', e.target.value)}
                    required
                    className="block w-full border border-slate-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Selecciona el producto recibido...</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.sku}>
                        [{p.sku}] - {p.name} (Stock Actual: {p.physical_stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Cantidad</label>
                  <input 
                    type="number" min="1" required
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    className="block w-full border border-slate-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 font-semibold text-center"
                  />
                </div>

                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1} 
                  className={`w-full sm:w-auto mt-2 sm:mt-0 px-3 py-3 sm:py-2 rounded-lg font-medium text-sm transition-colors ${
                    items.length === 1 
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 md:gap-4 pb-8">
          <button 
            type="button" onClick={() => navigate('/admin/catalog')}
            className="w-full sm:w-auto px-6 py-3 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" disabled={isSubmitting}
            className={`w-full sm:w-auto px-8 py-3 sm:py-2.5 rounded-lg text-white font-bold transition-all shadow-sm ${
              isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:scale-95'
            }`}
          >
            {isSubmitting ? 'Procesando...' : 'Confirmar Ingreso'}
          </button>
        </div>
      </form>
    </div>
  );
};