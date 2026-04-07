import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SignIn, SignUp } from "@clerk/react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute, { GuestRoute } from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

// Public
const HomePage     = lazy(() => import("./pages/buyer/HomePage"));
const AboutPage    = lazy(() => import("./pages/AboutPage"));
const ContactPage  = lazy(() => import("./pages/ContactPage"));
const ProductPage  = lazy(() => import("./pages/buyer/ProductPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Buyer
const CartPage    = lazy(() => import("./pages/buyer/CartPage"));
const OrdersPage  = lazy(() => import("./pages/buyer/OrdersPage"));
const InvoicePage = lazy(() => import("./pages/buyer/InvoicePage"));

// Admin
const AdminDashboardPage  = lazy(() => import("./pages/admin/DashboardPage"));
const AdminProductsPage   = lazy(() => import("./pages/admin/ProductsPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/CategoriesPage"));
const AdminVendorsPage    = lazy(() => import("./pages/admin/VendorsPage"));
const AdminOrdersPage     = lazy(() => import("./pages/admin/OrdersPage"));
const AdminUsersPage      = lazy(() => import("./pages/admin/UsersPage"));
const AdminMessagesPage   = lazy(() => import("./pages/admin/MessagesPage"));

const queryClient = new QueryClient();

// Page-level skeleton for lazy-loaded routes
const PageSkeleton = () => (
  <div className="min-h-screen bg-slate-50 animate-pulse">
    <div className="h-16 bg-white border-b border-slate-200" />
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <div className="h-8 bg-slate-200 rounded w-1/3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="aspect-square bg-slate-100" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Centered wrapper for Clerk's hosted UI components
const ClerkPage = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
    {children}
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              {/* Public */}
              <Route path="/"             element={<HomePage />} />
              <Route path="/about"        element={<AboutPage />} />
              <Route path="/contact"      element={<ContactPage />} />
              <Route path="/products/:id" element={<ProductPage />} />

              {/* Clerk hosted auth — replaces LoginPage / RegisterPage */}
              <Route element={<GuestRoute />}>
                <Route path="/sign-in/*" element={<ClerkPage><SignIn routing="path" path="/sign-in" /></ClerkPage>} />
                <Route path="/sign-up/*" element={<ClerkPage><SignUp routing="path" path="/sign-up" /></ClerkPage>} />
              </Route>

              {/* Invoice — buyer + admin */}
              <Route element={<ProtectedRoute allowedRoles={["buyer", "admin"]} />}>
                <Route path="/invoice/:orderId" element={<InvoicePage />} />
              </Route>

              {/* Buyer */}
              <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
                <Route path="/cart"   element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard"  element={<AdminDashboardPage />} />
                  <Route path="/admin/products"   element={<AdminProductsPage />} />
                  <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                  <Route path="/admin/vendors"    element={<AdminVendorsPage />} />
                  <Route path="/admin/orders"     element={<AdminOrdersPage />} />
                  <Route path="/admin/users"      element={<AdminUsersPage />} />
                  <Route path="/admin/messages"   element={<AdminMessagesPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
