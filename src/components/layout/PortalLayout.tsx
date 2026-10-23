import { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/apiClient';

export const PortalLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const closeMenu = () => setIsMobileMenuOpen(false);

  const dashboardRoute = user?.role === 'ADMIN' ? '/admin/dashboard' : '/portal/dashboard';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 overflow-hidden">
      
      <header className="md:hidden flex items-center justify-between bg-slate-800 p-4 shadow-md z-30">
        <div>
          <h2 className="text-lg font-bold text-blue-400">E-Commerce 360</h2>
          <p className="text-[10px] text-slate-400">Panel B2B</p>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-slate-300 hover:text-white focus:outline-none p-2"
          aria-label="Abrir menú"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-slate-800 text-white flex flex-col transform transition-transform duration-300 ease-in-out 
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} 
          md:relative md:translate-x-0 md:left-auto shadow-2xl md:shadow-none`}
      >
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-blue-400 hidden md:block">E-Commerce 360</h2>
            <h2 className="text-lg font-bold text-white md:hidden">Menú</h2>
            <p className="text-xs text-slate-400 mt-1 hidden md:block">Panel B2B</p>
          </div>
          <button onClick={closeMenu} className="md:hidden text-slate-400 hover:text-white p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLink 
            to={dashboardRoute}
            onClick={closeMenu}
            className={({ isActive }) => 
              `block py-3 md:py-2 px-4 md:px-3 rounded transition-colors ${
                isActive ? 'bg-slate-700 text-white font-medium' : 'hover:bg-slate-700 text-slate-300'
              }`
            }
          >
            Inicio
          </NavLink>

          {user?.role === 'ADMIN' && (
            <NavLink 
              to="/admin/catalog"
              onClick={closeMenu}
              className={({ isActive }) => 
                `block py-3 md:py-2 px-4 md:px-3 rounded transition-colors ${
                  isActive ? 'bg-slate-700 text-white font-medium' : 'hover:bg-slate-700 text-slate-300'
                }`
              }
            >
              Productos
            </NavLink>
          )}
        </nav>

        <div className="p-4 bg-slate-900 border-t border-slate-700">
          <div className="text-sm font-medium truncate">{user?.email}</div>
          <div className="text-xs text-slate-400 mb-4 border-b border-slate-700 pb-2">Rol: {user?.role}</div>
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 md:py-2 px-4 rounded transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0">
        <Outlet />
      </main>
    </div>
  );
};