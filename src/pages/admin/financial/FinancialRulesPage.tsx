import { useState, useEffect } from 'react';
import { Plus, Sliders, Ticket, CreditCard, Trash2, Edit3, AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentRuleService, type PaymentRule } from '../../../services/payment-rule.service';
import { PaymentRuleModal } from '../../../components/admin/financial/PaymentRuleModal';
import { CouponService, type Coupon } from '../../../services/coupon.service';
import { CouponModal } from '../../../components/admin/financial/CouponModal';

type ActiveTab = 'rules' | 'coupons';

export const FinancialRulesPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('rules');

  const [rules, setRules] = useState<PaymentRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<PaymentRule | null>(null);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponToEdit, setCouponToEdit] = useState<Coupon | null>(null);

  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeletingCoupon, setIsDeletingCoupon] = useState(false);

  const fetchRules = async () => {
    try {
      setIsLoadingRules(true);
      const data = await PaymentRuleService.getAll();
      setRules(data);
    } catch (error) {
      console.error('Error cargando reglas:', error);
    } finally {
      setIsLoadingRules(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setIsLoadingCoupons(true);
      const data = await CouponService.getAll();
      setCoupons(data);
    } catch (error) {
      console.error('Error cargando cupones:', error);
    } finally {
      setIsLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchCoupons();
  }, []);

  const handleToggleRuleStatus = async (rule: PaymentRule) => {
    try {
      if (rule.is_active) {
        await PaymentRuleService.softDelete(rule.id);
        toast.success('Regla financiera desactivada.');
      } else {
        await PaymentRuleService.update(rule.id, Number(rule.coefficient), true);
        toast.success('Regla financiera reactivada.');
      }
      fetchRules();
    } catch (error) {
      toast.error('Error al cambiar el estado de la regla.');
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    try {
      await CouponService.update(coupon.id, { is_active: !coupon.is_active });
      fetchCoupons();
      toast.success(
        coupon.is_active
          ? `Cupón "${coupon.code}" pausado.`
          : `Cupón "${coupon.code}" activado.`
      );
    } catch (error) {
      toast.error('Error al actualizar el estado del cupón.');
    }
  };

  const openDeleteCouponModal = (coupon: Coupon) => {
    setCouponToDelete(coupon);
  };

  const cancelDeleteCoupon = () => {
    if (isDeletingCoupon) return;
    setCouponToDelete(null);
    toast.info('Eliminación de cupón cancelada.');
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    setIsDeletingCoupon(true);
    try {
      await CouponService.remove(couponToDelete.id);
      const code = couponToDelete.code;
      setCouponToDelete(null);
      fetchCoupons();
      toast.success(`Cupón "${code}" eliminado o desactivado con éxito.`);
    } catch (error) {
      toast.error('Error al eliminar el cupón.');
    } finally {
      setIsDeletingCoupon(false);
    }
  };

  const renderScope = (rule: PaymentRule) => {
    if (rule.is_global) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold bg-indigo-50 text-[#5B50D6] border border-indigo-100 rounded-lg">
          Global
        </span>
      );
    }
    if (rule.category_id) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100 rounded-lg">
          Categoría: {rule.category?.name || 'ID'}
        </span>
      );
    }
    if (rule.product_id) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 rounded-lg">
          Producto: {rule.product?.sku || 'ID'}
        </span>
      );
    }
    return <span className="text-slate-400">Desconocido</span>;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-full font-sans text-slate-900">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Reglas Comerciales y Pagos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra coeficientes de financiación por medio de pago y cupones promocionales para el carrito B2C.
          </p>
        </div>

        {activeTab === 'rules' ? (
          <button
            onClick={() => {
              setRuleToEdit(null);
              setIsRuleModalOpen(true);
            }}
            className="bg-[#1A1D27] text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-slate-800 transition-colors font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nueva Regla
          </button>
        ) : (
          <button
            onClick={() => {
              setCouponToEdit(null);
              setIsCouponModalOpen(true);
            }}
            className="bg-[#5B50D6] text-white px-5 py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition-colors font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nuevo Cupón
          </button>
        )}
      </div>

      <div className="bg-white p-1 rounded-xl flex border border-slate-200 shadow-sm w-max">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'rules'
              ? 'bg-[#F8FAFC] text-[#5B50D6] shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Cuotas e Intereses
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'coupons'
              ? 'bg-[#F8FAFC] text-[#5B50D6] shadow-sm border border-slate-100'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Ticket className="w-4 h-4" />
          Cupones de Descuento
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600">
            {coupons.length}
          </span>
        </button>
      </div>

      {activeTab === 'rules' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoadingRules ? (
            <div className="p-16 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
            </div>
          ) : rules.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-3">
              <Sliders className="w-8 h-8 text-slate-300" />
              No hay reglas configuradas. Todas las ventas procesarán con base al precio de lista.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Método</th>
                    <th className="py-3.5 px-6">Cuotas</th>
                    <th className="py-3.5 px-6">Coeficiente</th>
                    <th className="py-3.5 px-6">Alcance (Jerarquía)</th>
                    <th className="py-3.5 px-6">Estado</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {rules.map((rule) => (
                    <tr
                      key={rule.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        !rule.is_active ? 'opacity-60 bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="py-4 px-6 font-bold text-slate-900">{rule.payment_method}</td>
                      <td className="py-4 px-6 font-semibold text-slate-700">
                        {rule.installments} {rule.installments === 1 ? 'pago' : 'cuotas'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono bg-indigo-50/80 text-[#5B50D6] border border-indigo-100 px-2.5 py-1 rounded-lg font-bold text-xs">
                          x {Number(rule.coefficient).toFixed(4)}
                        </span>
                      </td>
                      <td className="py-4 px-6">{renderScope(rule)}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border ${
                            rule.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              rule.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                          {rule.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-3">
                        <button
                          onClick={() => {
                            setRuleToEdit(rule);
                            setIsRuleModalOpen(true);
                          }}
                          className="text-[#5B50D6] hover:text-indigo-800 font-semibold text-xs transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleRuleStatus(rule)}
                          className={`font-semibold text-xs transition-colors ${
                            rule.is_active
                              ? 'text-rose-600 hover:text-rose-800'
                              : 'text-emerald-600 hover:text-emerald-800'
                          }`}
                        >
                          {rule.is_active ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoadingCoupons ? (
            <div className="p-16 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-3">
              <Ticket className="w-8 h-8 text-slate-300" />
              No hay cupones creados todavía. Haz clic en "Nuevo Cupón" para crear el primero.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Código</th>
                    <th className="py-3.5 px-6">Descuento</th>
                    <th className="py-3.5 px-6">Mínimo Compra</th>
                    <th className="py-3.5 px-6">Usos</th>
                    <th className="py-3.5 px-6">Vencimiento</th>
                    <th className="py-3.5 px-6">Estado</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {coupons.map((coupon) => {
                    const isExpired =
                      coupon.expires_at ? new Date(coupon.expires_at) < new Date() : false;

                    return (
                      <tr
                        key={coupon.id}
                        className={`hover:bg-slate-50/50 transition-colors ${
                          !coupon.is_active || isExpired ? 'opacity-65 bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="py-4 px-6">
                          <span className="font-mono font-extrabold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
                            {coupon.code}
                          </span>
                          {coupon.description && (
                            <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                              {coupon.description}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-[#5B50D6] font-mono">
                          {coupon.discount_type === 'PERCENTAGE'
                            ? `${Number(coupon.discount_value)}% OFF`
                            : `$${Number(coupon.discount_value).toLocaleString('es-AR')} OFF`}
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-mono text-xs">
                          {coupon.min_purchase_amount
                            ? `$${Number(coupon.min_purchase_amount).toLocaleString('es-AR')}`
                            : 'Sin mínimo'}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-700">
                          {coupon.used_count} / {coupon.max_uses ?? '∞'}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600">
                          {coupon.expires_at ? (
                            <span className={isExpired ? 'text-rose-600 font-bold' : ''}>
                              {new Date(coupon.expires_at).toLocaleDateString('es-AR')}
                              {isExpired ? ' (Vencido)' : ''}
                            </span>
                          ) : (
                            'Sin vencimiento'
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border ${
                              coupon.is_active && !isExpired
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                coupon.is_active && !isExpired ? 'bg-emerald-500' : 'bg-rose-500'
                              }`}
                            ></span>
                            {isExpired ? 'Expirado' : coupon.is_active ? 'Activo' : 'Pausado'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setCouponToEdit(coupon);
                                setIsCouponModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-[#5B50D6] hover:bg-[#5B50D6]/10 rounded-lg transition-colors"
                              title="Editar cupón"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleCouponStatus(coupon)}
                              className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                                coupon.is_active
                                  ? 'text-amber-700 hover:bg-amber-50'
                                  : 'text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {coupon.is_active ? 'Pausar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => openDeleteCouponModal(coupon)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar cupón"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      <PaymentRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSuccess={() => {
          setIsRuleModalOpen(false);
          fetchRules();
        }}
        ruleToEdit={ruleToEdit}
      />

      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onSuccess={() => {
          setIsCouponModalOpen(false);
          fetchCoupons();
        }}
        couponToEdit={couponToEdit}
      />

      {couponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Eliminar Cupón</h3>
              </div>
              <button
                type="button"
                onClick={cancelDeleteCoupon}
                disabled={isDeletingCoupon}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-2">
              <p className="text-sm text-slate-700">
                ¿Estás seguro de que deseas eliminar o desactivar el cupón{' '}
                <strong className="font-mono text-slate-900">{couponToDelete.code}</strong>?
              </p>
              <p className="text-xs text-slate-500">
                Si el cupón ya fue utilizado en ventas previas, se desactivará para preservar la auditoría.
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
              <button
                type="button"
                onClick={cancelDeleteCoupon}
                disabled={isDeletingCoupon}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteCoupon}
                disabled={isDeletingCoupon}
                className="px-5 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeletingCoupon ? 'Procesando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};