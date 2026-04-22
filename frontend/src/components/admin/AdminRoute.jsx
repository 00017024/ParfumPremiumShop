import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Purpose: Restricts access to admin users; redirects non-admins to /products and unauthenticated users to /login.
 * Output: Renders children for admin role; null while session is loading.
 */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/products" replace />;
  }

  return children;
}