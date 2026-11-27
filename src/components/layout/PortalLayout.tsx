import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Truck, Sliders, Wallet, Users, 
  FilePlus, User, LogOut, Menu, X, Layers,
  FolderTree, ShoppingBag,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/apiClient';
import { NotificationBell } from './NotificationBell';

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

  const headerPortalTitle =
    user?.role === 'ADMIN'
      ? 'Panel Administrativo'
      : 'Portal de Vendedor';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100/70 overflow-hidden font-sans">
      
      <header className="md:hidden flex items-center justify-between bg-[#0B0F19] px-5 py-4 border-b border-slate-800/80 shadow-lg z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wider leading-none">LEGADO HOGAR</h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <NotificationBell variant="dark" />
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-slate-300 hover:text-white bg-slate-800/60 p-2 rounded-xl border border-slate-700/50 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
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
        <div className="relative border-b border-slate-800/60">
          <Link
            to="/admin/dashboard"
            onClick={closeMenu}
            className="flex flex-col items-center justify-center pt-5 pb-3 px-4 group"
          >
            <img
              src="/Logo 3D Legado Hogar.png"
              alt="Legado Hogar"
              className="w-36 sm:w-40 h-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </Link>

          <div className="px-4 py-1.5 bg-slate-900/90 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-300 font-bold uppercase tracking-widest">
              Panel Administrador
            </span>
          </div>

          <button
            type="button"
            onClick={closeMenu}
            aria-label="Cerrar menú"
            className="md:hidden absolute top-2.5 right-2.5 z-10 bg-slate-950/80 text-slate-200 hover:text-white p-1.5 rounded-lg border border-slate-700/70"
          >
            <X className="w-5 h-5" />
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

          {user?.role === 'SELLER' && (
            <div className="mb-6 px-1">
              <NavLink
                to="/portal/sales"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Mis Ventas</span>
              </NavLink>
            </div>
          )}

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
                to="/admin/sales"
                onClick={closeMenu}
                className={({ isActive }) => 
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Ventas</span>
              </NavLink>

              <NavLink
                to="/admin/categories"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <FolderTree className="w-5 h-5" />
                <span>Categorías</span>
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
                to="/admin/storefront"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Sparkles className="w-5 h-5" />
                <span>Vidriera B2C</span>
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
              to="/portal/commissions"
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
              <span>Mis Comisiones</span>
            </NavLink>
          )}

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
            <span>Mi Perfil</span>
          </NavLink>
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

      <div className="flex-1 flex flex-col overflow-hidden relative z-0">
        <div className="hidden md:flex items-center justify-end px-8 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500">
              {headerPortalTitle}
            </span>
            <NotificationBell variant="light" />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};