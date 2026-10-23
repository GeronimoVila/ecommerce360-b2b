import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductService } from '../../../services/product.service';
import type { Product } from '../../../types/product';

type FilterState = 'ALL' | 'ACTIVE' | 'INACTIVE';

export const CatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeFilter, setActiveFilter] = useState<FilterState>('ACTIVE');

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await ProductService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('[Arquitectura] Error cargando catálogo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
    if (activeFilter === 'ACTIVE') return p.is_active;
    if (activeFilter === 'INACTIVE') return !p.is_active;
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Gestor de Catálogo</h1>
        <Link 
          to="/admin/catalog/new" 
          className="w-full sm:w-auto text-center bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
        >
          + Nuevo Producto
        </Link>
      </div>

      <div className="flex space-x-2 md:space-x-1 border-b border-gray-200 mb-6 overflow-x-auto hide-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveFilter('ACTIVE')}
          className={`py-3 md:py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeFilter === 'ACTIVE' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Activos ({products.filter(p => p.is_active).length})
        </button>
        <button
          onClick={() => setActiveFilter('INACTIVE')}
          className={`py-3 md:py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeFilter === 'INACTIVE' 
              ? 'border-red-600 text-red-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Inactivos ({products.filter(p => !p.is_active).length})
        </button>
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`py-3 md:py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeFilter === 'ALL' 
              ? 'border-gray-800 text-gray-800' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Todos ({products.length})
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
          No hay productos en esta vista.
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-4">
            {filteredProducts.map((p: any) => (
              <div 
                key={p.id} 
                className={`bg-white p-4 rounded-xl border shadow-sm ${!p.is_active ? 'opacity-75 bg-gray-50' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">{p.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">SKU: {p.sku}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                    p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {p.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-gray-500 text-xs">Precio (B2C)</p>
                    <p className="font-semibold text-gray-900">${Number(p.base_price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Costo (B2B)</p>
                    <p className="font-medium text-gray-700">${Number(p.purchase_cost).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Comisión</p>
                    <p className="font-bold text-blue-600">{Number(p.commission_rate)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Stock</p>
                    <p className={`font-medium ${p.physical_stock <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                      {p.physical_stock}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                  <Link 
                    to={`/admin/catalog/edit/${p.id}`} 
                    className="flex-1 text-center bg-blue-50 text-blue-700 py-2 rounded-lg font-medium text-sm hover:bg-blue-100 transition-colors"
                  >
                    Editar
                  </Link>
                  <button 
                    onClick={() => handleToggleStatus(p)} 
                    className={`flex-1 text-center py-2 rounded-lg font-medium text-sm transition-colors ${
                      p.is_active 
                        ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {p.is_active ? 'Dar de baja' : 'Reactivar'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-sm font-semibold text-gray-600">Nombre</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Precio (B2C)</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Costo (B2B)</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Comisión</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Stock</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Estado</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p: any) => (
                  <tr key={p.id} className={`border-b hover:bg-gray-50 transition-colors ${!p.is_active ? 'bg-gray-50 opacity-75' : ''}`}>
                    <td className="p-4 font-medium text-gray-800">
                      {p.name}
                      <div className="text-xs text-gray-400 font-mono mt-1">{p.sku}</div>
                    </td>
                    <td className="p-4">${Number(p.base_price).toFixed(2)}</td>
                    <td className="p-4">${Number(p.purchase_cost).toFixed(2)}</td>
                    <td className="p-4 font-semibold text-blue-600">{Number(p.commission_rate)}%</td>
                    <td className="p-4">
                      <span className={`font-medium ${p.physical_stock <= 5 ? 'text-red-600' : 'text-gray-800'}`}>
                        {p.physical_stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        p.is_active ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <Link to={`/admin/catalog/edit/${p.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Editar
                      </Link>
                      <button 
                        onClick={() => handleToggleStatus(p)} 
                        className={`text-sm font-medium transition-colors ${p.is_active ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {p.is_active ? 'Dar de baja' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};