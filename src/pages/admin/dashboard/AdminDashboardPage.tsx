import { useEffect, useState } from 'react';
import { apiClient } from '../../../services/apiClient';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    pendingCommissions: 0,
    activeSellers: 0,
    lowStockItems: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminDashboard = async () => {
      try {
        setLoading(true);
        
        const [commRes, ordersRes] = await Promise.all([
          apiClient.get('commissions/available'),
          apiClient.get('checkout/recent')
        ]).catch(err => {
          console.warn("Faltan endpoints del dashboard:", err);
          return [{ data: { data: [] } }, { data: { data: [] } }];
        });

        const totalPending = commRes.data.data.reduce((acc: number, seller: any) => acc + Number(seller.total_amount), 0);

        setMetrics({
          totalRevenue: 154200.50,
          pendingCommissions: totalPending,
          activeSellers: commRes.data.data.length, 
          lowStockItems: 12 
        });

        setRecentOrders(ordersRes.data.data || []);
      } catch (err) {
        console.error("Error cargando dashboard admin:", err);
        setError("Fallo al conectar con el Core Transaccional.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminDashboard();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Cargando Panel de Control Global...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Dashboard Administrativo (Global)</h1>

      <section style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #4CAF50', padding: '15px', flex: 1, backgroundColor: '#f9fff9' }}>
          <h3 style={{ margin: 0, color: '#2e7d32' }}>Ingresos Brutos (Mes)</h3>
          <h2 style={{ margin: '10px 0 0 0' }}>${metrics.totalRevenue}</h2>
        </div>
        
        <div style={{ border: '1px solid #f44336', padding: '15px', flex: 1, backgroundColor: '#fff5f5' }}>
          <h3 style={{ margin: 0, color: '#c62828' }}>Deuda a Vendedores</h3>
          <h2 style={{ margin: '10px 0 0 0' }}>${metrics.pendingCommissions}</h2>
          <small>Comisiones listas para liquidar</small>
        </div>

        <div style={{ border: '1px solid #2196f3', padding: '15px', flex: 1, backgroundColor: '#f5faff' }}>
          <h3 style={{ margin: 0, color: '#1565c0' }}>Vendedores Activos</h3>
          <h2 style={{ margin: '10px 0 0 0' }}>{metrics.activeSellers}</h2>
        </div>

        <div style={{ border: '1px solid #ff9800', padding: '15px', flex: 1, backgroundColor: '#fffbf5' }}>
          <h3 style={{ margin: 0, color: '#e65100' }}>Alertas de Stock</h3>
          <h2 style={{ margin: '10px 0 0 0' }}>{metrics.lowStockItems} SKUs</h2>
          <small>Unidades por debajo del mínimo</small>
        </div>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
        <h2>Acciones Operativas</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => window.location.href='/portal/admin/catalog'}>Gestionar Catálogo</button>
          <button onClick={() => window.location.href='/portal/admin/commissions'}>Liquidar Comisiones</button>
          <button onClick={() => window.location.href='/portal/admin/team'}>Supervisar Equipo</button>
        </div>
      </section>

      <section style={{ border: '1px solid #ccc', padding: '15px' }}>
        <h2>Últimas Órdenes Registradas (Red)</h2>
        {recentOrders.length === 0 ? (
          <p>No hay órdenes recientes o el endpoint aún no está conectado.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th>ID Orden</th>
                <th>Vendedor Atribuido</th>
                <th>Monto Total</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{order.id.split('-')[0]}...</td>
                  <td>{order.seller_name || 'Orgánico (Sin Atribuir)'}</td>
                  <td>${order.total_amount}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}