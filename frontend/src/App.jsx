import { Routes, Route, Navigate } from 'react-router-dom';

// ── Auth / layout ──────────────────────────────────────────────────────────────
import ProtectedRoute      from '@/components/auth/ProtectedRoute';
import AdminRoute          from '@/components/admin/AdminRoute';

// ── User-facing pages ─────────────────────────────────────────────
import Products            from './pages/Products';
import ProductPage         from '@/pages/ProductPage';
import CartPage            from '@/pages/CartPage';
import LoginPage           from '@/pages/LoginPage';
import RegisterPage        from '@/pages/RegisterPage';
import CheckoutPage        from '@/pages/CheckoutPage';
import OrderSuccessPage    from '@/pages/OrderSuccessPage';
import MyOrdersPage        from '@/pages/MyOrdersPage';
import ProfilePage         from '@/pages/ProfilePage';
import OrderDetailsPage    from '@/pages/OrderDetailsPage';
import NotFoundPage        from '@/pages/NotFoundPage';

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminLayout         from '@/pages/admin/AdminLayout';
import AdminDashboardPage  from '@/pages/admin/AdminDashboardPage';
import AdminOrdersPage     from '@/pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from '@/pages/admin/AdminOrderDetailPage';
import AdminProductsPage   from '@/pages/admin/AdminProductsPage';
import AdminUsersPage      from '@/pages/admin/AdminUsersPage';

export default function App() {
  return (
    <Routes>

      {/* ── Public routes ─────────────────────────────────────────── */}
      <Route path="/"             element={<Navigate to="/products" replace />} />
      <Route path="/products"     element={<Products />} />
      <Route path="/products/:id" element={<ProductPage />} />
      <Route path="/cart"         element={<CartPage />} />
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/register"     element={<RegisterPage />} />

      {/* ── Protected user routes ─────────────────────────────────── */}
      <Route path="/checkout" element={
        <ProtectedRoute><CheckoutPage /></ProtectedRoute>
      } />
      <Route path="/order-success" element={
        <ProtectedRoute><OrderSuccessPage /></ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute><MyOrdersPage /></ProtectedRoute>
      } />
      <Route path="/orders/:id" element={
        <ProtectedRoute><OrderDetailsPage /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
      } />

      {/* ── Admin routes ──────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        {/* /admin  →  /admin/dashboard */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="orders"    element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="products"  element={<AdminProductsPage />} />
        <Route path="users"     element={<AdminUsersPage />} />
      </Route>

      {/* ── 404 — must be last ────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />

    </Routes>
  );
}