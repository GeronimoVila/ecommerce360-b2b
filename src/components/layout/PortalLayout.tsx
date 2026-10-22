import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/apiClient';

export const PortalLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.post('auth/logout');
    } catch (error) {
      console.error('Error cerrando sesión en el servidor', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-blue-400">E-Commerce 360</h2>
          <p className="text-xs text-slate-400 mt-1">Panel B2B</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <div className="block py-2 px-3 rounded bg-slate-700 text-white font-medium cursor-pointer">
            Dashboard
          </div>
          <div className="block py-2 px-3 rounded hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer">
            Presupuestos Asistidos
          </div>
        </nav>

        <div className="p-4 bg-slate-900 border-t border-slate-700">
          <div className="text-sm font-medium">{user?.email}</div>
          <div className="text-xs text-slate-400 mb-4 border-b border-slate-700 pb-2">Rol: {user?.role}</div>
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};