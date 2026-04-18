import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ─── AuthProvider ─────────────────────────────────────────────────────────────

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
        // Decode the JWT payload (base64) and check expiry without a library
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
        // Corrupt data — clear and start fresh
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  // ── Persist helpers ───────────────────────────────────────────────────────

  const persistSession = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // ── Login ─────────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      persistSession(data.token, data.user);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Invalid email or password';
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
      return { success: false };
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────

  const register = async (name, email, password, phone) => {
    try {
      await api.post('/auth/register', { name, email, password, phone });
      return { success: true, email };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
      return { success: false };
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────

  const verifyOtp = async (email, otp) => {
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      persistSession(data.token, data.user);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Verification failed. Please try again.';
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
      return { success: false };
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────

  const resendOtp = async (email) => {
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new code has been sent to your email.');
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Could not resend OTP. Please try again.';
      toast.error(message, { style: { background: '#dc2626', color: '#fff' } });
      return { success: false };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────

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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}