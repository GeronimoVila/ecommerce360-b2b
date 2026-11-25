import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  RotateCcw,
  Edit3,
  Power,
  X,
  FilterX,
  ArrowUpDown,
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  UserService,
  type CreateSellerPayload,
  type UpdateUserPayload,
} from '../../../services/user.service';

type StatusFilter = 'ALL' | 'ACTIVE' | 'SUSPENDED';
type CbuFilter = 'ALL' | 'WITH_CBU' | 'MISSING_CBU';
type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'NEWEST';

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName ? firstName.charAt(0) : '';
  const last = lastName ? lastName.charAt(0) : '';
  return `${first}${last}`.toUpperCase() || '??';
};

const normalizeText = (value?: string | null) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const SellersManagementPage = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [cbuFilter, setCbuFilter] = useState<CbuFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NAME_ASC');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sellerToEdit, setSellerToEdit] = useState<any | null>(null);

  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    temporary_password: string;
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [sellerToToggle, setSellerToToggle] = useState<any | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateSellerPayload>({
    first_name: '',
    last_name: '',
    email: '',
    cbu_alias: '',
  });

  const [editFormData, setEditFormData] = useState<UpdateUserPayload>({
    first_name: '',
    last_name: '',
    email: '',
    cbu_alias: '',
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    cbuFilter !== 'ALL' ||
    sortBy !== 'NAME_ASC';

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCbuFilter('ALL');
    setSortBy('NAME_ASC');
    setCurrentPage(1);
  };

  const filteredSellers = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    const filtered = sellers.filter((seller) => {
      if (statusFilter === 'ACTIVE' && !seller.is_active) return false;
      if (statusFilter === 'SUSPENDED' && seller.is_active) return false;

      const hasCbu = Boolean(seller.seller_profile?.cbu_alias?.trim());
      if (cbuFilter === 'WITH_CBU' && !hasCbu) return false;
      if (cbuFilter === 'MISSING_CBU' && hasCbu) return false;

      if (normalizedQuery) {
        const fullName = normalizeText(
          `${seller.seller_profile?.first_name || ''} ${seller.seller_profile?.last_name || ''}`
        );
        const email = normalizeText(seller.email);
        const refCode = normalizeText(seller.seller_profile?.ref_code);
        const cbuAlias = normalizeText(seller.seller_profile?.cbu_alias);
        const shortId = normalizeText(`vnd-${seller.id}`);

        const matches =
          fullName.includes(normalizedQuery) ||
          email.includes(normalizedQuery) ||
          refCode.includes(normalizedQuery) ||
          cbuAlias.includes(normalizedQuery) ||
          shortId.includes(normalizedQuery);

        if (!matches) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'NEWEST') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }

      const nameA = `${a.seller_profile?.first_name || ''} ${a.seller_profile?.last_name || ''}`.trim();
      const nameB = `${b.seller_profile?.first_name || ''} ${b.seller_profile?.last_name || ''}`.trim();
      return sortBy === 'NAME_ASC'
        ? nameA.localeCompare(nameB, 'es')
        : nameB.localeCompare(nameA, 'es');
    });
  }, [sellers, searchQuery, statusFilter, cbuFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, cbuFilter, sortBy, sellers.length]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await UserService.createSeller(createFormData);
      const fullName = `${createFormData.first_name} ${createFormData.last_name}`.trim();

      setIsCreateModalOpen(false);
      setCopiedPassword(false);
      setCreatedCredentials({
        name: fullName,
        email: createFormData.email,
        temporary_password: res.temporary_password,
      });
      setCreateFormData({ first_name: '', last_name: '', email: '', cbu_alias: '' });
      fetchSellers();
      toast.success('Vendedor creado correctamente.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear vendedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTempPassword = async () => {
    if (!createdCredentials?.temporary_password) return;
    try {
      await navigator.clipboard.writeText(createdCredentials.temporary_password);
      setCopiedPassword(true);
      toast.success('Contraseña temporal copiada al portapapeles.');
    } catch {
      toast.error('No se pudo copiar automáticamente. Selecciónala manualmente.');
    }
  };

  const handleOpenEditModal = (seller: any) => {
    setSellerToEdit(seller);
    setEditFormData({
      first_name: seller.seller_profile?.first_name || '',
      last_name: seller.seller_profile?.last_name || '',
      email: seller.email || '',
      cbu_alias: seller.seller_profile?.cbu_alias || '',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerToEdit) return;

    setIsSubmitting(true);
    try {
      await UserService.updateUser(sellerToEdit.id, editFormData);
      toast.success('Vendedor actualizado exitosamente.');
      setSellerToEdit(null);
      fetchSellers();
    } catch (error: any) {
      console.error('[SellersManagementPage] Error actualizando vendedor:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar los datos del vendedor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openToggleStatusModal = (seller: any) => {
    setSellerToToggle(seller);
  };

  const cancelToggleStatus = () => {
    if (isTogglingStatus) return;
    setSellerToToggle(null);
    toast.info('Cambio de estado cancelado.');
  };

  const confirmToggleStatus = async () => {
    if (!sellerToToggle) return;
    setIsTogglingStatus(true);
    const wasActive = sellerToToggle.is_active;
    const firstName = sellerToToggle.seller_profile?.first_name || 'el vendedor';

    try {
      if (wasActive) {
        await UserService.deactivateUser(sellerToToggle.id);
      } else {
        await UserService.updateUser(sellerToToggle.id, { is_active: true });
      }
      setSellerToToggle(null);
      fetchSellers();
      toast.success(
        wasActive
          ? `Vendedor ${firstName} suspendido con éxito.`
          : `Vendedor ${firstName} reactivado con éxito.`
      );
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error cambiando el estado del vendedor.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const totalFiltered = filteredSellers.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const currentSellers = filteredSellers.slice(startIndex, endIndex);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B50D6] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Equipo de Ventas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Gestión de vendedores, perfiles comerciales y datos de cobro.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#1A1D27] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm w-full md:w-auto"
        >
          <UserPlus className="w-4 h-4" /> Nuevo Vendedor
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, email, Ref Code o CBU/Alias..."
            className="w-full pl-10 pr-16 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none transition-colors shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-status" className="text-xs font-semibold text-slate-500">
            Estado:
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none shadow-sm cursor-pointer"
          >
            <option value="ALL">Todos ({sellers.length})</option>
            <option value="ACTIVE">Activos</option>
            <option value="SUSPENDED">Suspendidos</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-cbu" className="text-xs font-semibold text-slate-500">
            Datos de cobro:
          </label>
          <select
            id="filter-cbu"
            value={cbuFilter}
            onChange={(e) => setCbuFilter(e.target.value as CbuFilter)}
            className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none shadow-sm cursor-pointer"
          >
            <option value="ALL">Todos</option>
            <option value="WITH_CBU">Con CBU / Alias</option>
            <option value="MISSING_CBU">Sin CBU / Alias</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort-sellers" className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            Orden:
          </label>
          <select
            id="sort-sellers"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] outline-none shadow-sm cursor-pointer"
          >
            <option value="NAME_ASC">Nombre (A - Z)</option>
            <option value="NAME_DESC">Nombre (Z - A)</option>
            <option value="NEWEST">Más recientes</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          disabled={!hasActiveFilters}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" /> Limpiar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]" />
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium flex flex-col items-center gap-3">
            <Users className="w-8 h-8 text-slate-300" />
            No hay vendedores registrados en el equipo.
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3 bg-slate-50/40">
            <FilterX className="w-9 h-9 text-slate-300" />
            <div>
              <p className="font-bold text-slate-700 text-sm">
                No se encontraron vendedores con los filtros aplicados
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Prueba ajustando el término de búsqueda o restableciendo los filtros activos.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-1 px-4 py-2 text-xs font-bold text-[#5B50D6] bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              Limpiar todos los filtros
            </button>
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
                    <tr
                      key={seller.id}
                      className={`hover:bg-slate-50/50 transition-colors group ${
                        isSuspended ? 'bg-slate-50/30' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                              isSuspended
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {getInitials(
                              seller.seller_profile?.first_name,
                              seller.seller_profile?.last_name
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {seller.seller_profile?.first_name}{' '}
                              {seller.seller_profile?.last_name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5 leading-tight">
                              ID: VND-{seller.id.substring(0, 6).toUpperCase()}
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
                          <span className="text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold text-xs">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            seller.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              seller.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
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
                            onClick={() => openToggleStatusModal(seller)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              seller.is_active
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={
                              seller.is_active ? 'Suspender vendedor' : 'Reactivar vendedor'
                            }
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

        {!isLoading && totalFiltered > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-white gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Mostrando <strong className="text-slate-900">{startIndex + 1}</strong> a{' '}
              <strong className="text-slate-900">{endIndex}</strong> de{' '}
              <strong className="text-slate-900">{totalFiltered}</strong> vendedores
              {hasActiveFilters && ` (filtrados de ${sellers.length} totales)`}
            </span>

            {totalPages > 1 && (
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-transparent rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm"
                    value={createFormData.first_name}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm"
                    value={createFormData.last_name}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm"
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  CBU / Alias (Opcional)
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono"
                  value={createFormData.cbu_alias}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, cbu_alias: e.target.value })
                  }
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

      {createdCredentials && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-emerald-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Credenciales de Acceso</h2>
              </div>
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                El vendedor <strong className="text-slate-900">{createdCredentials.name}</strong> (
                {createdCredentials.email}) fue dado de alta.
              </p>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <p className="text-xs font-bold text-amber-800">
                  Contraseña temporal (cópiala ahora, no se volverá a mostrar):
                </p>
                <div className="flex items-center justify-between gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2">
                  <code className="font-mono font-extrabold text-sm text-slate-900 select-all">
                    {createdCredentials.temporary_password}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyTempPassword}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#5B50D6] text-white hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    {copiedPassword ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedPassword ? 'Copiada' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#1A1D27] rounded-xl hover:bg-slate-800 transition-colors"
              >
                Entendido, ya la copié
              </button>
            </div>
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
              <button
                onClick={() => setSellerToEdit(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm"
                    value={editFormData.first_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm"
                    value={editFormData.last_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  CBU / Alias (Para cobros)
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] shadow-sm font-mono"
                  value={editFormData.cbu_alias}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, cbu_alias: e.target.value })
                  }
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

      {sellerToToggle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div
              className={`flex justify-between items-center px-6 py-4 border-b border-slate-100 ${
                sellerToToggle.is_active ? 'bg-rose-50/70' : 'bg-emerald-50/70'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    sellerToToggle.is_active
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {sellerToToggle.is_active ? 'Suspender Vendedor' : 'Reactivar Vendedor'}
                </h2>
              </div>
              <button
                type="button"
                onClick={cancelToggleStatus}
                disabled={isTogglingStatus}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-2">
              <p className="text-sm text-slate-700">
                ¿Estás seguro de que deseas{' '}
                <strong className="text-slate-900">
                  {sellerToToggle.is_active ? 'suspender' : 'reactivar'}
                </strong>{' '}
                a{' '}
                <strong className="text-slate-900">
                  {sellerToToggle.seller_profile?.first_name}{' '}
                  {sellerToToggle.seller_profile?.last_name}
                </strong>
                ?
              </p>
              <p className="text-xs text-slate-500">
                {sellerToToggle.is_active
                  ? 'El vendedor no podrá iniciar sesión ni generar nuevos presupuestos mientras esté suspendido.'
                  : 'El vendedor recuperará el acceso inmediato a su portal.'}
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={cancelToggleStatus}
                disabled={isTogglingStatus}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmToggleStatus}
                disabled={isTogglingStatus}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 ${
                  sellerToToggle.is_active
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isTogglingStatus
                  ? 'Procesando...'
                  : sellerToToggle.is_active
                  ? 'Sí, suspender'
                  : 'Sí, reactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};