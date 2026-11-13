import { useState, useEffect } from 'react';
import { ProductService } from '../../services/product.service';
import { BudgetService } from '../../services/budget.service';
import type { Product } from '../../types/product';
import { 
  Calculator, Search, Plus, Trash2, Zap, 
  CheckCircle2, Copy, Package, User 
} from 'lucide-react';

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
    
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B50D6] flex items-center justify-center shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Armador de Presupuestos (POS)</h1>
            <p className="text-sm text-slate-500 mt-1">Selecciona productos del catálogo, define la pasarela y genera un link de pago con 48h de validez.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="Buscar por nombre, marca o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-12 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none transition-colors shadow-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 min-h-100 max-h-162.5 overflow-y-auto">
            {isLoadingProducts ? (
              <div className="p-16 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
                <Package className="w-8 h-8 text-slate-300" />
                No se encontraron productos disponibles en el catálogo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map(product => {
                  const basePrice = Number(product.base_price) || 0;
                  const stock = product.physical_stock ?? 0;
                  return (
                    <div key={product.id} className="border border-slate-200 rounded-2xl p-4 bg-white flex flex-col justify-between hover:border-[#5B50D6]/40 hover:shadow-md transition-all">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold border border-slate-200">
                            {product.sku}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            stock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            {stock} un.
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-2 line-clamp-2">{product.name}</h4>
                      </div>

                      <div className="mt-4 flex justify-between items-end pt-3 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Precio Base</span>
                          <span className="font-mono font-extrabold text-[#5B50D6] text-base">
                            ${basePrice.toLocaleString()}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleAddToCart(product)}
                          className="bg-[#1A1D27] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-sm flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Detalle del Presupuesto</h2>
                {cart.length > 0 && (
                  <button 
                    onClick={() => setCart([])}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Limpiar todo
                  </button>
                )}
              </div>
              
              {cart.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-slate-100">
                  El carrito está vacío. Haz clic en "+ Agregar" en los productos del catálogo.
                </div>
              ) : (
                <div className="space-y-3 max-h-85 overflow-y-auto pr-1">
                  {cart.map(item => {
                    const price = Number(item.product?.base_price) || 0;
                    return (
                      <div key={item.product.id} className="flex justify-between items-center bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <div className="flex-1 pr-2">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.product.name}</p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">${price.toLocaleString()} c/u</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.product.id, parseInt(e.target.value, 10) || 0)}
                            className="w-14 border border-slate-200 rounded-lg p-1.5 text-center text-xs font-bold bg-white font-mono shadow-sm"
                          />
                          <button 
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Método de Pago Sugerido</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm"
                >
                  <option value="MP">Mercado Pago (MP)</option>
                  <option value="MOBBEX">Mobbex</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria (Descuento 5%)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID Cliente B2C / Razón Social (Opcional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text"
                    placeholder="UUID del cliente o Razón Social"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] font-mono shadow-sm"
                  />
                </div>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-indigo-900 block">TOTAL PRESUPUESTO</span>
                  <span className="text-[10px] text-slate-500">Impuestos y logística incluidos</span>
                </div>
                <span className="text-2xl font-black text-[#5B50D6] font-mono">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleCreateBudget}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-[#5B50D6] text-white py-3.5 rounded-xl font-bold shadow-sm shadow-indigo-600/25 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  'Procesando...'
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" /> Generar Presupuesto Oficial
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      {createdBudget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="bg-[#1A1D27] p-6 text-white text-center relative">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold">¡Presupuesto Creado!</h3>
              <p className="text-xs text-slate-400 mt-1">El enlace de pago estará activo durante las próximas 48 horas.</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-2.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>ID Presupuesto:</span>
                  <span className="font-mono font-bold text-slate-900">{createdBudget.id}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Monto Total:</span>
                  <span className="font-mono font-bold text-[#5B50D6] text-sm">${createdBudget.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Expira el:</span>
                  <span className="font-bold text-amber-600">{new Date(createdBudget.expiresAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Enlace de Pago para el Cliente</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={checkoutLink} 
                    className="w-full border border-slate-200 rounded-xl p-3 text-xs font-mono bg-slate-50 text-slate-700 shadow-sm"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="whitespace-nowrap px-5 py-3 bg-[#1A1D27] text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setCreatedBudget(null)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
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