import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
const HomePage = lazy(() => import('./pages/buyer/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProductPage = lazy(() => import('./pages/buyer/ProductPage'));

// Buyer pages
const CartPage = lazy(() => import('./pages/buyer/CartPage'));
const OrdersPage = lazy(() => import('./pages/buyer/OrdersPage'));
const InvoicePage = lazy(() => import('./pages/buyer/InvoicePage'));

// Seller pages
const SellerDashboardPage = lazy(() => import('./pages/seller/DashboardPage'));
const SellerProductsPage = lazy(() => import('./pages/seller/ProductsPage'));
const SellerSuppliersPage = lazy(() => import('./pages/seller/SuppliersPage'));
const SellerOrdersPage = lazy(() => import('./pages/seller/OrdersPage'));
const SellerStoreSettingsPage = lazy(() => import('./pages/seller/StoreSettingsPage'));

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminStoresPage = lazy(() => import('./pages/admin/StoresPage'));

const queryClient = new QueryClient();

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<Spinner />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/products/:id" element={<ProductPage />} />

              {/* Buyer routes */}
              <Route element={<ProtectedRoute allowedRoles={['buyer']} />}>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/invoice/:orderId" element={<InvoicePage />} />
              </Route>

              {/* Seller routes */}
              <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
                <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
                <Route path="/seller/products" element={<SellerProductsPage />} />
                <Route path="/seller/suppliers" element={<SellerSuppliersPage />} />
                <Route path="/seller/orders" element={<SellerOrdersPage />} />
                <Route path="/seller/settings" element={<SellerStoreSettingsPage />} />
              </Route>

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/stores" element={<AdminStoresPage />} />
              </Route>
            </Routes>
          </Suspense>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
