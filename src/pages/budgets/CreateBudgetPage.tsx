import { useState, useEffect } from 'react';
import { ProductService } from '../../services/product.service';
import { BudgetService } from '../../services/budget.service';
import type { Product } from '../../types/product';

interface CartItem {
  product: Product;
  quantity: number;
}

export const CreateBudgetPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'MP' | 'MOBBEX' | 'TRANSFERENCIA'>('MP');
  const [customerId, setCustomerId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBudget, setCreatedBudget] = useState<{ id: string; total: number; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const B2C_URL = import.meta.env.VITE_B2C_URL || 'http://localhost:3000';

  useEffect(() => {
    ProductService.getPosCatalog('simple')
      .then((res: any) => {
        let extractedProducts: Product[] = [];

        if (Array.isArray(res)) {
          extractedProducts = res;
        } else if (typeof res === 'object' && res !== null) {
          const obj = res as Record<string, unknown>;
          if (Array.isArray(obj.data)) {
            extractedProducts = obj.data as Product[];
          } else if (Array.isArray(obj.products)) {
            extractedProducts = obj.products as Product[];
          }
        }

        setProducts(extractedProducts.filter((p) => p && p.is_active));
      })
      .catch((err) => {
        console.error('[POS] Error cargando catálogo de productos:', err);
        setProducts([]);
      })
      .finally(() => setIsLoadingProducts(false));
  }, []);

  const safeProducts = Array.isArray(products) ? products : [];
  const filteredProducts = safeProducts.filter(p => {
    if (!p) return false;
    const name = p.name ? String(p.name).toLowerCase() : '';
    const sku = p.sku ? String(p.sku).toLowerCase() : '';
    const term = searchTerm.toLowerCase();
    return name.includes(term) || sku.includes(term);
  });

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((acc, item) => {
      const price = Number(item.product?.base_price) || 0;
      return acc + (price * item.quantity);
    }, 0);
  };

  const handleCreateBudget = async () => {
    if (cart.length === 0) {
      alert('Debes agregar al menos un producto al presupuesto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        paymentMethod,
        customerId: customerId.trim() || undefined
      };

      const res = await BudgetService.create(payload);
      setCreatedBudget({
        id: res.budget.id,
        total: Number(res.budget.total_amount) || 0,
        expiresAt: res.budget.expires_at
      });
      setCart([]);
    } catch (error: any) {
      console.error('[POS Budget] Error:', error);
      alert(error.response?.data?.error || 'Error al generar el presupuesto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkoutLink = createdBudget ? `${B2C_URL}/checkout/budget/${createdBudget.id}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(checkoutLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Armador de Presupuestos (POS)</h1>
        <p className="text-sm text-gray-500 mt-1">Selecciona productos del catálogo, define la pasarela y genera un link de pago con 48h de validez.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <input 
              type="text"
              placeholder="🔍 Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-75 max-h-150 overflow-y-auto">
            {isLoadingProducts ? (
              <div className="p-12 text-center text-gray-500 font-medium">Cargando catálogo...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">No se encontraron productos disponibles en el catálogo.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map(product => {
                  const basePrice = Number(product.base_price) || 0;
                  return (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-3 bg-slate-50 flex flex-col justify-between hover:border-blue-300 transition-colors">
                      <div>
                        <span className="text-[10px] font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-700 font-bold">{product.sku}</span>
                        <h4 className="font-bold text-gray-800 text-sm mt-1 line-clamp-2">{product.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">Stock Físico: <span className="font-semibold text-gray-700">{product.physical_stock ?? 0}</span></p>
                      </div>
                      <div className="mt-3 flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="font-extrabold text-blue-900 text-base">${basePrice.toLocaleString()}</span>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 active:scale-95 transition-all"
                        >
                          + Agregar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Detalle del Presupuesto</h2>
              
              {cart.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm italic">
                  El carrito está vacío. Haz clic en "+ Agregar" en los productos del catálogo.
                </div>
              ) : (
                <div className="space-y-3 max-h-87.5 overflow-y-auto pr-1">
                  {cart.map(item => {
                    const price = Number(item.product?.base_price) || 0;
                    return (
                      <div key={item.product.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex-1 pr-2">
                          <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.product.name}</p>
                          <p className="text-[11px] text-gray-500">${price.toLocaleString()} c/u</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.product.id, parseInt(e.target.value, 10) || 0)}
                            className="w-14 border rounded p-1 text-center text-sm font-bold bg-white"
                          />
                          <button 
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold p-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Método de Pago Sugerido</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border rounded-lg p-2.5 text-sm bg-white font-medium"
                >
                  <option value="MP">Mercado Pago (MP)</option>
                  <option value="MOBBEX">Mobbex</option>
                  <option value="TRANSFERENCIA">Transferencia Directa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ID Cliente B2C (Opcional)</label>
                <input 
                  type="text"
                  placeholder="UUID del cliente registrado"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full border rounded-lg p-2.5 text-sm font-mono"
                />
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center">
                <span className="text-sm font-medium text-slate-300">Total Estimado</span>
                <span className="text-2xl font-black">${calculateTotal().toLocaleString()}</span>
              </div>

              <button
                onClick={handleCreateBudget}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Procesando...' : '⚡ Generar Enlace de Pago'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {createdBudget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="bg-green-600 p-6 text-white text-center">
              <span className="text-4xl mb-2 block">✅</span>
              <h3 className="text-xl font-extrabold">¡Presupuesto Creado!</h3>
              <p className="text-xs text-green-100 mt-1">El enlace de pago estará activo durante las próximas 48 horas.</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border p-4 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>ID Presupuesto:</span>
                  <span className="font-mono font-bold text-gray-800">{createdBudget.id}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Monto Total:</span>
                  <span className="font-bold text-gray-900 text-sm">${createdBudget.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Expira el:</span>
                  <span className="font-bold text-amber-700">{new Date(createdBudget.expiresAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Enlace de Pago para el Cliente</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={checkoutLink} 
                    className="w-full border rounded-lg p-2.5 text-xs font-mono bg-slate-50 text-slate-700"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="whitespace-nowrap px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button 
                  onClick={() => setCreatedBudget(null)}
                  className="px-6 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors"
                >
                  Cerrar y Crear Otro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};