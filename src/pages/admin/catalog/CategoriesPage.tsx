import { useEffect, useState } from 'react';
import {
  FolderTree, Plus, ChevronRight, ChevronDown, Edit3, Trash2,
  FolderPlus, Package, CheckCircle2, XCircle, X, AlertTriangle
} from 'lucide-react';
import { CategoryService } from '../../../services/category.service';
import type { CategoryTreeNode } from '../../../types/category';
import { toast } from 'sonner';

export const CategoriesPage = () => {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<CategoryTreeNode | null>(null);
  const [parentNode, setParentNode] = useState<CategoryTreeNode | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nodeToDelete, setNodeToDelete] = useState<CategoryTreeNode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTree = async () => {
    try {
      setIsLoading(true);
      const data = await CategoryService.getTree(true);
      setTree(data);
      setExpandedIds((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const initial: Record<string, boolean> = {};
        data.forEach((n) => { initial[n.id] = true; });
        return initial;
      });
    } catch (error) {
      console.error('[CategoriesPage] Error cargando árbol:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateRoot = () => {
    setEditingNode(null);
    setParentNode(null);
    setNameInput('');
    setSelectedParentId('');
    setIsActiveInput(true);
    setIsModalOpen(true);
  };

  const openCreateSubcategory = (parent: CategoryTreeNode) => {
    setEditingNode(null);
    setParentNode(parent);
    setNameInput('');
    setSelectedParentId(parent.id);
    setIsActiveInput(true);
    setIsModalOpen(true);
  };

  const openEditModal = (node: CategoryTreeNode) => {
    setEditingNode(node);
    setParentNode(null);
    setNameInput(node.name);
    setSelectedParentId(node.parent_id || '');
    setIsActiveInput(node.is_active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.warning('El nombre de la categoría es obligatorio.');
      return;
    }
    setIsSubmitting(true);

    try {
      if (editingNode) {
        await CategoryService.update(editingNode.id, {
          name: nameInput.trim(),
          parent_id: selectedParentId || null,
          is_active: isActiveInput,
        });
        toast.success('Categoría actualizada con éxito.');
      } else {
        await CategoryService.create({
          name: nameInput.trim(),
          parent_id: selectedParentId || null,
          is_active: isActiveInput,
        });
        if (selectedParentId) {
          setExpandedIds((prev) => ({ ...prev, [selectedParentId]: true }));
        }
        toast.success('Categoría creada con éxito.');
      }
      setIsModalOpen(false);
      await loadTree();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo guardar la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (node: CategoryTreeNode) => {
    setNodeToDelete(node);
  };

  const cancelDelete = () => {
    if (isDeleting) return;
    setNodeToDelete(null);
    toast.info('Eliminación cancelada.');
  };

  const confirmDelete = async () => {
    if (!nodeToDelete) return;
    setIsDeleting(true);
    try {
      await CategoryService.delete(nodeToDelete.id);
      const deletedName = nodeToDelete.name;
      setNodeToDelete(null);
      await loadTree();
      toast.success(`Categoría "${deletedName}" eliminada con éxito.`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'No se pudo eliminar la categoría.');
    } finally {
      setIsDeleting(false);
    }
  };

  const flatCandidates = CategoryService.flattenTree(tree).filter(({ node }) => {
    if (node.products_count > 0) return false;
    if (editingNode && (node.id === editingNode.id || node.path.includes(`/${editingNode.id}/`))) return false;
    return true;
  });

  const renderNode = (node: CategoryTreeNode) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = Boolean(expandedIds[node.id]);
    const canAddSubcategory = node.products_count === 0;
    const canDelete = node.is_leaf && node.products_count === 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center justify-between py-3 px-4 rounded-xl border transition-colors mb-2 ${
            node.is_active
              ? 'bg-white border-slate-200 hover:border-indigo-200'
              : 'bg-slate-50 border-slate-200/70 opacity-75'
          }`}
          style={{ marginLeft: `${node.depth * 24}px` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => toggleExpand(node.id)}
              disabled={!hasChildren}
              className={`p-1 rounded-lg transition-colors ${
                hasChildren ? 'text-slate-600 hover:bg-slate-100' : 'text-transparent cursor-default'
              }`}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              node.is_leaf ? 'bg-indigo-50 text-[#5B50D6]' : 'bg-slate-100 text-slate-600'
            }`}>
              <FolderTree className="w-4 h-4" />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 truncate">{node.name}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  /{node.slug}
                </span>
                {node.is_leaf && (
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    Admite productos
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              {node.products_count}
            </span>

            {node.is_active ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" /> Activa
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                <XCircle className="w-3 h-3" /> Inactiva
              </span>
            )}

            <div className="flex items-center gap-1 border-l border-slate-100 pl-2">
              <button
                type="button"
                onClick={() => openCreateSubcategory(node)}
                disabled={!canAddSubcategory}
                title={
                  canAddSubcategory
                    ? 'Agregar subcategoría'
                    : 'No puedes crear subcategorías porque ya tiene productos asignados'
                }
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#5B50D6] hover:bg-indigo-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => openEditModal(node)}
                title="Editar categoría"
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#5B50D6] hover:bg-indigo-50 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => openDeleteModal(node)}
                disabled={!canDelete}
                title={
                  canDelete
                    ? 'Eliminar categoría'
                    : 'Solo se pueden eliminar categorías finales sin productos'
                }
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderNode(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Árbol de Categorías</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organiza la jerarquía comercial. Solo las categorías finales (hojas) reciben productos.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateRoot}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5B50D6] text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition-colors font-semibold text-sm"
        >
          <Plus className="w-4 h-4" /> Nueva Categoría Raíz
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]" />
        </div>
      ) : tree.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-900">No hay categorías creadas</p>
          <p className="text-sm text-slate-500 mt-1">Crea tu primera categoría raíz para comenzar a estructurar el catálogo.</p>
        </div>
      ) : (
        <div className="space-y-1">{tree.map((rootNode) => renderNode(rootNode))}</div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/70">
              <h3 className="font-bold text-base text-slate-900">
                {editingNode
                  ? 'Editar Categoría'
                  : parentNode
                  ? `Nueva Subcategoría en "${parentNode.name}"`
                  : 'Nueva Categoría Raíz'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} noValidate className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nombre de Categoría *
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ej. Heladeras No Frost"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
                />
              </div>

              {editingNode && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Categoría Padre
                  </label>
                  <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900"
                  >
                    <option value="">Ninguna (Categoría Raíz)</option>
                    {flatCandidates.map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  id="cat_active"
                  type="checkbox"
                  checked={isActiveInput}
                  onChange={(e) => setIsActiveInput(e.target.checked)}
                  className="rounded border-slate-300 text-[#5B50D6] focus:ring-[#5B50D6]"
                />
                <label htmlFor="cat_active" className="text-sm font-medium text-slate-700">
                  Categoría visible y activa en el sistema
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-[#5B50D6] rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {nodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Eliminar Categoría</h3>
              </div>
              <button
                type="button"
                onClick={cancelDelete}
                disabled={isDeleting}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-2">
              <p className="text-sm text-slate-700">
                ¿Estás seguro de que deseas eliminar definitivamente la categoría{' '}
                <strong className="text-slate-900">"{nodeToDelete.name}"</strong>?
              </p>
              <p className="text-xs text-slate-500">
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};