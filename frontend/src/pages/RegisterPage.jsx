import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import { UZ_PHONE_REGEX } from '@/lib/validation';
import Layout from '@/components/layout/Layout';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm]             = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = t('validation.name_min');
    if (!form.email.trim())
      e.email = t('validation.email_required');
    if (!form.phone.trim())
      e.phone = t('validation.phone_required');
    else if (!UZ_PHONE_REGEX.test(form.phone.trim()))
      e.phone = t('validation.phone_invalid');
    if (!form.password || form.password.length < 6)
      e.password = t('validation.password_min');
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
    const result = await register(form.name, form.email, form.password, form.phone);
    setSubmitting(false);

    if (result.success) navigate(`/verify-otp?email=${encodeURIComponent(form.email)}`, { replace: true });
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Header */}
          <div className="text-center flex flex-col gap-2">
            <UserPlus className="w-8 h-8 text-brand-gold mx-auto" aria-hidden="true" />
            <h1 className="text-3xl font-light text-text-primary tracking-wide">
              {t('auth.create_account')}
            </h1>
            <p className="text-sm text-text-muted">
              {t('auth.register_description')}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-surface-card border border-neutral-border rounded-sm p-8 flex flex-col gap-6"
          >
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-name"
                className="text-[11px] uppercase tracking-widest text-text-muted"
              >
                {t('auth.full_name')} <span className="text-brand-gold">*</span>
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder={t('auth.full_name_placeholder')}
                value={form.name}
                onChange={handleChange('name')}
                aria-required="true"
                className={`w-full bg-surface-dark border rounded-sm px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors ${
                  errors.name ? 'border-red-500' : 'border-neutral-border'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500" role="alert">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-email"
                className="text-[11px] uppercase tracking-widest text-text-muted"
              >
                {t('auth.email')} <span className="text-brand-gold">*</span>
              </label>
              <input
                id="register-email"
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

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-phone"
                className="text-[11px] uppercase tracking-widest text-text-muted"
              >
                {t('auth.phone')} <span className="text-brand-gold">*</span>
              </label>
              <input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                placeholder={t('auth.phone_placeholder')}
                value={form.phone}
                onChange={handleChange('phone')}
                aria-required="true"
                className={`w-full bg-surface-dark border rounded-sm px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors ${
                  errors.phone ? 'border-red-500' : 'border-neutral-border'
                }`}
              />
              {errors.phone && (
                <p className="text-xs text-red-500" role="alert">{errors.phone}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="register-password"
                className="text-[11px] uppercase tracking-widest text-text-muted"
              >
                {t('auth.password')} <span className="text-brand-gold">*</span>
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder={t('auth.password_placeholder')}
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
              aria-label={t('auth.create_account')}
              className="w-full py-3.5 text-sm uppercase tracking-widest font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {submitting ? t('auth.creating_account') : t('auth.create_account')}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-text-muted">
            {t('auth.already_account')}{' '}
            <Link
              to="/login"
              className="text-brand-gold hover:underline underline-offset-4"
            >
              {t('auth.sign_in')}
            </Link>
          </p>

        </div>
      </div>
    </Layout>
  );
}
