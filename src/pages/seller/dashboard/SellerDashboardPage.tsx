import { useEffect, useState } from 'react';
import { apiClient } from '../../../services/apiClient';
import { useAuthStore } from '../../../store/authStore';
import { 
  Wallet, Mail, Hourglass, CheckCircle2, 
  CalendarX, Star, AlertCircle, Copy, CheckCircle, 
  Eye, Filter, Share2 
} from 'lucide-react';

interface DashboardData {
  seller_id: string;
  financials: {
    available_balance: number;
    liquidated_sales_count: number;
  };
  pipeline: {
    emitidos: number;
    pendientes: number;
    cerrados: number;
    vencidos: number;
    win_rate: number;
  };
  urgent_actions: Array<{
    id: string;
    client: string;
    cuit: string;
    expires_in: string;
    amount: number;
  }>;
}

interface SaleDTO {
  id: string;
  total_amount: string | number;
  status: string;
  created_at: string;
  customer_id: string | null;
}



export default function SellerDashboardPage() {
  const { user } = useAuthStore();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sales, setSales] = useState<SaleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const B2C_URL = import.meta.env.VITE_B2C_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setApiError(null);

        console.log("🔍 [Frontend] Consolidando dashboard con endpoint unificado...");

        const [dashboardRes, salesRes] = await Promise.all([
          apiClient.get('dashboard/seller/me'),
          apiClient.get('orders/my-sales').catch(() => ({ data: [] }))
        ]);
        console.log("📊 [Frontend] Datos recibidos:", {
          dashboard: dashboardRes.data,
          sales: salesRes.data
        });

        setDashboardData(dashboardRes.data);
        setSales(salesRes.data.data || salesRes.data || []);

      } catch (error: any) {
        console.error("❌ [Frontend] Error crítico al cargar dashboard del Vendedor:", error);
        setApiError(error?.response?.data?.error || error.message || "Error desconocido al conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const sellerRefCode = user?.id || dashboardData?.seller_id || 'SIN-REF';
  const referralLink = `${B2C_URL}?ref=${sellerRefCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-16 flex justify-center bg-[#F8FAFC] min-h-screen items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#5B50D6]"></div>
      </div>
    );
  }

  const availableBalance = dashboardData?.financials?.available_balance || 0;
  const liquidatedCount = dashboardData?.financials?.liquidated_sales_count || 0;
  
  const pipeline = dashboardData?.pipeline || {
    emitidos: 0, pendientes: 0, cerrados: 0, vencidos: 0, win_rate: 0
  };
  const urgentActions = dashboardData?.urgent_actions || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#F8FAFC] min-h-screen font-sans text-slate-900">
      
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Mi Panel de Ventas</h1>
        <p className="text-sm text-slate-500 mt-1">Monitoreo en tiempo real de comisiones, cotizaciones activas y seguimiento comercial.</p>
      </div>

      {apiError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span><strong>Error de Integración Frontend:</strong> {apiError}</span>
        </div>
      )}

      <div className="bg-[#1A1D27] rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1 w-full border-b md:border-b-0 md:border-r border-slate-700 pb-6 md:pb-0 md:pr-6">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Wallet className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Saldo Disponible</span>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl md:text-5xl font-black text-emerald-400 font-mono">
              ${Number(availableBalance).toLocaleString('es-AR')}
            </h2>
            <span className="text-emerald-400 font-bold mb-1.5">ARS</span>
          </div>
        </div>

        <div className="flex-1 w-full md:pl-6">
          <div className="flex items-center gap-2 text-[#8b84e6] mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Ventas Liquidadas</span>
          </div>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl md:text-5xl font-black text-white font-mono">
              {liquidatedCount}
            </h2>
            <span className="text-slate-300 font-medium mb-1.5 text-lg">operaciones</span>
          </div>
        </div>
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" /> Embudo de Cotizaciones
          </h2>
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
            Últimos 30 días
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Emitidos</span>
              <Mail className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-3xl font-black text-slate-800">{pipeline.emitidos}</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">Presupuestos enviados</span>
          </div>
          
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pendientes</span>
              <Hourglass className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-3xl font-black text-amber-600">{pipeline.pendientes}</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">En evaluación de compra</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cerrados</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-3xl font-black text-emerald-600">{pipeline.cerrados}</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">Concretados con éxito</span>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vencidos</span>
              <CalendarX className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-3xl font-black text-slate-600">{pipeline.vencidos}</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">Expirados sin orden</span>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">Win Rate</span>
              <Star className="w-4 h-4 text-[#5B50D6] fill-indigo-200" />
            </div>
            <span className="text-3xl font-black text-[#5B50D6]">{pipeline.win_rate}%</span>
            <span className="text-[10px] text-indigo-700 bg-white/60 border border-indigo-100 px-2 py-1 rounded mt-1 font-semibold">
              +4.2% sobre benchmark
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-5">
            <div className="flex gap-3">
              <div className="mt-1">
                <AlertCircle className={`w-5 h-5 ${urgentActions.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 leading-tight text-lg">Acción Requerida: Presupuestos por vencer</h3>
                <p className="text-xs text-slate-500 mt-1">Cotizaciones con alta probabilidad que requieren cierre hoy</p>
              </div>
            </div>
            {urgentActions.length > 0 && (
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full whitespace-nowrap">
                {urgentActions.length} urgentes
              </span>
            )}
          </div>

          <div className="space-y-3 flex-1">
            {urgentActions.length === 0 ? (
               <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-100">
                 <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                 <p className="text-sm font-semibold text-emerald-800">¡Todo al día!</p>
                 <p className="text-xs text-emerald-600 mt-1">No tienes presupuestos próximos a vencer.</p>
               </div>
            ) : (
              urgentActions.map(action => (
                <div key={action.id} className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl flex justify-between items-center group hover:bg-rose-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-sm">{action.client}</span>
                      <span className="text-[10px] font-mono text-slate-400 border border-slate-200 bg-white px-1.5 rounded">
                        REF: {action.cuit}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <Hourglass className="w-3 h-3" /> Vence en {action.expires_in}
                      </span>
                      <span className="font-mono font-bold text-slate-700 flex items-center gap-1 before:content-['•'] before:text-slate-300 before:mr-1">
                        ${action.amount.toLocaleString('es-AR')} ARS
                      </span>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#5B50D6] hover:border-[#5B50D6] transition-colors shadow-sm">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-[#5B50D6]">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Tu Enlace de Atribución Comercial</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Comparte este enlace para que las compras de clientes B2B se asocien automáticamente a tu CUIT y comisión.
            </p>
            
            <div className="relative mb-6">
              <input 
                type="text" 
                readOnly 
                value={referralLink}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-4 pr-10 text-sm font-mono text-slate-600 outline-none shadow-inner"
              />
              <Copy className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleCopyLink}
              className="flex-1 bg-[#5B50D6] text-white py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '¡Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Últimas Ventas</h2>
            <p className="text-xs text-slate-500 mt-1">Operaciones registradas con atribución confirmada</p>
          </div>
        </div>

        {sales.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium italic bg-slate-50/50">
            Aún no tienes ventas registradas con tu enlace.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-5">Fecha / ID Operación</th>
                  <th className="p-5">Cliente B2B</th>
                  <th className="p-5">Artículos Clave</th>
                  <th className="p-5">Comisión Asignada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-5">
                      <div className="font-mono font-bold text-slate-900">#ORD-{sale.id.substring(0, 5).toUpperCase()}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(sale.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-slate-800">{sale.customer_id || 'Consumidor Final'}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 border border-slate-100 bg-white px-1.5 py-0.5 rounded inline-block">ID: {sale.customer_id?.substring(0,8) || 'N/A'}</div>
                    </td>
                    <td className="p-5">
                      <div className="text-xs text-slate-600 line-clamp-1">Ticket de venta asociado</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Estado: {sale.status}</div>
                    </td>
                    <td className="p-5">
                      <div className={`font-mono font-bold ${sale.status === 'PAID' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'} inline-block px-2.5 py-1 rounded-lg text-sm border ${sale.status === 'PAID' ? 'border-emerald-100' : 'border-amber-100'}`}>
                        +${Number(sale.total_amount).toLocaleString('es-AR')}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 pl-1">
                        {sale.status === 'PAID' ? 'Comisión confirmada' : 'En proceso de conciliación'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}