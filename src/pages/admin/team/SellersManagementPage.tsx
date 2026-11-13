import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, ChevronDown, 
  RotateCcw, Edit3, Power, X 
} from 'lucide-react';
import { UserService, type CreateSellerPayload, type UpdateUserPayload } from '../../../services/user.service';

const getInitials = (firstName: string, lastName: string) => {
  const first = firstName ? firstName.charAt(0) : '';
  const last = lastName ? lastName.charAt(0) : '';
  return `${first}${last}`.toUpperCase() || '??';
};

export const SellersManagementPage = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const totalSellers = sellers.length;
  const totalPages = Math.ceil(totalSellers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalSellers);
  
  const currentSellers = sellers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [sellers.length]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B50D6] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Equipo de Ventas</h1>
            <p className="text-sm text-slate-500 mt-1">Gestión de vendedores, perfiles comerciales y claves temporales.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="flex items-center justify-center gap-2 bg-[#1A1D27] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm w-full md:w-auto"
        >
          <UserPlus className="w-4 h-4" /> Nuevo Vendedor
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-62.5">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            placeholder="Buscar por vendedor, CUIT..."
            className="w-full pl-9 pr-12 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#5B50D6]/20 outline-none transition-colors shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
              ⌘K
            </kbd>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Estado:</span>
          <button className="flex items-center justify-between gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white hover:bg-slate-50 shadow-sm min-w-30">
            Activos <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Cartera / Sucursal:</span>
          <button className="flex items-center justify-between gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white hover:bg-slate-50 shadow-sm min-w-40">
            Todas las carteras <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
          <RotateCcw className="w-4 h-4" /> Limpiar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
            <Users className="w-8 h-8 text-slate-300" />
            No hay vendedores registrados en el equipo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Vendedor</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Ref Code</th>
                  <th className="py-4 px-6">CBU / Alias</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {currentSellers.map((seller) => {
                  const isSuspended = !seller.is_active;
                  return (
                    <tr key={seller.id} className={`hover:bg-slate-50/50 transition-colors group ${isSuspended ? 'bg-slate-50/30' : ''}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isSuspended ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            {getInitials(seller.seller_profile?.first_name, seller.seller_profile?.last_name)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {seller.seller_profile?.first_name} {seller.seller_profile?.last_name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5 leading-tight">
                              ID: VND-{seller.id.substring(0,3)}...<br/>
                              CUIT: 20-34981722-4
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium text-sm">
                        {seller.email}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-xs font-bold text-[#5B50D6] bg-indigo-50/80 border border-indigo-100 px-2.5 py-1.5 rounded-lg inline-block">
                          {seller.seller_profile?.ref_code || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {seller.seller_profile?.cbu_alias ? (
                          <span className="font-mono text-xs text-slate-600 font-semibold bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg">
                            {seller.seller_profile.cbu_alias}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">No asignado</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          seller.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${seller.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          {seller.is_active ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEditModal(seller)} 
                            className="p-1.5 text-slate-400 hover:text-[#5B50D6] hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar vendedor"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(seller)} 
                            className={`p-1.5 rounded-lg transition-colors ${
                              seller.is_active 
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={seller.is_active ? 'Suspender vendedor' : 'Reactivar vendedor'}
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
        )}
        
        {!isLoading && totalSellers > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-white gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando <strong className="text-slate-900">{startIndex + 1}</strong> a <strong className="text-slate-900">{endIndex}</strong> de <strong className="text-slate-900">{totalSellers}</strong> vendedores registrados
            </span>
            
            {totalPages > 1 && (
              <div className="flex gap-1">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-transparent rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-xs rounded-lg shadow-sm transition-colors ${
                      currentPage === page 
                        ? 'font-bold text-white bg-[#5B50D6]' 
                        : 'font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5B50D6] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Alta de Vendedor</h2>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input 
                    type="text" required 
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm" 
                    value={createFormData.first_name}
                    onChange={e => setCreateFormData({...createFormData, first_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Apellido *</label>
                  <input 
                    type="text" required 
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm" 
                    value={createFormData.last_name}
                    onChange={e => setCreateFormData({...createFormData, last_name: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                <input 
                  type="email" required 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm" 
                  value={createFormData.email}
                  onChange={e => setCreateFormData({...createFormData, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CBU / Alias (Opcional)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono" 
                  value={createFormData.cbu_alias}
                  onChange={e => setCreateFormData({...createFormData, cbu_alias: e.target.value})} 
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#5B50D6] rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-600/25 transition-all"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sellerToEdit && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#5B50D6] flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Editar Vendedor</h2>
              </div>
              <button onClick={() => setSellerToEdit(null)} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre *</label>
                  <input 
                    type="text" required 
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm" 
                    value={editFormData.first_name}
                    onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Apellido *</label>
                  <input 
                    type="text" required 
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm" 
                    value={editFormData.last_name}
                    onChange={e => setEditFormData({...editFormData, last_name: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                <input 
                  type="email" required 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm" 
                  value={editFormData.email}
                  onChange={e => setEditFormData({...editFormData, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">CBU / Alias (Para cobros)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono" 
                  value={editFormData.cbu_alias}
                  onChange={e => setEditFormData({...editFormData, cbu_alias: e.target.value})} 
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setSellerToEdit(null)} 
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-5 py-2.5 text-sm font-bold text-white bg-[#5B50D6] rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm shadow-indigo-600/25 transition-all"
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