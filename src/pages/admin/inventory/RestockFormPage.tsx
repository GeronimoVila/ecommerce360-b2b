import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, FileText, 
  CheckCircle2, ChevronDown, Truck 
} from 'lucide-react';
import { ProductService } from '../../../services/product.service';
import { InventoryService } from '../../../services/inventory.service';
import { SupplierService, type Supplier } from '../../../services/supplier.service';
import type { Product } from '../../../types/product';
import { QuickProductModal } from '../products/QuickProductModal';
import { QuickProviderModal } from './QuickProviderModal';

interface ProductAutocompleteProps {
  products: Product[];
  selectedSku: string;
  onSelect: (sku: string) => void;
}

const ProductAutocomplete = ({ products, selectedSku, onSelect }: ProductAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find(p => p.sku === selectedSku);
  const displayValue = isOpen ? search : (selectedProduct ? `[${selectedProduct.sku}] - ${selectedProduct.name} (Stock: ${selectedProduct.physical_stock})` : '');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
  });

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          placeholder="Seleccionar producto o buscar por SKU..."
          onFocus={() => { setIsOpen(true); setSearch(''); }}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          className="block w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm pr-8"
          required
        />
        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      
      {isOpen && (
        <div className="absolute z-100 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-slate-500 text-center">No se encontraron productos</div>
          ) : (
            filtered.map(p => (
              <div
                key={p.id}
                onClick={() => {
                  onSelect(p.sku);
                  setIsOpen(false);
                  setSearch('');
                }}
                className="p-3 text-sm hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-none flex justify-between items-center transition-colors"
              >
                <span className="font-semibold text-slate-800">[{p.sku}] - {p.name}</span>
                <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono shrink-0 ml-2">Stock: {p.physical_stock}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

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
      ProductService.getAdminCatalog('simple'),
      SupplierService.getAll().catch(err => {
        console.error('ALERTA BACKEND: No se pudieron cargar los proveedores.', err);
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

  const totalUnits = items.reduce((acc, curr) => acc + (typeof curr.quantity === 'number' ? curr.quantity : 0), 0);
  const selectedCount = items.filter(i => i.sku !== '').length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Ingreso de Mercadería</h1>
        <p className="text-sm text-slate-500 mt-1">Registra remitos de proveedores para incrementar el stock físico.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 text-slate-900 font-bold text-base">
            <FileText className="w-5 h-5 text-[#5B50D6]" />
            <h2>Datos del Remito / Factura</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Proveedor *</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select 
                    name="provider_name" 
                    value={metadata.provider_name} 
                    onChange={handleMetadataChange}
                    required
                    className="block w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm appearance-none cursor-pointer pr-8"
                  >
                    <option value="" disabled>Seleccione un proveedor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsProviderModalOpen(true)}
                  className="whitespace-nowrap px-4 py-2.5 bg-[#1A1D27] text-white rounded-xl hover:bg-slate-800 text-sm font-semibold transition-colors shadow-sm"
                >
                  + Nuevo
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nº Documento (Opcional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <FileText className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  name="reference_document" 
                  value={metadata.reference_document} 
                  onChange={handleMetadataChange}
                  placeholder="Ej. REM-008921-X"
                  className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 overflow-visible">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-3 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Productos Ingresados</h2>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  ({selectedCount} productos seleccionados)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Especifica las cantidades verificadas físicamente en rampa de descarga.</p>
            </div>
            <button 
              type="button" 
              onClick={addItem}
              className="w-full sm:w-auto bg-[#1A1D27] text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Añadir Fila
            </button>
          </div>

          <div className="space-y-4">
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse overflow-visible">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Producto / SKU</th>
                    <th className="py-3 px-4">Stock Actual</th>
                    <th className="py-3 px-4 w-36">Cantidad a Ingresar</th>
                    <th className="py-3 px-4">Nuevo Stock Resultante</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm overflow-visible">
                  {items.map((item, index) => {
                    const matchedProd = availableProducts.find(p => p.sku === item.sku);
                    const currentStock = matchedProd ? matchedProd.physical_stock : 0;
                    const isCritical = currentStock <= 5;
                    const qtyNumber = typeof item.quantity === 'number' ? item.quantity : 0;
                    const resultingStock = currentStock + qtyNumber;

                    return (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors overflow-visible">
                        <td className="py-4 px-4 align-middle overflow-visible">
                          <div className="flex gap-2 items-center overflow-visible">
                            <div className="flex-1 overflow-visible">
                              <ProductAutocomplete 
                                products={availableProducts}
                                selectedSku={item.sku}
                                onSelect={(sku) => updateItem(index, 'sku', sku)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setModalTargetIndex(index)}
                              className="px-3 py-2.5 bg-indigo-50 text-[#5B50D6] rounded-xl border border-indigo-100 hover:bg-indigo-100 text-xs font-semibold transition-colors shrink-0"
                              title="Crear producto rápido"
                            >
                              + Nuevo
                            </button>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle">
                          {matchedProd ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                              isCritical ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                              {currentStock} unidades {isCritical ? '(Stock Crítico)' : '(Saludable)'}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">-</span>
                          )}
                        </td>

                        <td className="py-4 px-4 align-middle">
                          <input 
                            type="number" 
                            min="1" 
                            required
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            placeholder="0"
                            className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] font-bold text-center shadow-sm"
                          />
                        </td>

                        <td className="py-4 px-4 align-middle">
                          {matchedProd ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {resultingStock} unidades
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-4 px-4 align-middle text-right">
                          <button 
                            type="button" 
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1} 
                            className={`p-2 rounded-xl transition-colors ${
                              items.length === 1 
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                            }`}
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {items.map((item, index) => {
                const matchedProd = availableProducts.find(p => p.sku === item.sku);
                const currentStock = matchedProd ? matchedProd.physical_stock : 0;
                const qtyNumber = typeof item.quantity === 'number' ? item.quantity : 0;
                const resultingStock = currentStock + qtyNumber;

                return (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Producto / SKU *</label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <ProductAutocomplete 
                            products={availableProducts}
                            selectedSku={item.sku}
                            onSelect={(sku) => updateItem(index, 'sku', sku)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setModalTargetIndex(index)}
                          className="px-3 py-2 bg-indigo-50 text-[#5B50D6] rounded-xl border border-indigo-100 text-xs font-semibold"
                        >
                          + Nuevo
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cantidad a Ingresar *</label>
                        <input 
                          type="number" 
                          min="1" 
                          required
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          placeholder="0"
                          className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white font-bold text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Resultante</label>
                        <div className="p-2 bg-white border border-slate-200 rounded-xl text-center text-sm font-bold text-slate-800">
                          {matchedProd ? `${resultingStock} u.` : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-200">
                      <button 
                        type="button" 
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1} 
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar fila
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5B50D6] flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de unidades a ingresar:</p>
            <p className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
              {totalUnits} <span className="text-sm font-semibold text-slate-600">unidades físicas</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-8">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-8 py-2.5 rounded-xl text-white font-bold transition-all shadow-sm text-sm flex items-center justify-center gap-2 ${
              isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-[#5B50D6] hover:bg-indigo-700 shadow-indigo-600/25'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
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