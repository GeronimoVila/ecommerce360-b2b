import { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Truck, Sliders, Wallet, Users, 
  FilePlus, User, LogOut, Menu, X, Layers
} from 'lucide-react';
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
    <div className="flex flex-col md:flex-row h-screen bg-slate-100/70 overflow-hidden font-sans">
      
      <header className="md:hidden flex items-center justify-between bg-[#0B0F19] px-5 py-4 border-b border-slate-800/80 shadow-lg z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wider leading-none">ELECTROTECH</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Enterprise Admin</p>
          </div>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-slate-300 hover:text-white bg-slate-800/60 p-2 rounded-xl border border-slate-700/50 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <aside 
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-[#121727] text-white flex flex-col transform transition-transform duration-300 ease-in-out 
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} 
          md:relative md:translate-x-0 md:left-auto md:w-64 border-l md:border-r md:border-l-0 border-slate-800/80 shadow-2xl md:shadow-none`}
      >
        <div className="p-6 border-b border-slate-800/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-wider leading-tight">ELECTROTECH</h2>
              <p className="text-xs text-slate-400 font-medium">Enterprise Admin</p>
            </div>
          </div>
          <button onClick={closeMenu} className="md:hidden text-slate-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          
          {user?.role === 'SELLER' && (
            <div className="mb-6 px-1">
              <NavLink
                to="/portal/presupuestos/nuevo"
                onClick={closeMenu}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all text-sm"
              >
                <FilePlus className="w-4 h-4" />
                <span>Nuevo Pedido</span>
              </NavLink>
            </div>
          )}

          <NavLink 
            to={dashboardRoute}
            onClick={closeMenu}
            className={({ isActive }) => 
              `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Inicio</span>
          </NavLink>

          {user?.role === 'ADMIN' && (
            <>
              <NavLink 
                to="/admin/catalog"
                onClick={closeMenu}
                className={({ isActive }) => 
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Package className="w-5 h-5" />
                <span>Productos</span>
              </NavLink>

              <NavLink 
                to="/admin/inventory/restock"
                onClick={closeMenu}
                className={({ isActive }) => 
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Truck className="w-5 h-5" />
                <span>Proveedores</span>
              </NavLink>

              <NavLink 
                to="/admin/financial/rules"
                onClick={closeMenu}
                className={({ isActive }) => 
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Sliders className="w-5 h-5" />
                <span>Reglas de pago</span>
              </NavLink>

              <NavLink 
                to="/admin/commissions"
                onClick={closeMenu}
                className={({ isActive }) => 
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Wallet className="w-5 h-5" />
                <span>Comisiones</span>
              </NavLink>

              <NavLink 
                to="/admin/team"
                onClick={closeMenu}
                className={({ isActive }) => 
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Users className="w-5 h-5" />
                <span>Equipo</span>
              </NavLink>
            </>
          )}

          {user?.role === 'SELLER' && (
            <NavLink 
              to="/portal/profile"
              onClick={closeMenu}
              className={({ isActive }) => 
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <User className="w-5 h-5" />
              <span>Perfil</span>
            </NavLink>
          )}
        </nav>

        <div className="px-4 py-2 border-t border-slate-800/60 pt-3">
          <p className="text-xs font-semibold text-slate-200 truncate">{user?.email}</p>
          <p className="text-[11px] text-slate-500 capitalize">Rol: {user?.role?.toLowerCase()}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-sm font-medium transition-colors"
        >
        <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0">
        <Outlet />
      </main>
    </div>
  );
};