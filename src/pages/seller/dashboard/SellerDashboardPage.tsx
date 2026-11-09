import { useEffect, useState } from 'react';
import { apiClient } from '../../../services/apiClient';
import { useAuthStore } from '../../../store/authStore';

interface SellerMetricsDTO {
  seller_id?: string;
  seller_name?: string;
  total_amount: number;
  count: number;
  commission_ids: string[];
}

interface PayoutDTO {
  id: string;
  total_amount: string | number;
  status: string;
  transaction_ref: string;
  created_at: string;
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

  const [metrics, setMetrics] = useState<SellerMetricsDTO>({ 
    total_amount: 0, 
    count: 0, 
    commission_ids: [] 
  });
  
  const [payouts, setPayouts] = useState<PayoutDTO[]>([]);
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

        console.log("🔍 [Frontend] Iniciando carga paralela de dashboard B2B...");

        const [commRes, payoutsRes, salesRes] = await Promise.all([
          apiClient.get('commissions/my-commissions'),
          apiClient.get('commissions/my-payouts'),
          apiClient.get('orders/my-sales')
        ]);
        
        console.log("📊 [Frontend] Respuestas recibidas con éxito:", {
          commissions: commRes.data,
          payouts: payoutsRes.data,
          sales: salesRes.data
        });

        setMetrics(commRes.data.data?.[0] || commRes.data[0] || { total_amount: 0, count: 0, commission_ids: [] });
        setPayouts(payoutsRes.data.data || payoutsRes.data || []);
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

  if (loading) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Cargando métricas transaccionales...</div>;

  const sellerRefCode = user?.id || metrics.seller_id || 'SIN-REF';
  const referralLink = `${B2C_URL}?ref=${sellerRefCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Mi Panel de Ventas</h1>

      {apiError && (
        <div style={{ border: '1px solid red', background: '#ffebee', color: '#c62828', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
          <strong>⚠️ Error de Integración Frontend:</strong> {apiError}
        </div>
      )}
      
      <section style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h2>Atribución y Enlace de Ventas</h2>
        <p style={{ fontSize: '14px', color: '#555', marginBottom: '10px' }}>
          Comparte este enlace con tus clientes para asegurar la atribución automática de tus ventas y comisiones:
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f0f4f8', padding: '12px', borderRadius: '6px', border: '1px solid #d0e1fd' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8', textTransform: 'uppercase' }}>Tu Link Único</span>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#1e3a8a', wordBreak: 'break-all', marginTop: '2px' }}>
              {referralLink}
            </div>
          </div>
          <div>
            <button 
              onClick={handleCopyLink}
              style={{ padding: '8px 16px', background: '#2563eb', color: '#white', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {copied ? '¡Copiado al Portapapeles!' : 'Copiar Link'}
            </button>
          </div>
        </div>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h2>Resumen Financiero</h2>
        <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }}>
          <div>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Saldo Disponible</p>
            <h3 style={{ color: 'green', margin: '5px 0 0 0', fontSize: '24px' }}>${metrics.total_amount || 0}</h3>
          </div>
          <div>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Ventas Liquidadas</p>
            <h3 style={{ margin: '5px 0 0 0', fontSize: '24px' }}>{metrics.count || 0}</h3>
          </div>
        </div>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h2>Historial de Clientes y Ventas ({sales.length})</h2>
        {sales.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Aún no tienes ventas registradas con tu enlace.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', background: '#f9f9f9' }}>
                  <th style={{ padding: '10px' }}>Fecha</th>
                  <th style={{ padding: '10px' }}>ID Orden</th>
                  <th style={{ padding: '10px' }}>Monto</th>
                  <th style={{ padding: '10px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{new Date(sale.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{sale.id}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>${sale.total_amount}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ 
                        color: sale.status === 'PAID' ? 'green' : sale.status === 'PENDING' ? 'orange' : 'gray',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        background: sale.status === 'PAID' ? '#e8f5e9' : '#fff3e0',
                        borderRadius: '4px'
                      }}>
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h2>Historial de Transferencias Recibidas ({payouts.length})</h2>
        {payouts.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Aún no tienes liquidaciones históricas.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee', background: '#f9f9f9' }}>
                  <th style={{ padding: '10px' }}>Fecha</th>
                  <th style={{ padding: '10px' }}>Referencia</th>
                  <th style={{ padding: '10px' }}>Monto</th>
                  <th style={{ padding: '10px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{p.transaction_ref}</td>
                    <td style={{ padding: '10px', fontWeight: 'bold', color: '#2e7d32' }}>${p.total_amount}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ padding: '2px 6px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontWeight: 'bold' }}>
                        {p.status}
                      </span>
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