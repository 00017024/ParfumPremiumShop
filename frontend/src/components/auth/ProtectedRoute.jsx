import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Purpose: Redirects unauthenticated users to /login, preserving the intended location for post-login redirect.
 * Output: Renders children when authenticated; null while session is loading.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for session restore before making a redirect decision.
  // Prevents a flash redirect to /login on page refresh.
  if (loading) return null;

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}