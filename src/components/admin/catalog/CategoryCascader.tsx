import { useEffect, useState } from 'react';
import { FolderTree, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CategoryService } from '../../../services/category.service';
import type { CategoryTreeNode } from '../../../types/category';

interface CategoryCascaderProps {
  selectedCategoryId: string;
  onChange: (categoryId: string, isLeaf: boolean) => void;
  compact?: boolean;
}

export const CategoryCascader = ({ selectedCategoryId, onChange, compact = false }: CategoryCascaderProps) => {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [selectedChain, setSelectedChain] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    CategoryService.getTree(false)
      .then((data) => {
        setTree(data);
        if (selectedCategoryId) {
          const pathIds = CategoryService.findPathIds(data, selectedCategoryId);
          if (pathIds.length > 0) {
            setSelectedChain(pathIds);
            const leafNode = findNodeById(data, selectedCategoryId);
            onChange(selectedCategoryId, Boolean(leafNode?.is_leaf));
          }
        }
      })
      .catch((err) => console.error('[CategoryCascader] Error cargando árbol:', err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (tree.length > 0 && selectedCategoryId && selectedChain[selectedChain.length - 1] !== selectedCategoryId) {
      const pathIds = CategoryService.findPathIds(tree, selectedCategoryId);
      if (pathIds.length > 0) {
        setSelectedChain(pathIds);
        const leafNode = findNodeById(tree, selectedCategoryId);
        onChange(selectedCategoryId, Boolean(leafNode?.is_leaf));
      }
    }
  }, [selectedCategoryId, tree]);

  const findNodeById = (nodes: CategoryTreeNode[], id: string): CategoryTreeNode | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children?.length) {
        const found = findNodeById(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getLevels = (): CategoryTreeNode[][] => {
    const levels: CategoryTreeNode[][] = [];
    if (tree.length === 0) return levels;
    levels.push(tree);

    let currentOptions = tree;
    for (const selectedId of selectedChain) {
      const found = currentOptions.find((n) => n.id === selectedId);
      if (found && found.children && found.children.length > 0) {
        levels.push(found.children);
        currentOptions = found.children;
      } else {
        break;
      }
    }
    return levels;
  };

  const handleLevelSelect = (levelIndex: number, value: string) => {
    const nextChain = selectedChain.slice(0, levelIndex);
    if (value) nextChain.push(value);
    setSelectedChain(nextChain);

    const lastId = nextChain[nextChain.length - 1] || '';
    if (!lastId) {
      onChange('', false);
      return;
    }

    const node = findNodeById(tree, lastId);
    onChange(lastId, Boolean(node?.is_leaf));
  };

  const levels = getLevels();
  const lastSelectedId = selectedChain[selectedChain.length - 1];
  const lastNode = lastSelectedId ? findNodeById(tree, lastSelectedId) : null;

  if (isLoading) {
    return <div className="h-11 bg-slate-100 animate-pulse rounded-xl w-full" />;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <FolderTree className="w-3.5 h-3.5 text-[#5B50D6]" />
          Categoría del Catálogo *
        </label>
        {lastNode && (
          lastNode.is_leaf ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Categoría final válida
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <AlertCircle className="w-3 h-3" /> Selecciona una subcategoría
            </span>
          )
        )}
      </div>

      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-3'} gap-3`}>
        {levels.map((options, levelIdx) => (
          <div key={levelIdx}>
            <select
              value={selectedChain[levelIdx] || ''}
              onChange={(e) => handleLevelSelect(levelIdx, e.target.value)}
              className="block w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors shadow-sm cursor-pointer"
            >
              <option value="">
                {levelIdx === 0 ? '1. Categoría Principal...' : `${levelIdx + 1}. Subcategoría...`}
              </option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} {opt.is_leaf ? '' : '▸'}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};