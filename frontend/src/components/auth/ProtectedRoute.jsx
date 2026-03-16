import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// ─── ProtectedRoute ───────────────────────────────────────────────────────────
// Wraps any route that requires authentication.
// Preserves the intended destination in location state so LoginPage
// can redirect back after a successful login.

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