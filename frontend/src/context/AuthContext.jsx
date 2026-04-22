import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import i18n from '@/i18n';

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ─── AuthProvider ─────────────────────────────────────────────────────────────

/**
 * Purpose: Manages auth state (user, token, loading) and provides login/register/OTP/logout actions.
 * Output: AuthContext with { user, token, loading, login, register, verifyOtp, resendOtp, logout }.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser  = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        const isExpired = payload.exp && Date.now() / 1000 > payload.exp;

        if (isExpired) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // ── Persist helpers ───────────────────────────────────────────────────────

  /**
   * Purpose: Writes token and user to localStorage and syncs React state.
   */
  const persistSession = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  /**
   * Purpose: Removes token and user from localStorage and resets React state to null.
   */
  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // ── Login ─────────────────────────────────────────────────────────────────

  /**
   * Purpose: Calls the login API and persists the session on success; shows a toast on failure.
   * Output: { success: boolean }
   */
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persistSession(data.token, data.user);
      return { success: true };
    } catch {
      toast.error(i18n.t('errors.login_failed'), { style: { background: '#dc2626', color: '#fff' } });
      return { success: false };
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────

  /**
   * Purpose: Submits registration; on success returns the email so the caller can redirect to the OTP page.
   * Output: { success: boolean, email? }
   */
  const register = async (name, email, password, phone) => {
    try {
      await api.post('/auth/register', { name, email, password, phone });
      return { success: true, email };
    } catch {
      toast.error(i18n.t('errors.register_failed'), { style: { background: '#dc2626', color: '#fff' } });
      return { success: false };
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────

  /**
   * Purpose: Verifies the OTP and persists the session if the code is accepted.
   * Output: { success: boolean }
   */
  const verifyOtp = async (email, otp) => {
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      persistSession(data.token, data.user);
      return { success: true };
    } catch {
      toast.error(i18n.t('errors.verify_failed'), { style: { background: '#dc2626', color: '#fff' } });
      return { success: false };
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────

  /**
   * Purpose: Requests a new OTP for the given email; shows a success or error toast.
   * Output: { success: boolean }
   */
  const resendOtp = async (email) => {
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success(i18n.t('auth.resend_success'));
      return { success: true };
    } catch {
      toast.error(i18n.t('errors.resend_failed'), { style: { background: '#dc2626', color: '#fff' } });
      return { success: false };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  /**
   * Purpose: Calls the logout API to blacklist the token, then clears the local session regardless of network result.
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Silently ignore — network errors or an already-expired token
    } finally {
      clearSession();
    }
  };

  // ── Context value ─────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyOtp, resendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── useAuth hook ─────────────────────────────────────────────────────────────

/**
 * Purpose: Consumes AuthContext; throws if called outside AuthProvider.
 * Output: { user, token, loading, login, register, verifyOtp, resendOtp, logout }
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
