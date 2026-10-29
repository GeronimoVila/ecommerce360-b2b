import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductService } from '../../../services/product.service';
import { InventoryService } from '../../../services/inventory.service';
import { SupplierService, type Supplier } from '../../../services/supplier.service';
import type { Product } from '../../../types/product';
import { QuickProductModal } from '../products/QuickProductModal';
import { QuickProviderModal } from './QuickProviderModal';

export const RestockFormPage = () => {
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState({
    provider_name: '', 
    reference_document: ''
  });

  const [items, setItems] = useState<{ sku: string; quantity: number | '' }[]>([
    { sku: '', quantity: '' }
  ]);

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [modalTargetIndex, setModalTargetIndex] = useState<number | null>(null);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false); 

  useEffect(() => {
    Promise.all([
      ProductService.getAll('simple'),
      SupplierService.getAll().catch(err => {
        console.error('ALERTA BACKEND: No se pudieron cargar los proveedores. Verifica que el endpoint GET /suppliers exista.', err);
        return [];
      })
    ]).then(([productsData, suppliersData]) => {
      setAvailableProducts(productsData.filter(p => p.is_active && !p.is_combo));
      setSuppliers(suppliersData);
    }).catch(err => console.error('Error crítico cargando datos iniciales:', err));
  }, []);

  const handleMetadataChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleProviderCreated = (newSupplier: Supplier) => {
    setSuppliers(prev => [...prev, newSupplier]);
    setMetadata(prev => ({ ...prev, provider_name: newSupplier.name })); 
    setIsProviderModalOpen(false);
  };

  const addItem = () => setItems([...items, { sku: '', quantity: '' }]);

  const updateItem = (index: number, field: 'sku' | 'quantity', value: string | number) => {
    const newItems = [...items];
    if (field === 'quantity') {
      newItems[index][field] = value === '' ? '' : parseInt(value as string, 10);
    } else {
      newItems[index][field] = value as string;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductCreated = (newProduct: Product) => {
    setAvailableProducts(prev => [...prev, newProduct]);
    
    if (modalTargetIndex !== null) {
      updateItem(modalTargetIndex, 'sku', newProduct.sku);
    }
    setModalTargetIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!metadata.provider_name || metadata.provider_name.trim() === '') {
      alert('Error: Debes seleccionar un proveedor existente o crear uno nuevo obligatoriamente.');
      return;
    }

    const validItems = items.filter(item => item.sku !== '' && item.quantity !== '');
    if (validItems.length === 0) {
      alert('Debe ingresar al menos un producto con cantidad.');
      return;
    }

    if (validItems.some(item => Number(item.quantity) <= 0)) {
      alert('Todas las cantidades deben ser mayores a 0.');
      return;
    }

    const consolidatedItems = validItems.reduce((acc, current) => {
      const existing = acc.find(item => item.sku === current.sku);
      if (existing) existing.quantity = Number(existing.quantity) + Number(current.quantity);
      else acc.push({ sku: current.sku, quantity: Number(current.quantity) });
      return acc;
    }, [] as { sku: string; quantity: number }[]);

    setIsSubmitting(true);

    try {
      const response = await InventoryService.processRestock({
        provider_name: metadata.provider_name,
        reference_document: metadata.reference_document || undefined,
        items: consolidatedItems
      });
      
      alert(`✅ ${response.message}`);
      navigate('/admin/catalog'); 
    } catch (error: any) {
      console.error('[Arquitectura] Error en restock:', error);
      alert(error.response?.data?.error || 'Error al procesar el ingreso de mercadería.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto relative">
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Proveedor *</label>
              <div className="flex gap-2">
                <select 
                  name="provider_name" 
                  value={metadata.provider_name} 
                  onChange={handleMetadataChange}
                  required
                  className="block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 invalid:border-red-400"
                >
                  <option value="" disabled>Seleccione un proveedor...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsProviderModalOpen(true)}
                  className="whitespace-nowrap px-3 py-2 bg-slate-800 text-white rounded-lg border hover:bg-slate-700 text-sm font-semibold transition-colors"
                >
                  + Nuevo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nº Documento (Opcional)</label>
              <input 
                type="text" name="reference_document" value={metadata.reference_document} onChange={handleMetadataChange}
                placeholder="Ej. REM-001245"
                className="block w-full border border-gray-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 transition-colors"
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
              <div key={index} className="flex flex-col sm:flex-row gap-3 items-end p-4 bg-slate-50 border border-slate-200 rounded-lg">
                
                <div className="w-full sm:flex-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Producto (SKU) *</label>
                  <div className="flex gap-2">
                    <select 
                      value={item.sku}
                      onChange={(e) => updateItem(index, 'sku', e.target.value)}
                      required
                      className="block w-full border border-slate-300 rounded-lg p-3 sm:p-2 text-base sm:text-sm bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>Selecciona el producto...</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.sku}>
                          [{p.sku}] - {p.name} (Stock: {p.physical_stock})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setModalTargetIndex(index)}
                      className="whitespace-nowrap px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 text-sm font-semibold transition-colors"
                    >
                      + Nuevo
                    </button>
                  </div>
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Cantidad *</label>
                  <input 
                    type="number" min="1" required
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
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

      <QuickProductModal 
        isOpen={modalTargetIndex !== null} 
        onClose={() => setModalTargetIndex(null)}
        onSuccess={handleProductCreated} 
      />
      
      <QuickProviderModal 
        isOpen={isProviderModalOpen} 
        onClose={() => setIsProviderModalOpen(false)}
        onSuccess={handleProviderCreated} 
      />
    </div>
  );
};