import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { PortalLayout } from './components/layout/PortalLayout';
import { useAuthStore } from './store/authStore';
import { CatalogPage } from './pages/admin/catalog/CatalogPage';
import { ProductFormPage } from './pages/admin/catalog/ProductFormPage';

function App() {
  const { checkSession, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN']} />}>
          <Route element={<PortalLayout />}>
            <Route path="/portal/dashboard" element={
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Bienvenido al Dashboard</h1>
                <p className="mt-4 text-gray-600">Aquí irán tus métricas de comisiones.</p>
              </div>
            } />
            <Route path="/portal/presupuestos/nuevo" element={<div>Armador de Presupuestos</div>} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<PortalLayout />}>
            <Route path="/admin/dashboard" element={<div>Dashboard Administrativo</div>} />
            <Route path="/admin/catalog" element={<CatalogPage />} />
            <Route path="/admin/catalog/new" element={<ProductFormPage />} />
            <Route path="/admin/catalog/edit/:id" element={<ProductFormPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;