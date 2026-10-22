import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';

export const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);
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
              error.response?.data?.error || 'Error de conexión con el servidor.'
          );
      } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            E-Commerce 360 CRM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Acceso para Vendedores y Administradores
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Correo electrónico"
                {...register('email', { required: 'El correo es obligatorio' })}
              />
              {errors.email && <span className="text-red-500 text-xs">{String(errors.email.message)}</span>}
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Contraseña"
                {...register('password', { required: 'La contraseña es obligatoria' })}
              />
              {errors.password && <span className="text-red-500 text-xs">{String(errors.password.message)}</span>}
            </div>
          </div>

          {apiError && (
            <div className="bg-red-50 p-3 rounded text-red-700 text-sm text-center">
              {apiError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? 'Autenticando...' : 'Ingresar al Panel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};