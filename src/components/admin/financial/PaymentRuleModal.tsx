import { useState, useEffect, useMemo } from 'react';
import { X, Sliders, Search, Check } from 'lucide-react';
import { PaymentRuleService, type PaymentRulePayload, type PaymentRule } from '../../../services/payment-rule.service';
import { CategoryService } from '../../../services/category.service';
import { ProductService } from '../../../services/product.service';
import type { Product } from '../../../types/product';
import { toast } from 'sonner';

interface PaymentRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ruleToEdit?: PaymentRule | null;
}

export const PaymentRuleModal = ({ isOpen, onClose, onSuccess, ruleToEdit }: PaymentRuleModalProps) => {
  const [formData, setFormData] = useState<PaymentRulePayload>({
    payment_method: 'MP',
    installments: 1,
    coefficient: 1.0000,
    is_global: true,
    category_id: '',
    product_id: ''
  });

  const [targetType, setTargetType] = useState<'GLOBAL' | 'CATEGORY' | 'PRODUCT'>('GLOBAL');
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    CategoryService.getTree(true)
      .then((tree) => setCategoryOptions(CategoryService.flattenTree(tree)))
      .catch((err) => console.error('[PaymentRuleModal] Error cargando categorías:', err));

    setIsLoadingProducts(true);
    ProductService.getAdminCatalog()
      .then((list) => setProducts(Array.isArray(list) ? list : []))
      .catch((err) => console.error('[PaymentRuleModal] Error cargando productos:', err))
      .finally(() => setIsLoadingProducts(false));
  }, [isOpen]);

  useEffect(() => {
    if (ruleToEdit) {
      setFormData({
        payment_method: ruleToEdit.payment_method,
        installments: ruleToEdit.installments,
        coefficient: Number(ruleToEdit.coefficient),
        is_global: ruleToEdit.is_global,
        category_id: ruleToEdit.category_id || '',
        product_id: ruleToEdit.product_id || ''
      });
      if (ruleToEdit.is_global) setTargetType('GLOBAL');
      else if (ruleToEdit.category_id) setTargetType('CATEGORY');
      else if (ruleToEdit.product_id) setTargetType('PRODUCT');
    } else {
      setFormData({
        payment_method: 'MP',
        installments: 1,
        coefficient: 1.0000,
        is_global: true,
        category_id: '',
        product_id: ''
      });
      setTargetType('GLOBAL');
      setProductSearch('');
    }
    setIsProductDropdownOpen(false);
  }, [ruleToEdit, isOpen]);

  useEffect(() => {
    if (ruleToEdit?.product_id && products.length > 0) {
      const matched = products.find((p) => p.id === ruleToEdit.product_id);
      if (matched) {
        setProductSearch(matched.name);
      }
    }
  }, [ruleToEdit, products]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === formData.product_id) || null,
    [products, formData.product_id]
  );

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    const activeList = products.filter((p) => p.is_active !== false);
    if (!term) return activeList.slice(0, 50);
    return activeList
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.sku && p.sku.toLowerCase().includes(term))
      )
      .slice(0, 50);
  }, [products, productSearch]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'GLOBAL' | 'CATEGORY' | 'PRODUCT';
    setTargetType(type);
    setFormData((prev) => ({
      ...prev,
      is_global: type === 'GLOBAL',
      category_id: type === 'CATEGORY' ? prev.category_id : '',
      product_id: type === 'PRODUCT' ? prev.product_id : ''
    }));
    if (type !== 'PRODUCT') {
      setProductSearch('');
      setIsProductDropdownOpen(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    setFormData((prev) => ({
      ...prev,
      product_id: product.id
    }));
    setProductSearch(product.name);
    setIsProductDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'CATEGORY' && !formData.category_id) {
      toast.warning('Debes seleccionar una categoría.');
      return;
    }
    if (targetType === 'PRODUCT' && !formData.product_id) {
      toast.warning('Debes seleccionar un producto de la lista.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (ruleToEdit) {
        await PaymentRuleService.update(ruleToEdit.id, formData.coefficient, true);
        toast.success('Regla financiera actualizada con éxito.');
      } else {
        const payload: PaymentRulePayload = {
          ...formData,
          category_id: targetType === 'CATEGORY' ? formData.category_id : null,
          product_id: targetType === 'PRODUCT' ? formData.product_id : null,
        };
        await PaymentRuleService.create(payload);
        toast.success('Regla financiera creada con éxito.');
      }

      onSuccess();
    } catch (error: any) {
      console.error('[PaymentRuleModal] Error:', error);
      toast.error(error.response?.data?.error || 'Error al guardar la regla financiera.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-visible border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5B50D6] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {ruleToEdit ? 'Editar Regla Financiera' : 'Nueva Regla Financiera'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Método de Pago *
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                disabled={!!ruleToEdit}
                required
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 disabled:text-slate-500 shadow-sm"
              >
                <option value="MP">Mercado Pago (MP)</option>
                <option value="MOBBEX">Mobbex</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Cuotas *
              </label>
              <input
                type="number"
                name="installments"
                min="1"
                max="24"
                value={formData.installments}
                onChange={handleChange}
                disabled={!!ruleToEdit}
                required
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 disabled:text-slate-500 shadow-sm font-mono"
              />
            </div>
          </div>

          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/70">
            <label className="block text-xs font-bold text-[#5B50D6] mb-1">Coeficiente Financiero *</label>
            <p className="text-xs text-slate-500 mb-2.5">Ej: 1.0000 = Sin interés. 1.1500 = 15% de recargo.</p>
            <input
              type="number"
              name="coefficient"
              step="0.0001"
              min="0.1000"
              max="3.0000"
              value={formData.coefficient}
              onChange={handleChange}
              required
              className="w-full border border-indigo-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] font-mono font-bold text-slate-900 shadow-sm"
            />
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Alcance de la Regla (Jerarquía) *
              </label>
              <select
                value={targetType}
                onChange={handleTargetChange}
                disabled={!!ruleToEdit}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 disabled:text-slate-500 shadow-sm"
              >
                <option value="GLOBAL">Global (Aplica a todo el catálogo)</option>
                <option value="CATEGORY">Específica de Categoría</option>
                <option value="PRODUCT">Específica de Producto</option>
              </select>
            </div>

            {targetType === 'CATEGORY' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Seleccionar Categoría o Subcategoría *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id || ''}
                  onChange={handleChange}
                  disabled={!!ruleToEdit}
                  required
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 disabled:text-slate-500 shadow-sm"
                >
                  <option value="">Selecciona una categoría...</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Si eliges una categoría padre, la regla se heredará automáticamente a todas sus subcategorías.
                </p>
              </div>
            )}

            {targetType === 'PRODUCT' && (
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Seleccionar Producto *
                </label>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={productSearch}
                    onFocus={() => !ruleToEdit && setIsProductDropdownOpen(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductSearch(val);
                      setIsProductDropdownOpen(true);
                      if (selectedProduct && selectedProduct.name !== val) {
                        setFormData((prev) => ({ ...prev, product_id: '' }));
                      }
                    }}
                    disabled={!!ruleToEdit}
                    placeholder={isLoadingProducts ? 'Cargando productos...' : 'Buscar producto por nombre o SKU...'}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] disabled:bg-slate-100 disabled:text-slate-500 shadow-sm"
                  />
                  {!ruleToEdit && productSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearch('');
                        setFormData((prev) => ({ ...prev, product_id: '' }));
                        setIsProductDropdownOpen(true);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {selectedProduct && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Seleccionado: {selectedProduct.name} {selectedProduct.sku ? `(SKU: ${selectedProduct.sku})` : ''}
                  </p>
                )}

                {!ruleToEdit && isProductDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                    {filteredProducts.length === 0 ? (
                      <div className="px-3.5 py-3 text-xs text-slate-400 text-center">
                        No se encontraron productos con "{productSearch}".
                      </div>
                    ) : (
                      filteredProducts.map((product) => {
                        const isSelected = product.id === formData.product_id;
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelectProduct(product)}
                            className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between hover:bg-indigo-50/70 transition-colors ${
                              isSelected ? 'bg-indigo-50 text-[#5B50D6] font-bold' : 'text-slate-800'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold truncate">{product.name}</p>
                              {product.sku && (
                                <p className="text-[10px] font-mono text-slate-400">SKU: {product.sku}</p>
                              )}
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#5B50D6] shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
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
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#5B50D6] rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-600/25 transition-all"
            >
              {isSubmitting ? 'Guardando...' : ruleToEdit ? 'Actualizar Coeficiente' : 'Crear Regla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};