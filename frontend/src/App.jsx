import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute    from '@/components/auth/ProtectedRoute';
import Products from './pages/Products';
import ProductPage       from '@/pages/ProductPage';
import CartPage          from '@/pages/CartPage';
import LoginPage         from '@/pages/LoginPage';
import RegisterPage      from '@/pages/RegisterPage';
import CheckoutPage      from '@/pages/CheckoutPage';
import OrderSuccessPage  from '@/pages/OrderSuccessPage';
import MyOrdersPage      from '@/pages/MyOrdersPage';
import OrderDetailsPage  from '@/pages/OrderDetailsPage';

export default function App() {
  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────────────── */}
      <Route path="/"               element={<Navigate to="/products" replace />} />
      <Route path="/products"        element={<Products />} />
      <Route path="/products/:id"   element={<ProductPage />} />
      <Route path="/cart"           element={<CartPage />} />
      <Route path="/login"          element={<LoginPage />} />
      <Route path="/register"       element={<RegisterPage />} />

      {/* ── Protected routes ──────────────────────────────────── */}
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
    </Routes>
  );
}