import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [form, setForm]             = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      e.name = 'Full name must be at least 2 characters.';
    if (!form.email.trim())
      e.email = 'Email is required.';
    if (!form.phone.trim())
      e.phone = 'Phone number is required.';
    else if (form.phone.trim().length < 9)
      e.phone = 'Phone number is too short.';
    else if (form.phone.trim().length > 15)
      e.phone = 'Phone number is too long.';
    if (!form.password || form.password.length < 6)
      e.password = 'Password must be at least 6 characters.';
    return e;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

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

    if (result.success) navigate('/products', { replace: true });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Header */}
          <div className="text-center flex flex-col gap-2">
            <UserPlus className="w-8 h-8 text-brand-gold mx-auto" aria-hidden="true" />
            <h1 className="text-3xl font-light text-text-primary tracking-wide">
              Create Account
            </h1>
            <p className="text-sm text-text-muted">
              Join us to explore our exclusive fragrance collection.
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
                Full Name <span className="text-brand-gold">*</span>
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
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
                Email <span className="text-brand-gold">*</span>
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
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
                Phone Number <span className="text-brand-gold">*</span>
              </label>
              <input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+998901234567"
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
                Password <span className="text-brand-gold">*</span>
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="Min. 6 characters"
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
              aria-label="Create your account"
              className="w-full py-3.5 text-sm uppercase tracking-widest font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-brand-gold hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </Layout>
  );
}