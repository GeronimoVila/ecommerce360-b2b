import { useState } from 'react';
import { SupplierService, type Supplier } from '../../../services/supplier.service';

interface QuickProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSupplier: Supplier) => void;
}

export const QuickProviderModal = ({ isOpen, onClose, onSuccess }: QuickProviderModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const newSupplier = await SupplierService.create(formData);
      onSuccess(newSupplier);
      setFormData({ name: '', tax_id: '', email: '', phone: '' });
    } catch (error: any) {
      console.error('Error creando proveedor:', error);
      alert(error.response?.data?.error || 'No se pudo crear el proveedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Alta de Proveedor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Razón Social / Nombre *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ej. Distribuidora Zeta" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">CUIT / RUT (Opcional)</label>
            <input type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ej. 30-12345678-9" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Teléfono (Opcional)</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Email (Opcional)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};