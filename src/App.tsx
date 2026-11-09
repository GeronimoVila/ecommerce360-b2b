import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { PortalLayout } from './components/layout/PortalLayout';
import { LoginPage } from './pages/auth/LoginPage';

const SellerDashboardPage = lazy(() => import('./pages/seller/dashboard/SellerDashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/dashboard/AdminDashboardPage'));
const MyProfilePage = lazy(() => import('./pages/seller/MyProfilePage').then(module => ({ default: module.MyProfilePage })));
const CreateBudgetPage = lazy(() => import('./pages/budgets/CreateBudgetPage').then(module => ({ default: module.CreateBudgetPage })));
const CatalogPage = lazy(() => import('./pages/admin/catalog/CatalogPage').then(module => ({ default: module.CatalogPage })));
const ProductFormPage = lazy(() => import('./pages/admin/catalog/ProductFormPage').then(module => ({ default: module.ProductFormPage })));
const ComboFormPage = lazy(() => import('./pages/admin/catalog/ComboFormPage').then(module => ({ default: module.ComboFormPage })));
const RestockFormPage = lazy(() => import('./pages/admin/inventory/RestockFormPage').then(module => ({ default: module.RestockFormPage })));
const FinancialRulesPage = lazy(() => import('./pages/admin/financial/FinancialRulesPage').then(module => ({ default: module.FinancialRulesPage })));
const SellersManagementPage = lazy(() => import('./pages/admin/team/SellersManagementPage').then(module => ({ default: module.SellersManagementPage })));
const CommissionsPage = lazy(() => import('./components/admin/financial/CommissionsPage').then(module => ({ default: module.CommissionsPage })));

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
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-gray-50">
           <div className="animate-pulse text-gray-500 font-semibold">Cargando módulo...</div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute allowedRoles={['SELLER', 'ADMIN']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/portal/dashboard" element={<SellerDashboardPage />} />
              <Route path="/portal/profile" element={<MyProfilePage />} />
              <Route path="/portal/presupuestos/nuevo" element={<CreateBudgetPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/catalog" element={<CatalogPage />} />
              <Route path="/admin/catalog/new" element={<ProductFormPage />} />
              <Route path="/admin/catalog/edit/:id" element={<ProductFormPage />} />
              <Route path="/admin/catalog/combo/new" element={<ComboFormPage />} />
              <Route path="/admin/catalog/combo/edit/:id" element={<ComboFormPage />} />
              <Route path="/admin/inventory/restock" element={<RestockFormPage />} />
              <Route path="/admin/financial/rules" element={<FinancialRulesPage />} />
              <Route path="/admin/team" element={<SellersManagementPage />} />
              <Route path="/admin/commissions" element={<CommissionsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;