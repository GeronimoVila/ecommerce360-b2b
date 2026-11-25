import { useState, useEffect } from 'react';
import { X, Ticket, AlertCircle, Percent, DollarSign } from 'lucide-react';
import { CouponService, type Coupon, type DiscountType } from '../../../services/coupon.service';

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  couponToEdit: Coupon | null;
}

const toLocalDatetimeInput = (isoString?: string | null): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export const CouponModal = ({ isOpen, onClose, onSuccess, couponToEdit }: CouponModalProps) => {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number | ''>(10);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number | ''>('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (couponToEdit) {
      setCode(couponToEdit.code);
      setDescription(couponToEdit.description || '');
      setDiscountType(couponToEdit.discount_type);
      setDiscountValue(Number(couponToEdit.discount_value));
      setMinPurchaseAmount(
        couponToEdit.min_purchase_amount !== null && couponToEdit.min_purchase_amount !== undefined
          ? Number(couponToEdit.min_purchase_amount)
          : ''
      );
      setMaxUses(
        couponToEdit.max_uses !== null && couponToEdit.max_uses !== undefined
          ? Number(couponToEdit.max_uses)
          : ''
      );
      setStartsAt(toLocalDatetimeInput(couponToEdit.starts_at));
      setExpiresAt(toLocalDatetimeInput(couponToEdit.expires_at));
      setIsActive(couponToEdit.is_active);
    } else {
      setCode('');
      setDescription('');
      setDiscountType('PERCENTAGE');
      setDiscountValue(10);
      setMinPurchaseAmount('');
      setMaxUses('');
      setStartsAt('');
      setExpiresAt('');
      setIsActive(true);
    }
  }, [isOpen, couponToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setError('El código del cupón es obligatorio.');
      return;
    }

    const numericValue = Number(discountValue);
    if (discountValue === '' || isNaN(numericValue) || numericValue <= 0) {
      setError('El valor del descuento debe ser mayor a 0.');
      return;
    }

    if (discountType === 'PERCENTAGE' && numericValue > 100) {
      setError('El descuento porcentual no puede superar el 100%.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: normalizedCode,
        description: description.trim() || null,
        discount_type: discountType,
        discount_value: numericValue,
        min_purchase_amount: minPurchaseAmount === '' ? null : Number(minPurchaseAmount),
        max_uses: maxUses === '' ? null : Number(maxUses),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: isActive,
      };

      if (couponToEdit) {
        await CouponService.update(couponToEdit.id, payload);
      } else {
        await CouponService.create(payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar el cupón.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5B50D6]/10 text-[#5B50D6] flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {couponToEdit ? 'Editar Cupón Promocional' : 'Nuevo Cupón Promocional'}
              </h3>
              <p className="text-xs text-slate-500">Aplicable en el carrito de compras B2C</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Código del Cupón *
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej. BIENVENIDA15"
                required
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-mono uppercase focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Estado
              </label>
              <select
                value={isActive ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
              >
                <option value="ACTIVE">Activo (Vigente)</option>
                <option value="INACTIVE">Inactivo (Pausado)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Descripción interna / comercial
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Descuento de lanzamiento para primera compra"
              className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Tipo de Descuento *
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
              >
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED_AMOUNT">Monto Fijo ($ ARS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Valor del Descuento *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  {discountType === 'PERCENTAGE' ? (
                    <Percent className="w-4 h-4" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={discountType === 'PERCENTAGE' ? 100 : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full pl-9 pr-3 border border-slate-200 rounded-xl p-2.5 text-sm font-mono focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Compra Mínima ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={minPurchaseAmount}
                onChange={(e) =>
                  setMinPurchaseAmount(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Sin mínimo"
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-mono focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Límite de Usos Globales
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ilimitado"
                className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-mono focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Válido Desde
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Válido Hasta (Expiración)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-[#5B50D6]/20 focus:border-[#5B50D6]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#5B50D6] hover:bg-indigo-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : couponToEdit ? 'Guardar Cambios' : 'Crear Cupón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};