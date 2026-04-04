import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute, { GuestRoute } from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

// Public
const HomePage = lazy(() => import("./pages/buyer/HomePage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const ProductPage = lazy(() => import("./pages/buyer/ProductPage"));

// Guest-only (redirect away if logged in)
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));

// Buyer
const CartPage = lazy(() => import("./pages/buyer/CartPage"));
const OrdersPage = lazy(() => import("./pages/buyer/OrdersPage"));
const InvoicePage = lazy(() => import("./pages/buyer/InvoicePage"));

// Admin
const AdminDashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/ProductsPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/CategoriesPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/OrdersPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/UsersPage"));
const AdminMessagesPage = lazy(() => import("./pages/admin/MessagesPage"));

const queryClient = new QueryClient();

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<Spinner />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/products/:id" element={<ProductPage />} />

              {/* Guest only — redirect logged-in users away */}
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Buyer */}
              <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/invoice/:orderId" element={<InvoicePage />} />
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard"  element={<AdminDashboardPage />} />
                  <Route path="/admin/products"   element={<AdminProductsPage />} />
                  <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                  <Route path="/admin/orders"     element={<AdminOrdersPage />} />
                  <Route path="/admin/users"      element={<AdminUsersPage />} />
                  <Route path="/admin/messages"   element={<AdminMessagesPage />} />
                </Route>
              </Route>
            </Routes>
          </Suspense>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
