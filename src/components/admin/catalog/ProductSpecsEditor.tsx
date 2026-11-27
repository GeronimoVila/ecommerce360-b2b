import { Plus, Trash2, FileText, ListChecks, ArrowUp, ArrowDown } from 'lucide-react';
import type { TechnicalSpecItem } from '../../../types/product';

interface ProductSpecsEditorProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  specs: TechnicalSpecItem[];
  onSpecsChange: (specs: TechnicalSpecItem[]) => void;
}

export const ProductSpecsEditor = ({
  description,
  onDescriptionChange,
  specs,
  onSpecsChange,
}: ProductSpecsEditorProps) => {
  const handleAddSpec = () => {
    onSpecsChange([...specs, { key: '', value: '' }]);
  };

  const handleUpdateSpec = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...specs];
    updated[index] = { ...updated[index], [field]: val };
    onSpecsChange(updated);
  };

  const handleRemoveSpec = (index: number) => {
    onSpecsChange(specs.filter((_, i) => i !== index));
  };

  const handleMoveSpec = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= specs.length) return;
    const updated = [...specs];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onSpecsChange(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="product_description"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-[#5B50D6]" />
          Descripción del Producto (Texto Plano)
        </label>
        <textarea
          id="product_description"
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describí las características principales, usos recomendados y beneficios del producto..."
          className="mt-1 block w-full border border-slate-200 rounded-xl p-3 bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6] transition-colors text-sm shadow-sm leading-relaxed"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Se mostrará en la tienda online respetando los saltos de línea.
        </p>
      </div>
      <div className="border-t border-slate-100 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <ListChecks className="w-3.5 h-3.5 text-[#5B50D6]" />
              Especificaciones Técnicas
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Agregá pares de propiedad y valor (ej. <span className="font-semibold text-slate-600">Medidas</span> → <span className="font-semibold text-slate-600">42.8 cm x 66 cm x 68 cm</span>).
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddSpec}
            className="inline-flex items-center justify-center gap-1.5 bg-[#1A1D27] hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Especificación</span>
          </button>
        </div>

        {specs.length === 0 ? (
          <div className="text-center py-6 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 text-xs text-slate-400">
            No cargaste especificaciones técnicas todavía. Hacé clic en{' '}
            <strong className="text-slate-600">“Agregar Especificación”</strong> para crear la ficha técnica.
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <div className="col-span-5">Especificación (Ej. Medidas)</div>
              <div className="col-span-5">Valor (Ej. 42.8 cm x 66 cm x 68 cm)</div>
              <div className="col-span-2 text-right">Orden / Acción</div>
            </div>

            {specs.map((spec, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 sm:p-2 bg-slate-50/80 border border-slate-200/90 rounded-xl"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleUpdateSpec(idx, 'key', e.target.value)}
                    placeholder="Ej. Medidas"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
                  />
                </div>

                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleUpdateSpec(idx, 'value', e.target.value)}
                    placeholder="Ej. 42.8 cm x 66 cm x 68 cm"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white text-slate-800 focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveSpec(idx, -1)}
                    disabled={idx === 0}
                    title="Subir fila"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSpec(idx, 1)}
                    disabled={idx === specs.length - 1}
                    title="Bajar fila"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/70 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    title="Eliminar fila"
                    className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};