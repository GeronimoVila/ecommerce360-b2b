import { useState, useEffect } from 'react';
import { UserService, type CreateSellerPayload, type UpdateUserPayload } from '../../../services/user.service';

export const SellersManagementPage = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sellerToEdit, setSellerToEdit] = useState<any | null>(null);

  const [createFormData, setCreateFormData] = useState<CreateSellerPayload>({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    cbu_alias: '' 
  });

  const [editFormData, setEditFormData] = useState<UpdateUserPayload>({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    cbu_alias: '' 
  });

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const data = await UserService.getSellers();
      setSellers(data);
    } catch (error) {
      console.error('[SellersManagementPage] Error al obtener vendedores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchSellers(); 
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await UserService.createSeller(createFormData);
      alert(`✅ Vendedor creado correctamente.\n\nContraseña temporal: ${res.temporary_password}\n¡Cópiala ahora, no se volverá a mostrar!`);
      setIsCreateModalOpen(false);
      setCreateFormData({ first_name: '', last_name: '', email: '', cbu_alias: '' });
      fetchSellers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear vendedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (seller: any) => {
    setSellerToEdit(seller);
    setEditFormData({
      first_name: seller.seller_profile?.first_name || '',
      last_name: seller.seller_profile?.last_name || '',
      email: seller.email || '',
      cbu_alias: seller.seller_profile?.cbu_alias || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerToEdit) return;

    setIsSubmitting(true);
    try {
      await UserService.updateUser(sellerToEdit.id, editFormData);
      alert('✅ Vendedor actualizado exitosamente.');
      setSellerToEdit(null);
      fetchSellers();
    } catch (error: any) {
      console.error('[SellersManagementPage] Error actualizando vendedor:', error);
      alert(error.response?.data?.error || 'Error al actualizar los datos del vendedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (seller: any) => {
    const actionText = seller.is_active ? 'suspender' : 'reactivar';
    if (!confirm(`¿Estás seguro de ${actionText} a ${seller.seller_profile?.first_name}?`)) return;
    
    try {
      if (seller.is_active) {
        await UserService.deactivateUser(seller.id);
      } else {
        await UserService.updateUser(seller.id, { is_active: true }); 
      }
      fetchSellers();
    } catch (error) {
      alert('Error cambiando estado del vendedor');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Equipo de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de vendedores, perfiles comerciales y claves temporales.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="bg-slate-800 text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-700 transition-colors shadow-sm"
        >
          + Nuevo Vendedor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-medium">
            No hay vendedores registrados en el equipo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Vendedor</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Ref Code</th>
                  <th className="p-4">CBU / Alias</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sellers.map((seller) => (
                  <tr key={seller.id} className={`hover:bg-gray-50 transition-colors ${!seller.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="p-4 font-semibold text-slate-800">
                      {seller.seller_profile?.first_name} {seller.seller_profile?.last_name}
                    </td>
                    <td className="p-4 text-gray-600">{seller.email}</td>
                    <td className="p-4 font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block my-3">
                      {seller.seller_profile?.ref_code}
                    </td>
                    <td className="p-4 text-gray-600">
                      {seller.seller_profile?.cbu_alias || <span className="text-gray-400 italic">No asignado</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        seller.is_active 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {seller.is_active ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button 
                        onClick={() => handleOpenEditModal(seller)} 
                        className="text-blue-600 hover:text-blue-800 font-bold transition-colors"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(seller)} 
                        className={`font-bold transition-colors ${
                          seller.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {seller.is_active ? 'Suspender' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Alta de Vendedor</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Nombre *</label>
                  <input 
                    type="text" required 
                    className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                    value={createFormData.first_name}
                    onChange={e => setCreateFormData({...createFormData, first_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Apellido *</label>
                  <input 
                    type="text" required 
                    className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                    value={createFormData.last_name}
                    onChange={e => setCreateFormData({...createFormData, last_name: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Email *</label>
                <input 
                  type="email" required 
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                  value={createFormData.email}
                  onChange={e => setCreateFormData({...createFormData, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">CBU / Alias (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                  value={createFormData.cbu_alias}
                  onChange={e => setCreateFormData({...createFormData, cbu_alias: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sellerToEdit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Editar Vendedor</h2>
              <button onClick={() => setSellerToEdit(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Nombre *</label>
                  <input 
                    type="text" required 
                    className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                    value={editFormData.first_name}
                    onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Apellido *</label>
                  <input 
                    type="text" required 
                    className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                    value={editFormData.last_name}
                    onChange={e => setEditFormData({...editFormData, last_name: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Email *</label>
                <input 
                  type="email" required 
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                  value={editFormData.email}
                  onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">CBU / Alias (Para cobros)</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" 
                  value={editFormData.cbu_alias}
                  onChange={e => setEditFormData({...editFormData, cbu_alias: e.target.value})} 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setSellerToEdit(null)} 
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};