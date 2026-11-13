import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Zap, TrendingUp, Wallet, Lock, AtSign, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';

export const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await apiClient.post('auth/login', {
        email: data.email,
        password: data.password,
      });

      login(response.data.user);
      
      if (response.data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/portal/dashboard');
      }
    } catch (error: any) {
      console.error('[Arquitectura] Error capturado en Login:', error);
      setApiError(
        error.response?.data?.error || 'Credenciales inválidas o error de conexión.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans">
      
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d111c] relative flex-col justify-between p-12 xl:p-16 text-white border-r border-slate-800"
           style={{
             backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
             backgroundSize: '40px 40px'
           }}>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <span className="text-xl font-bold tracking-wider">ELECTROTECH</span>
        </div>

        <div className="max-w-xl mt-8">
          <h1 className="text-[2.75rem] font-bold leading-tight mb-6">
            Gestiona tus ventas y comisiones en tiempo real
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-12">
            La plataforma unificada para distribuidores, asesores B2B y directivos. Control de inventario crítico, liquidaciones automáticas e integraciones contables directas.
          </p>

          <div className="bg-[#151b2b] border border-slate-700/60 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                FLUJO TRANSACCIONAL CONSOLIDADO
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a2133] p-4 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-400 text-sm">Ventas Totales Hoy</span>
                  <span className="text-emerald-400 text-xs font-bold flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> +18.4%
                  </span>
                </div>
                <div className="text-3xl font-bold">$5.450.000</div>
                <div className="h-1 w-full bg-slate-700 mt-4 rounded-full overflow-hidden">
                  <div className="h-full bg-linear-to-r from-indigo-500 to-emerald-400 w-[70%]" />
                </div>
              </div>
              <div className="bg-[#1a2133] p-4 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-400 text-sm">Comisiones Liquidadas</span>
                  <Wallet className="w-4 h-4 text-slate-500" />
                </div>
                <div className="text-3xl font-bold">$680.000</div>
                <div className="text-xs text-slate-500 mt-2">
                  Liquidación directa CBU/CVU activa
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col p-6 sm:p-12 xl:p-16 bg-white relative">

        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold mb-6">
              <Lock className="w-3.5 h-3.5" />
              Acceso Seguro a Canales y Distribución
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-slate-500 text-sm">
              Ingresa tus credenciales de operador o asesor para continuar.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <button type="button" className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar con Google
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400 font-medium">o ingresa con tu correo corporativo</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                  Correo Corporativo o CUIT
                </label>
                <span className="text-xs text-slate-400">Canal Verificado</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <AtSign className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  type="text"
                  autoComplete="email"
                  className={`block w-full pl-10 pr-4 py-3 rounded-xl border bg-white text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.email 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                  placeholder="marcelo.vega@distribuidora-uyo.com.ar"
                  {...register('email', { required: 'El identificador es obligatorio' })}
                />
              </div>
              {errors.email && <span className="text-red-500 text-xs mt-1.5 block font-medium">{String(errors.email.message)}</span>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-900 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`block w-full pl-10 pr-12 py-3 rounded-xl border bg-white text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.password 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                  placeholder="••••••••••••"
                  {...register('password', { required: 'La contraseña es obligatoria' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <span className="text-red-500 text-xs mt-1.5 block font-medium">{String(errors.password.message)}</span>}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded bg-white checked:bg-indigo-600 checked:border-indigo-600 transition-colors cursor-pointer" />
                  <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                    <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Recordarme por 30 días</span>
              </label>
              <a href="/recuperar" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {apiError && (
              <div className="bg-red-50/50 border border-red-200 p-3 rounded-xl flex items-start gap-3">
                <span className="text-red-600 text-sm font-medium">{apiError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Ingresar al Panel de Control
                </>
              )}
            </button>
          </form>

        </div>

        <div className="mt-auto pt-8 flex flex-col items-center border-t border-slate-100 text-xs text-slate-500 text-center">
          <p className="mb-2">
            ¿Problemas para acceder? Contacta a la <a href="/soporte" className="text-indigo-600 font-medium">Mesa de Ayuda Técnica</a>
          </p>
          <p>© 2026 ELECTROTECH Systems Inc. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};