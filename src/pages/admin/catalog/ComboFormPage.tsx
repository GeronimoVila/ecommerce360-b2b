import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Layers, Plus, Trash2, Box, AlertCircle } from 'lucide-react';
import { ProductService } from '../../../services/product.service';
import { MediaService } from '../../../services/media.service';
import { CategoryCascader } from '../../../components/admin/catalog/CategoryCascader';
import { ProductImageUploader } from '../../../components/admin/catalog/ProductImageUploader';
import type { Product, ProductImage } from '../../../types/product';

interface FieldErrors {
  sku?: string;
  name?: string;
  general?: string;
}

export const ComboFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category_id: '',
    base_price: 0,
    commission_rate: 0,
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [images, setImages] = useState<ProductImage[]>([]);
  const [sessionDraftIds, setSessionDraftIds] = useState<string[]>([]);
  const [hadInitialImages, setHadInitialImages] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [isCategoryLeaf, setIsCategoryLeaf] = useState(false);
  const [parts, setParts] = useState<{ sku: string; quantity: number }[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(isEditMode);

  useEffect(() => {
    const initForm = async () => {
      try {
        const data = await ProductService.getAdminCatalog('simple');
        const baseProducts = data.filter((p) => !p.is_combo && p.is_active);
        setAvailableProducts(baseProducts);

        if (isEditMode && id) {
          const comboData = await ProductService.getById(id);

          setFormData({
            sku: comboData.sku || '',
            name: comboData.name || '',
            category_id: comboData.category_id || comboData.category?.id || '',
            base_price: Number(comboData.base_price) || 0,
            commission_rate: Number(comboData.commission_rate) || 0,
          });

          if (comboData.combo_parts) {
            const mappedParts = comboData.combo_parts.map((cp: any) => ({
              sku: cp.product.sku,
              quantity: cp.quantity,
            }));
            setParts(mappedParts);
          }

          const existingImages: ProductImage[] = Array.isArray(comboData.images) ? comboData.images : [];
          setImages(existingImages);
          setHadInitialImages(existingImages.length > 0);
        }
      } catch (error) {
        console.error('Error inicializando combo:', error);
        alert('No se pudo cargar la información del combo.');
        navigate('/admin/catalog');
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    initForm();
  }, [id, isEditMode, navigate]);

  const originalTotalValue = parts.reduce((acc, part) => {
    const product = availableProducts.find((p) => p.sku === part.sku);
    return acc + Number(product?.purchase_cost || product?.base_price || 0) * part.quantity;
  }, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (name === 'sku' || name === 'name') {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const addPart = () => setParts([...parts, { sku: '', quantity: 1 }]);

  const updatePart = (index: number, field: 'sku' | 'quantity', value: string | number) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const removePart = (index: number) => setParts(parts.filter((_, i) => i !== index));

  const handleCancel = async () => {
    if (isCanceling) return;
    setIsCanceling(true);
    try {
      if (sessionDraftIds.length > 0) {
        await Promise.allSettled(
          sessionDraftIds.map((draftId) => MediaService.deleteImage(draftId))
        );
      }
    } finally {
      navigate('/admin/catalog');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingImages || isCanceling) return;

    const errors: FieldErrors = {};
    if (!formData.sku.trim()) errors.sku = 'El SKU del combo es obligatorio.';
    if (!formData.name.trim()) errors.name = 'El nombre comercial es obligatorio.';

    if (!formData.category_id || !isCategoryLeaf) {
      errors.general = 'Debes seleccionar una subcategoría final (hoja) válida para el combo.';
    } else if (parts.length === 0) {
      errors.general = 'El combo debe tener al menos 1 producto componente.';
    } else if (parts.some((p) => p.sku === '' || p.quantity <= 0)) {
      errors.general = 'Verifica que todos los componentes tengan un producto seleccionado y cantidad mayor a 0.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    const payload = {
      sku: formData.sku.trim().toUpperCase(),
      name: formData.name.trim(),
      category_id: formData.category_id,
      base_price: Number(formData.base_price),
      commission_rate: Number(formData.commission_rate),
      parts: parts.map((p) => ({ sku: p.sku, quantity: Number(p.quantity) })),
    };

    try {
      let targetComboId = id;

      if (isEditMode && id) {
        await ProductService.updateCombo(id, payload);
      } else {
        const createdCombo = await ProductService.createCombo(payload);
        targetComboId = createdCombo.id;
      }

      if (targetComboId && (images.length > 0 || hadInitialImages)) {
        await MediaService.syncProductImages(
          targetComboId,
          images.map((img) => ({
            id: img.id,
            alt_text: img.alt_text || payload.name,
            is_primary: img.is_primary,
          }))
        );
      }

      navigate('/admin/catalog');
    } catch (error: any) {
      console.error('[Arquitectura] Error guardando combo:', error);
      const status = error.response?.status;
      const backendError = error.response?.data?.error || 'Hubo un error al guardar el combo.';
      const conflictField = error.response?.data?.field as 'sku' | 'name' | undefined;

      if (status === 409 && conflictField) {
        setFieldErrors({ [conflictField]: backendError });
      } else {
        setFieldErrors({ general: backendError });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingInitialData) {
    return (
      <div className="p-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
      </div>
    );
  }

  const isSubmitDisabled = isSubmitting || isUploadingImages || isCanceling || !isCategoryLeaf;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      <div>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isCanceling || isUploadingImages}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-[#5B50D6] transition-colors mb-4 group disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Volver al catálogo
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEditMode ? 'Editar Combo' : 'Armador de Combos'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          El stock virtual se calculará automáticamente vía Redis basado en los componentes seleccionados.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {fieldErrors.general && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{fieldErrors.general}</span>
          </div>
        )}

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#5B50D6]" /> Información del Paquete
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                SKU del Combo *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                disabled={isEditMode}
                className={`mt-1 block w-full border rounded-xl p-3 bg-white text-slate-900 disabled:bg-slate-100 focus:ring-2 transition-colors text-sm shadow-sm font-mono ${
                  fieldErrors.sku
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]'
                }`}
                placeholder="Ej. COMBO-VERANO-24"
              />
              {fieldErrors.sku && (
                <p className="mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {fieldErrors.sku}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Nombre Comercial *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ej. Kit Residencial Inverter"
                className={`mt-1 block w-full border rounded-xl p-3 bg-white text-slate-900 focus:ring-2 transition-colors text-sm shadow-sm ${
                  fieldErrors.name
                    ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]'
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {fieldErrors.name}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <CategoryCascader
              selectedCategoryId={formData.category_id}
              onChange={(catId, isLeaf) => {
                setFormData((prev) => ({ ...prev, category_id: catId }));
                setIsCategoryLeaf(isLeaf);
              }}
            />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <ProductImageUploader
              images={images}
              productName={formData.name}
              onChange={setImages}
              onDraftUploaded={(imageId) => setSessionDraftIds((prev) => [...prev, imageId])}
              onUploadingChange={setIsUploadingImages}
            />
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Box className="w-5 h-5 text-[#5B50D6]" /> Componentes (Partes)
            </h2>
            <button
              type="button"
              onClick={addPart}
              className="bg-[#1A1D27] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Añadir Producto
            </button>
          </div>

          <div className="space-y-3">
            {parts.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm bg-slate-50/50">
                No has añadido productos componentes a este combo.
              </div>
            ) : (
              parts.map((part, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <div className="w-full sm:flex-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Producto
                    </label>
                    <select
                      value={part.sku}
                      onChange={(e) => updatePart(index, 'sku', e.target.value)}
                      required
                      className="block w-full border border-slate-200 rounded-xl p-3 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm cursor-pointer"
                    >
                      <option value="" disabled>
                        Selecciona un producto físico...
                      </option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.sku}>
                          {p.name} (${Number(p.base_price).toFixed(2)}) - SKU: {p.sku}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-28">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={part.quantity}
                      onChange={(e) => updatePart(index, 'quantity', Number(e.target.value))}
                      className="block w-full border border-slate-200 rounded-xl p-3 text-sm bg-white text-slate-900 font-mono shadow-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePart(index)}
                    className="w-full sm:w-auto mt-2 sm:mt-0 p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                    title="Eliminar componente"
                  >
                    <Trash2 className="w-4 h-4" /> <span className="sm:hidden">Eliminar</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Precios y Comisiones
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Precio Final del Combo ($) *
              </label>
              <input
                type="number"
                name="base_price"
                step="0.01"
                min="0"
                required
                value={formData.base_price}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Comisión Vendedor (%) *
              </label>
              <input
                type="number"
                name="commission_rate"
                step="0.1"
                min="0"
                required
                value={formData.commission_rate}
                onChange={handleChange}
                className="mt-1 block w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Suma del costo individual de componentes:
              </p>
              <p className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                ${originalTotalValue.toFixed(2)}
              </p>
            </div>
            {Number(formData.base_price) > 0 && (
              <div
                className={`px-4 py-2 rounded-xl text-xs font-bold ${
                  Number(formData.base_price) < originalTotalValue
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                Margen Bruto: ${(Number(formData.base_price) - originalTotalValue).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-10">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting || isUploadingImages || isCanceling}
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 text-sm transition-colors disabled:opacity-50"
          >
            {isCanceling ? 'Limpiando...' : 'Cancelar'}
          </button>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-sm text-sm ${
              isSubmitDisabled
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-[#5B50D6] hover:bg-indigo-700 shadow-indigo-600/25'
            }`}
          >
            {isUploadingImages
              ? 'Subiendo imágenes...'
              : isSubmitting
              ? 'Guardando...'
              : isEditMode
              ? 'Actualizar Combo'
              : 'Crear Combo'}
          </button>
        </div>
      </form>
    </div>
  );
};