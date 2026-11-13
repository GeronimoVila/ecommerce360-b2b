import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Plus, Box, Layers,
  Edit3, Command, Power
} from 'lucide-react'; 
import { ProductService } from '../../../services/product.service';
import type { Product } from '../../../types/product';

type DomainType = 'simple' | 'combo';
type FilterState = 'ALL' | 'ACTIVE' | 'INACTIVE';
type StockFilterState = 'ALL' | 'IN_STOCK' | 'LOW_STOCK';

export const CatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [domainFilter, setDomainFilter] = useState<DomainType>('simple');
  const [activeFilter, setActiveFilter] = useState<FilterState>('ACTIVE');
  const [stockFilter, setStockFilter] = useState<StockFilterState>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await ProductService.getAdminCatalog(domainFilter);
      setProducts(data);
    } catch (error) {
      console.error('[Arquitectura] Error cargando catálogo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [domainFilter]);

  const handleToggleStatus = async (product: Product) => {
    try {
      await ProductService.toggleStatus(product.id, product.is_active);
      fetchProducts(); 
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Hubo un error al actualizar el estado del producto.');
    }
  };

  const filteredProducts = products.filter(p => {
    if (activeFilter === 'ACTIVE' && !p.is_active) return false;
    if (activeFilter === 'INACTIVE' && p.is_active) return false;
    if (stockFilter === 'LOW_STOCK' && p.physical_stock > 5) return false;
    if (stockFilter === 'IN_STOCK' && p.physical_stock <= 5) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(term);
      const matchesSku = p.sku.toLowerCase().includes(term);
      if (!matchesName && !matchesSku) return false;
    }
    return true;
  });

  const countActive = products.filter(p => p.is_active).length;
  const countInactive = products.filter(p => !p.is_active).length;
  const countAll = products.length;

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Gestor de Catálogo</h1>
          <p className="text-sm text-slate-500 mt-1">Administración de inventario físico y agrupaciones comerciales B2B.</p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <Link 
            to="/admin/catalog/combo/new" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1A1D27] text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-slate-800 transition-colors font-semibold text-sm"
          >
            <Layers className="w-4 h-4" />
            Armar Combo
          </Link>
          <Link 
            to="/admin/catalog/new" 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5B50D6] text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-white p-1 rounded-xl flex border border-slate-200 shadow-sm w-max">
          <button
            onClick={() => setDomainFilter('simple')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              domainFilter === 'simple'
                ? 'bg-[#F8FAFC] text-[#5B50D6] shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Box className="w-4 h-4" />
            Productos Físicos
          </button>
          <button
            onClick={() => setDomainFilter('combo')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              domainFilter === 'combo'
                ? 'bg-[#F8FAFC] text-[#5B50D6] shadow-sm border border-slate-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Combos Armados
          </button>
        </div>
        {domainFilter === 'combo' && (
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200">
            14 combos
          </span>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3 bg-transparent">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por SKU, nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] sm:text-sm transition-colors shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
              <Command className="w-3 h-3" /> K
            </kbd>
          </div>
        </div>

        <div className="relative shrink-0 w-full md:w-56">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilterState)}
            className="block w-full pl-10 pr-10 py-2.5 text-sm font-medium text-slate-700 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] rounded-xl bg-white border cursor-pointer shadow-sm appearance-none"
          >
            <option value="ALL">Todo el Inventario</option>
            <option value="IN_STOCK">En Stock (≥ 5)</option>
            <option value="LOW_STOCK">Stock Crítico (≤ 5)</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-6 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveFilter('ACTIVE')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeFilter === 'ACTIVE' 
              ? 'border-[#5B50D6] text-[#5B50D6]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Activos
          <span className={`px-2 py-0.5 rounded-md text-[10px] ${activeFilter === 'ACTIVE' ? 'bg-[#5B50D6]/10 text-[#5B50D6]' : 'bg-slate-100 text-slate-500'}`}>
            {countActive}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('INACTIVE')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeFilter === 'INACTIVE' 
              ? 'border-[#5B50D6] text-[#5B50D6]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Inactivos
          <span className={`px-2 py-0.5 rounded-md text-[10px] ${activeFilter === 'INACTIVE' ? 'bg-[#5B50D6]/10 text-[#5B50D6]' : 'bg-slate-100 text-slate-500'}`}>
            {countInactive}
          </span>
        </button>
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeFilter === 'ALL' 
              ? 'border-[#5B50D6] text-[#5B50D6]' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Todos
          <span className={`px-2 py-0.5 rounded-md text-[10px] ${activeFilter === 'ALL' ? 'bg-[#5B50D6]/10 text-[#5B50D6]' : 'bg-slate-100 text-slate-500'}`}>
            {countAll}
          </span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm flex flex-col items-center">
          <Search className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-lg font-bold text-slate-900">No se encontraron resultados</p>
          <p className="text-sm mt-1">Ajusta tu búsqueda o los filtros aplicados.</p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-4">
            {filteredProducts.map((p: any) => (
               <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex gap-3">
                     <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                       <Box className="w-6 h-6 text-slate-400" />
                     </div>
                     <div>
                       <h3 className="font-bold text-slate-900 text-sm leading-tight">{p.name}</h3>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">SKU: {p.sku}</span>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 text-sm mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Precio Venta</p>
                     <p className="font-extrabold text-slate-900">${Number(p.base_price).toLocaleString('es-AR')}</p>
                   </div>
                   <div>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Stock</p>
                     <p className={`font-bold ${p.physical_stock <= 5 ? 'text-red-600' : 'text-emerald-600'}`}>
                       {p.physical_stock} unidades
                     </p>
                   </div>
                 </div>
 
                 <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                   <Link 
                     to={domainFilter === 'simple' ? `/admin/catalog/edit/${p.id}` : `/admin/catalog/combo/edit/${p.id}`} 
                     className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-50 transition-colors"
                   >
                     Editar
                   </Link>
                   <button 
                     onClick={() => handleToggleStatus(p)} 
                     className={`px-4 py-2 rounded-lg font-semibold text-xs transition-colors ${
                       p.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                     }`}
                   >
                     {p.is_active ? 'Pausar' : 'Activar'}
                   </button>
                 </div>
               </div>
            ))}
          </div>

          <div className="hidden md:block bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-white">
                  <th className="px-6 py-4">Producto & SKU</th>
                  <th className="px-6 py-4">Categoría</th>
                  <th className="px-6 py-4">Precio Mayorista (B2B)</th>
                  <th className="px-6 py-4 w-48">Disponibilidad & Stock</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((p: any) => {
                  const isCritical = p.physical_stock <= 5;
                  const stockPercentage = Math.min((p.physical_stock / 50) * 100, 100);
                  const marginPercentage = p.base_price > 0 ? (((p.base_price - p.purchase_cost) / p.base_price) * 100).toFixed(0) : 0;
                  const marginAbsolute = (p.base_price - p.purchase_cost);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors bg-white group">
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                            <Box className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm max-w-50 leading-tight truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="text-[10px] text-slate-500 truncate max-w-20">Marca Gral</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-semibold text-slate-600 bg-white">
                          General
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900 text-sm">
                          ${Number(p.base_price).toLocaleString('es-AR')} <span className="text-[10px] font-bold text-slate-400">ARS</span>
                        </p>
                        <div className="text-[10px] mt-1 leading-tight">
                          <span className="text-slate-500">Margen sug: </span>
                          <span className="font-bold text-emerald-600">{marginPercentage}% </span>
                          <span className="text-slate-400 font-mono">(+${marginAbsolute.toLocaleString('es-AR')})</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex justify-between items-end mb-1.5">
                          <span className={`text-xs font-bold ${isCritical ? 'text-red-600' : 'text-emerald-600'}`}>
                            {p.physical_stock} unidades
                          </span>
                          <span className={`text-[9px] font-bold uppercase ${isCritical ? 'text-red-400 bg-red-50 px-1.5 rounded' : 'text-emerald-400'}`}>
                            {isCritical ? 'Stock Crítico' : 'Saludable'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : 'bg-emerald-400'}`}
                            style={{ width: `${stockPercentage}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                          p.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          {p.is_active ? 'Activo' : 'Pausado'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link 
                            to={domainFilter === 'simple' ? `/admin/catalog/edit/${p.id}` : `/admin/catalog/combo/edit/${p.id}`} 
                            className="p-1.5 text-slate-400 hover:text-[#5B50D6] hover:bg-[#5B50D6]/10 rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleToggleStatus(p)} 
                            className={`p-1.5 rounded-md transition-colors ${
                              p.is_active 
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={p.is_active ? 'Dar de baja' : 'Reactivar'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};