import { useEffect, useState } from 'react';
import { 
  Wallet, AlertOctagon, AlertTriangle, Users, ArrowUpRight, 
  Loader2, BarChart3, ArrowDownRight, Network, 
  Package
} from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

export default function AdminDashboardPage() {

  const [topSellers, setTopSellers] = useState<{
    id: string;
    name: string;
    refCode: string;
    initials: string;
    totalSold: number;
  }[]>([]);

  const [operationalAlerts, setOperationalAlerts] = useState<{
    activeCount: number;
    alerts: {
      id: string;
      type: 'INFO' | 'WARNING' | 'CRITICAL';
      category: 'USERS' | 'INVENTORY' | 'FINANCE';
      title: string;
      message: string;
      actionUrl: string;
      actionText: string;
    }[];
  }>({ activeCount: 0, alerts: [] });

  const [metrics, setMetrics] = useState({
    totalRevenue: 0, revenueChange: 0, pendingCommissions: 0,
    affiliateRevenuePercentage: 0, lowStockItems: 0
  });

  const [timeRange, setTimeRange] = useState<'7d' | 'month' | 'quarter'>('7d');
  const [chartData, setChartData] = useState({
    summary: { totalSales: 0, totalCommissions: 0, margin: 0 },
    series: [] as { day: string, date: string, sales: number, commissions: number }[]
  });
  
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        
        const [revenueRes, debtRes, stockRes, alertsRes, topSellersRes] = await Promise.all([
          apiClient.get('dashboard/revenue').catch(() => ({ data: { data: { netRevenue: 0, comparisonVsLastMonthPercentage: 0, affiliateRevenuePercentage: 0 } } })),
          apiClient.get('dashboard/debt').catch(() => ({ data: { data: { pendingCommissions: 0 } } })),
          apiClient.get('dashboard/inventory-alerts').catch(() => ({ data: { data: { criticalStockCount: 0 } } })),
          apiClient.get('dashboard/alerts').catch(() => ({ data: { data: { activeCount: 0, alerts: [] } } })),
          apiClient.get('dashboard/top-sellers').catch(() => ({ data: { data: [] } }))
        ]);

        const revenueData = revenueRes.data?.data;
        const debtData = debtRes.data?.data;
        const stockData = stockRes.data?.data;

        setMetrics({
          totalRevenue: Number(revenueData.netRevenue || 0),
          revenueChange: Number(revenueData.comparisonVsLastMonthPercentage || 0),
          pendingCommissions: Number(debtData.pendingCommissions || 0),
          affiliateRevenuePercentage: Number(revenueData.affiliateRevenuePercentage || 0),
          lowStockItems: Number(stockData.criticalStockCount || 0)
        });

        setTopSellers(topSellersRes.data?.data || []);

        setOperationalAlerts(alertsRes.data?.data || { activeCount: 0, alerts: [] });

      } catch (err) {
        console.error("Error cargando dashboard admin:", err);
        setError("Fallo al conectar con el Core Transaccional.");
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        setChartLoading(true);
        const res = await apiClient.get(`dashboard/performance?range=${timeRange}`);
        if (res.data?.data) setChartData(res.data.data);
      } catch (err) {
        console.error("Error cargando gráfico:", err);
      } finally {
        setChartLoading(false);
      }
    };
    fetchChart();
  }, [timeRange]);

  const absoluteMaxData = Math.max(...chartData.series.map(s => Math.max(s.sales, s.commissions)), 100);
  const chartCeiling = absoluteMaxData * 1.15;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-600">Cargando Panel de Control Global...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Resumen Financiero y Operativo
            </h1>
          </div>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                INGRESO NETO
              </span>
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                ${metrics.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${
                metrics.revenueChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {metrics.revenueChange >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )} 
                {metrics.revenueChange >= 0 ? `+${metrics.revenueChange}%` : `${metrics.revenueChange}%`} 
                <span className="text-slate-500 font-normal">vs mes anterior</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                DEUDA A VENDEDORES
              </span>
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                ${metrics.pendingCommissions.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-rose-500 font-medium flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" /> -4.2% pendiente
                </span>
                <a href="/admin/commissions" className="text-indigo-600 font-semibold hover:underline">
                  Ver liquidaciones →
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                CONTRIBUCIÓN DE RED
              </span>
              <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                <Network className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {metrics.affiliateRevenuePercentage}%
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Ventas generadas por afiliados
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                SKUS EN RIESGO
              </span>
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {metrics.lowStockItems} <span className="text-sm font-normal text-slate-500">productos</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block"></span> Por debajo del mínimo
                </span>
                <a href="/admin/inventory/restock" className="text-indigo-600 font-semibold hover:underline">
                  Abastecer →
                </a>
              </div>
            </div>
          </div>

        </section>

        <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Rendimiento Operativo y Comisiones</h2>
                {chartLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
                <button 
                  onClick={() => setTimeRange('7d')}
                  className={`px-3 py-1.5 rounded-lg shadow-sm transition-colors ${timeRange === '7d' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Últimos 7 días
                </button>
                <button 
                  onClick={() => setTimeRange('month')}
                  className={`px-3 py-1.5 rounded-lg shadow-sm transition-colors ${timeRange === 'month' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Este mes
                </button>
                <button 
                  onClick={() => setTimeRange('quarter')}
                  className={`px-3 py-1.5 rounded-lg shadow-sm transition-colors ${timeRange === 'quarter' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Trimestre
                </button>
              </div>
            </div>
          </div>

          <div className={`relative h-64 sm:h-72 w-full flex flex-col justify-end pt-8 pb-4 mt-6 transition-opacity ${chartLoading ? 'opacity-50' : 'opacity-100'}`}>
            
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30 z-0">
              {[4, 3, 2, 1, 0].map((step) => {
                const stepValue = (chartCeiling / 4) * step;
                return (
                  <div key={step} className="border-b border-slate-200 w-full text-[10px] text-right pr-2 text-slate-400">
                    ${stepValue >= 1000 ? (stepValue / 1000).toFixed(1) + 'k' : stepValue.toFixed(0)}
                  </div>
                );
              })}
            </div>

            <div className="relative z-10 flex justify-between items-end h-full px-2 sm:px-8">
              {chartData.series.map((dataPoint, index) => {
                const salesHeight = `${(dataPoint.sales / chartCeiling) * 100}%`;
                const commHeight = `${(dataPoint.commissions / chartCeiling) * 100}%`;

                return (
                  <div key={index} className="flex flex-col items-center group relative w-full">

                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs z-30 pointer-events-none min-w-30 left-1/2 -translate-x-1/2">
                      <p className="text-slate-400 font-medium text-[10px] mb-1">{dataPoint.date}</p>
                      <div className="flex justify-between gap-3">
                        <span>Ventas:</span>
                        <span className="font-mono text-indigo-400">${dataPoint.sales.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Comisión:</span>
                        <span className="font-mono text-emerald-400">${dataPoint.commissions.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                    </div>

                    <div className="flex items-end gap-0.5 sm:gap-1 w-full justify-center h-48 sm:h-56">
                      <div 
                        className="w-2 sm:w-4 bg-indigo-600 rounded-t-sm transition-all duration-500 hover:bg-indigo-500" 
                        style={{ height: salesHeight }}
                      ></div>
                      <div 
                        className="w-2 sm:w-4 bg-emerald-500 rounded-t-sm transition-all duration-500 hover:bg-emerald-400" 
                        style={{ height: commHeight }}
                      ></div>
                    </div>

                    <span className={`text-[10px] sm:text-xs font-medium mt-3 ${
                      index === chartData.series.length - 1 
                        ? 'text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded' 
                        : 'text-slate-500'
                    }`}>
                      {dataPoint.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-6 font-medium text-slate-600">
              <span>Total Ventas: <strong className="text-slate-900 font-mono">${chartData.summary.totalSales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>
              <span>Comisiones Generadas: <strong className="text-slate-900 font-mono">${chartData.summary.totalCommissions.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span>
            </div>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-semibold border border-emerald-200">
              Margen de Plataforma: {chartData.summary.margin}%
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         
         <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
           <div className="p-6 border-b border-slate-100 flex items-center justify-between">
             <div>
               <h2 className="text-base font-bold text-slate-900">Top 5 Vendedores (Leaderboard)</h2>
               <p className="text-xs text-slate-500 mt-0.5">Rendimiento semanal por volumen transaccionado.</p>
             </div>
             <a href="/admin/team" className="text-xs font-semibold text-indigo-600 hover:underline">
               Ver directorio
             </a>
           </div>

           <div className="overflow-x-auto flex-1">
             <table className="w-full text-left border-collapse">
               <thead>
                 <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                   <th className="py-3 px-6">Vendedor</th>
                   <th className="py-3 px-6 text-right">Monto Vendido</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                 {topSellers.length === 0 ? (
                   <tr>
                     <td colSpan={2} className="py-8 text-center text-slate-500">
                       No hay ventas registradas por vendedores en los últimos 30 días.
                     </td>
                   </tr>
                 ) : (
                   topSellers.map((seller, idx) => (
                     <tr key={seller.id || idx} className="hover:bg-slate-50/50 transition-colors">
                       <td className="py-4 px-6 flex items-center gap-3">
                         <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs
                           ${idx === 0 ? 'bg-amber-100 text-amber-700' : 
                             idx === 1 ? 'bg-slate-200 text-slate-700' : 
                             idx === 2 ? 'bg-orange-100 text-orange-700' : 
                             'bg-indigo-100 text-indigo-700'}`
                         }>
                           {seller.initials}
                         </div>
                         <div>
                           <p className="font-bold text-slate-900 leading-tight">{seller.name}</p>
                           <p className="text-xs text-slate-400 font-mono">Ref: {seller.refCode}</p>
                         </div>
                       </td>
                       <td className="py-4 px-6 text-right font-bold font-mono text-slate-900">
                         ${seller.totalSold.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
         </div>

         <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Alertas Operativas y Riesgo</h2>
              {operationalAlerts.activeCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              operationalAlerts.activeCount > 0 
                ? 'bg-rose-50 border-rose-200 text-rose-700' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              {operationalAlerts.activeCount} Pendientes
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {operationalAlerts.alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <Package className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">Todo está funcionando correctamente.</p>
              </div>
            ) : (
              operationalAlerts.alerts.map((alert) => {
                const isWarning = alert.type === 'WARNING' || alert.type === 'CRITICAL';
                const bgClass = isWarning ? 'bg-amber-50/30 border-amber-200' : 'bg-slate-50/50 border-slate-200';
                const iconBgClass = isWarning ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600';
                const badgeClass = isWarning ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700';

                const IconComponent = alert.category === 'USERS' ? Users : 
                                      alert.category === 'INVENTORY' ? Package : AlertTriangle;

                return (
                  <div key={alert.id} className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${bgClass}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-0.5 ${iconBgClass}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badgeClass}`}>
                            {alert.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{alert.message}</p>
                      </div>
                    </div>
                    <a 
                      href={alert.actionUrl}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all whitespace-nowrap"
                    >
                      {alert.actionText}
                    </a>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}