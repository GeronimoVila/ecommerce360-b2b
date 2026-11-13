import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { ProductService } from '../../../services/product.service';

export const ProductFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<any>({
    sku: '',
    name: '',
    purchase_cost: 0,
    vat_rate: 21,
    profit_margin: 0,
    physical_stock: 0,
    commission_rate: 0,
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      ProductService.getById(id).then(product => {
        setFormData({
          sku: product.sku || '',
          name: product.name || '',
          purchase_cost: Number(product.purchase_cost) || 0,
          vat_rate: Number(product.vat_rate) || 0,
          profit_margin: Number(product.profit_margin) || 0,
          physical_stock: Number(product.physical_stock) || 0,
          commission_rate: Number(product.commission_rate) || 0,
        });
      }).catch(err => console.error("Error hidratando datos:", err));
    }
  }, [id, isEditMode]);

  useEffect(() => {
    const cost = Number(formData.purchase_cost) || 0;
    const vat = Number(formData.vat_rate) || 0;
    const margin = Number(formData.profit_margin) || 0;
    
    const costWithVat = cost * (1 + (vat / 100));
    const finalPrice = costWithVat * (1 + (margin / 100));
    setCalculatedPrice(finalPrice);
  }, [formData.purchase_cost, formData.vat_rate, formData.profit_margin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({ 
      ...prev, 
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value 
    }));
  };

  const validatePayload = (): boolean => {
    if (!formData.sku || formData.sku.trim() === '') {
      alert("El SKU es obligatorio.");
      return false;
    }
    if (!formData.name || formData.name.trim() === '') {
      alert("El nombre del producto es obligatorio.");
      return false;
    }
    
    const numericFields = ['purchase_cost', 'vat_rate', 'profit_margin', 'commission_rate', 'physical_stock'];
    for (const field of numericFields) {
      if (formData[field] === '' || formData[field] === null || formData[field] === undefined) {
        alert(`El campo ${field} no puede estar vacío.`);
        return false;
      }
      if (Number(formData[field]) < 0) {
        alert(`El campo ${field} no puede ser un valor negativo.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayload()) return;
    
    setIsSubmitting(true);

    const sanitizedPayload = {
      sku: formData.sku,
      name: formData.name,
      purchase_cost: Number(formData.purchase_cost),
      vat_rate: Number(formData.vat_rate),
      profit_margin: Number(formData.profit_margin),
      physical_stock: Number(formData.physical_stock),
      commission_rate: Number(formData.commission_rate),
    };

    try {
      if (isEditMode && id) {
        await ProductService.update(id, sanitizedPayload);
      } else {
        await ProductService.create(sanitizedPayload);
      }
      navigate('/admin/catalog');
    } catch (error: any) {
      console.error('[Arquitectura] Error de red/backend:', error);
      alert(error.response?.data?.error || 'Hubo un error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      
      <div>
        <button 
          type="button" 
          onClick={() => navigate('/admin/catalog')}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-[#5B50D6] transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Volver al catálogo
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEditMode ? 'Editar Producto Físico' : 'Crear Nuevo Producto'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Completa los parámetros de costos, impuestos y márgenes comerciales.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">SKU (Código Único) *</label>
            <input 
              type="text" name="sku" value={formData.sku} onChange={handleChange} required
              disabled={isEditMode} 
              placeholder="Ej. PROD-REF-001"
              className="mt-1 block w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nombre del Producto *</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleChange} required
              placeholder="Ej. Heladera No Frost Inverter"
              className="mt-1 block w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-slate-100 pt-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Costo Compra ($) *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><DollarSign className="w-4 h-4" /></span>
              <input 
                type="number" name="purchase_cost" step="0.01" min="0"
                value={formData.purchase_cost} onChange={handleChange} required
                className="mt-1 block w-full pl-9 pr-3 border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">IVA (%) *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Percent className="w-4 h-4" /></span>
              <input 
                type="number" name="vat_rate" step="0.1" min="0"
                value={formData.vat_rate} onChange={handleChange} required
                className="mt-1 block w-full pl-9 pr-3 border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Margen Ganancia (%) *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><BarChart3 className="w-4 h-4" /></span>
              <input 
                type="number" name="profit_margin" step="0.1" min="0"
                value={formData.profit_margin} onChange={handleChange} required
                className="mt-1 block w-full pl-9 pr-3 border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#5B50D6]/5 border border-[#5B50D6]/20 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <p className="text-sm text-[#5B50D6] font-bold">Precio Base Calculado</p>
            <p className="text-xs text-slate-500 mt-0.5">Precio final proyectado aplicando IVA y margen comercial</p>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-[#5B50D6] mt-2 sm:mt-0 font-mono">
            ${calculatedPrice.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-slate-100 pt-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Comisión Vendedor (%) *</label>
            <input 
              type="number" name="commission_rate" step="0.1" min="0"
              value={formData.commission_rate} onChange={handleChange} required
              className="mt-1 block w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Stock Físico</label>
            <input 
              type="number" name="physical_stock" min="0"
              value={formData.physical_stock} onChange={handleChange} required
              disabled={isEditMode}
              className="mt-1 block w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-500 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm font-mono"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button 
            type="button" 
            onClick={() => navigate('/admin/catalog')}
            className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-sm text-sm ${
              isSubmitting 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-[#5B50D6] hover:bg-indigo-700 shadow-indigo-600/25'
            }`}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
};