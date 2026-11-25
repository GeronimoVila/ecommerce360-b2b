import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign, Percent, BarChart3, AlertCircle } from 'lucide-react';
import { ProductService } from '../../../services/product.service';
import { MediaService } from '../../../services/media.service';
import { CategoryCascader } from '../../../components/admin/catalog/CategoryCascader';
import { ProductImageUploader } from '../../../components/admin/catalog/ProductImageUploader';
import type { ProductImage } from '../../../types/product';

interface FieldErrors {
  sku?: string;
  name?: string;
  general?: string;
}

const computeFinalPrice = (cost: number, vat: number, margin: number): number => {
  const costWithVat = cost * (1 + vat / 100);
  const rawFinal = costWithVat * (1 + margin / 100);
  return Math.round(rawFinal * 100) / 100;
};

const computeMarginFromFinalPrice = (cost: number, vat: number, finalPrice: number): number => {
  const costWithVat = cost * (1 + vat / 100);
  if (costWithVat <= 0) return 0;
  const rawMargin = (finalPrice / costWithVat - 1) * 100;
  return Number(rawMargin.toFixed(6));
};

export const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<any>({
    sku: '',
    name: '',
    category_id: '',
    purchase_cost: 0,
    vat_rate: 21,
    profit_margin: 0,
    physical_stock: 0,
    commission_rate: 0,
  });

  const [finalPriceInput, setFinalPriceInput] = useState<number | ''>(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [images, setImages] = useState<ProductImage[]>([]);
  const [sessionDraftIds, setSessionDraftIds] = useState<string[]>([]);
  const [hadInitialImages, setHadInitialImages] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [isCategoryLeaf, setIsCategoryLeaf] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      setIsLoadingProduct(true);
      ProductService.getById(id)
        .then((product: any) => {
          const cost = Number(product.purchase_cost ?? 0);
          const vat = Number(product.vat_rate ?? 21);
          const margin = Number(product.profit_margin ?? 0);

          setFormData({
            sku: product.sku || '',
            name: product.name || '',
            category_id: product.category_id || product.category?.id || '',
            purchase_cost: cost,
            vat_rate: vat,
            profit_margin: margin,
            physical_stock: Number(product.physical_stock ?? 0),
            commission_rate: Number(product.commission_rate ?? 0),
          });

          setFinalPriceInput(computeFinalPrice(cost, vat, margin));

          const existingImages: ProductImage[] = Array.isArray(product.images) ? product.images : [];
          setImages(existingImages);
          setHadInitialImages(existingImages.length > 0);
        })
        .catch((err) => {
          console.error('Error hidratando datos:', err);
          setFieldErrors({
            general: err.response?.data?.error || 'No se pudieron cargar los datos del producto.',
          });
        })
        .finally(() => setIsLoadingProduct(false));
    }
  }, [id, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (name === 'sku' || name === 'name') {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }

    const parsedValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;

    setFormData((prev: any) => {
      const updated = {
        ...prev,
        [name]: parsedValue,
      };

      if (name === 'purchase_cost' || name === 'vat_rate' || name === 'profit_margin') {
        const cost = Number(updated.purchase_cost) || 0;
        const vat = Number(updated.vat_rate) || 0;
        const margin = Number(updated.profit_margin) || 0;
        setFinalPriceInput(computeFinalPrice(cost, vat, margin));
      }

      return updated;
    });
  };

  const handleFinalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setFieldErrors((prev) => ({ ...prev, general: undefined }));

    if (raw === '') {
      setFinalPriceInput('');
      setFormData((prev: any) => ({ ...prev, profit_margin: 0 }));
      return;
    }

    const numericFinalPrice = Number(raw);
    setFinalPriceInput(numericFinalPrice);

    const cost = Number(formData.purchase_cost) || 0;
    const vat = Number(formData.vat_rate) || 0;
    const equivalentMargin = computeMarginFromFinalPrice(cost, vat, numericFinalPrice);

    setFormData((prev: any) => ({
      ...prev,
      profit_margin: equivalentMargin,
    }));
  };

  const validatePayload = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.sku || formData.sku.trim() === '') {
      errors.sku = 'El SKU es obligatorio.';
    }
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'El nombre del producto es obligatorio.';
    }
    if (!formData.category_id || !isCategoryLeaf) {
      errors.general = 'Debes seleccionar una subcategoría final (hoja) válida.';
    }

    const cost = Number(formData.purchase_cost) || 0;
    const vat = Number(formData.vat_rate) || 0;
    const costWithVat = cost * (1 + vat / 100);

    if (finalPriceInput === '' || Number(finalPriceInput) < 0) {
      errors.general = 'El precio final no puede estar vacío ni ser negativo.';
    } else if (costWithVat > 0 && Number(finalPriceInput) < Math.round(costWithVat * 100) / 100) {
      errors.general = `El precio final ($${Number(finalPriceInput).toFixed(2)}) no puede ser menor al costo con IVA ($${costWithVat.toFixed(2)}).`;
    } else if (costWithVat === 0 && Number(finalPriceInput) > 0) {
      errors.general = 'Debes ingresar un Costo de Compra mayor a $0 para calcular el margen equivalente.';
    }

    const numericFields = ['purchase_cost', 'vat_rate', 'profit_margin', 'commission_rate', 'physical_stock'];
    for (const field of numericFields) {
      if (errors.general) break;
      if (formData[field] === '' || formData[field] === null || formData[field] === undefined) {
        errors.general = `El campo ${field} no puede estar vacío.`;
        break;
      }
      if (Number(formData[field]) < 0) {
        errors.general = `El campo ${field} no puede ser un valor negativo.`;
        break;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
    if (!validatePayload() || isUploadingImages || isCanceling) return;

    setIsSubmitting(true);
    setFieldErrors({});

    const sanitizedPayload = {
      sku: formData.sku.trim().toUpperCase(),
      name: formData.name.trim(),
      category_id: formData.category_id,
      purchase_cost: Number(formData.purchase_cost),
      vat_rate: Number(formData.vat_rate),
      profit_margin: Number(formData.profit_margin),
      physical_stock: Number(formData.physical_stock),
      commission_rate: Number(formData.commission_rate),
    };

    try {
      let targetProductId = id;

      if (isEditMode && id) {
        await ProductService.update(id, sanitizedPayload);
      } else {
        const created = await ProductService.create(sanitizedPayload);
        targetProductId = created.id;
      }

      if (targetProductId && (images.length > 0 || hadInitialImages)) {
        await MediaService.syncProductImages(
          targetProductId,
          images.map((img) => ({
            id: img.id,
            alt_text: img.alt_text || sanitizedPayload.name,
            is_primary: img.is_primary,
          }))
        );
      }

      navigate('/admin/catalog');
    } catch (error: any) {
      console.error('[Arquitectura] Error de red/backend:', error);
      const status = error.response?.status;
      const backendError = error.response?.data?.error || 'Hubo un error al guardar el producto.';
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

  if (isLoadingProduct) {
    return (
      <div className="p-16 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]" />
      </div>
    );
  }

  const isSubmitDisabled = isSubmitting || isUploadingImages || isCanceling || !isCategoryLeaf;
  const costWithVatPreview = (Number(formData.purchase_cost) || 0) * (1 + (Number(formData.vat_rate) || 0) / 100);

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
          {isEditMode ? 'Editar Producto Físico' : 'Crear Nuevo Producto'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Completa los parámetros de costos, impuestos, categoría, galería y márgenes comerciales.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        {fieldErrors.general && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{fieldErrors.general}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              SKU (Código Único) *
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              required
              disabled={isEditMode}
              placeholder="Ej. PROD-REF-001"
              className={`mt-1 block w-full border rounded-xl p-3 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 transition-colors text-sm shadow-sm font-mono ${
                fieldErrors.sku
                  ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]'
              }`}
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
              Nombre del Producto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ej. Heladera No Frost Inverter"
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
              setFormData((prev: any) => ({ ...prev, category_id: catId }));
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-slate-100 pt-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Costo Compra ($) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                type="number"
                name="purchase_cost"
                step="0.01"
                min="0"
                value={formData.purchase_cost}
                onChange={handleChange}
                required
                className="mt-1 block w-full pl-9 pr-3 border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              IVA (%) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Percent className="w-4 h-4" />
              </span>
              <input
                type="number"
                name="vat_rate"
                step="0.1"
                min="0"
                value={formData.vat_rate}
                onChange={handleChange}
                required
                className="mt-1 block w-full pl-9 pr-3 border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Margen Ganancia (%) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <BarChart3 className="w-4 h-4" />
              </span>
              <input
                type="number"
                name="profit_margin"
                step="any"
                min="0"
                value={formData.profit_margin}
                onChange={handleChange}
                required
                className="mt-1 block w-full pl-9 pr-3 border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#5B50D6]/5 border border-[#5B50D6]/20 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <label
              htmlFor="final_price_input"
              className="block text-sm text-[#5B50D6] font-bold cursor-pointer"
            >
              Precio Base / Final ($)
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Costo con IVA: <span className="font-mono font-semibold text-slate-700">${costWithVatPreview.toFixed(2)}</span> — Podés editar este monto para recalcular el margen automáticamente.
            </p>
          </div>
          <div className="relative w-full sm:w-52">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#5B50D6] font-bold">
              <DollarSign className="w-5 h-5" />
            </span>
            <input
              id="final_price_input"
              type="number"
              step="any"
              min="0"
              value={finalPriceInput}
              onChange={handleFinalPriceChange}
              required
              className="block w-full pl-10 pr-3 py-2.5 border border-[#5B50D6]/30 rounded-xl bg-white text-xl md:text-2xl font-extrabold text-[#5B50D6] text-right focus:ring-2 focus:ring-[#5B50D6]/30 focus:border-[#5B50D6] transition-colors font-mono shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 pt-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Comisión Vendedor (%) *
            </label>
            <input
              type="number"
              name="commission_rate"
              step="1"
              min="0"
              value={formData.commission_rate}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Stock Físico
            </label>
            <input
              type="number"
              name="physical_stock"
              min="0"
              value={formData.physical_stock}
              onChange={handleChange}
              required
              disabled={isEditMode}
              className="mt-1 block w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting || isUploadingImages || isCanceling}
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
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
              : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
};