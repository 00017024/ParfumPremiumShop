import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * AdminRoute — guards any route that requires admin role.
 *
 * Behaviour:
 * - While session is restoring (loading): render nothing (prevents flash redirect).
 * - Unauthenticated: redirect to /login, preserving the intended destination.
 * - Authenticated but not admin: redirect to /products (graceful, not 403 page).
 * - Admin: render children.
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