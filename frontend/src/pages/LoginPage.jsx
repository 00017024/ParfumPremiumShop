import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';

/**
 * Purpose: Login form page; redirects to the originally requested path (or /products) after successful authentication.
 */
export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const from = location.state?.from?.pathname || '/products';

  const [form, setForm]             = useState({ email: '', password: '' });
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim())    e.email    = t('validation.email_required');
    if (!form.password.trim()) e.password = t('validation.password_required');
    return e;
  };

  const handleChange = (field) => (ev) => {
    setForm((prev) => ({ ...prev, [field]: ev.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    const result = await login(form.email, form.password);
    setSubmitting(false);

    if (result.success) navigate(from, { replace: true });
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Header */}
          <div className="text-center flex flex-col gap-2">
            <LogIn className="w-8 h-8 text-brand-gold mx-auto" aria-hidden="true" />
            <h1 className="text-3xl font-light text-text-primary tracking-wide">
              {t('auth.sign_in')}
            </h1>
            <p className="text-sm text-text-muted">
              {t('auth.welcome_back')}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-surface-card border border-neutral-border rounded-sm p-8 flex flex-col gap-6"
          >
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="text-[11px] uppercase tracking-widest text-text-muted"
              >
                {t('auth.email')} <span className="text-brand-gold">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder={t('auth.email_placeholder')}
                value={form.email}
                onChange={handleChange('email')}
                aria-required="true"
                className={`w-full bg-surface-dark border rounded-sm px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors ${
                  errors.email ? 'border-red-500' : 'border-neutral-border'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500" role="alert">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="text-[11px] uppercase tracking-widest text-text-muted"
              >
                {t('auth.password')} <span className="text-brand-gold">*</span>
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange('password')}
                aria-required="true"
                className={`w-full bg-surface-dark border rounded-sm px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors ${
                  errors.password ? 'border-red-500' : 'border-neutral-border'
                }`}
              />
              {errors.password && (
                <p className="text-xs text-red-500" role="alert">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              aria-label={t('auth.sign_in')}
              className="w-full py-3.5 text-sm uppercase tracking-widest font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {submitting ? t('auth.signing_in') : t('auth.sign_in')}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-text-muted">
            {t('auth.no_account')}{' '}
            <Link
              to="/register"
              className="text-brand-gold hover:underline underline-offset-4"
            >
              {t('auth.create_one')}
            </Link>
          </p>

        </div>
      </div>
    </Layout>
  );
}
