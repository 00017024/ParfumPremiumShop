import { useState } from 'react';
import { User, Lock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UZ_PHONE_REGEX } from '@/lib/validation';
import Layout from '@/components/layout/Layout';

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputClass = (hasError) =>
  `w-full bg-surface-card border rounded-sm px-4 py-3 text-sm text-text-primary placeholder-text-muted
   focus:outline-none focus:border-brand-gold transition-colors
   ${hasError ? 'border-red-500' : 'border-neutral-border'}`;

/**
 * Purpose: Accessible form field wrapper with label and inline error message for profile/password forms.
 */
function FormField({ id, label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] uppercase tracking-widest text-text-muted">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Profile Details Panel ────────────────────────────────────────────────────

/**
 * Purpose: Inline edit panel for updating name and phone; calls the profile API and propagates updated user to parent.
 */
function ProfilePanel({ user, onUpdated }) {
  const { t } = useTranslation();
  const [form, setForm]     = useState({ name: user.name ?? '', phone: user.phone ?? '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = t('validation.name_profile');
    if (!UZ_PHONE_REGEX.test(form.phone.trim())) e.phone = t('validation.phone_invalid');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', {
        name: form.name.trim(),
        phone: form.phone.trim(),
      });
      onUpdated(data.user);
      toast.success(t('profile.update_success'), { style: { background: '#16a34a', color: '#fff' } });
    } catch {
      toast.error(t('profile.update_error'), { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted pb-2 border-b border-neutral-border">
        {t('profile.details')}
      </h2>

      <FormField id="profile-name" label={t('auth.full_name')} error={errors.name}>
        <input
          id="profile-name"
          type="text"
          value={form.name}
          onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: undefined })); }}
          className={inputClass(!!errors.name)}
        />
      </FormField>

      <FormField id="profile-email" label={t('auth.email')}>
        <input
          id="profile-email"
          type="email"
          value={user.email}
          disabled
          className={`${inputClass(false)} opacity-50 cursor-not-allowed`}
        />
      </FormField>

      <FormField id="profile-phone" label={t('auth.phone')} error={errors.phone}>
        <input
          id="profile-phone"
          type="tel"
          placeholder={t('auth.phone_placeholder')}
          value={form.phone}
          onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setErrors((p) => ({ ...p, phone: undefined })); }}
          className={inputClass(!!errors.phone)}
        />
      </FormField>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-widest font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {saving ? t('profile.saving') : t('profile.save_changes')}
      </button>
    </form>
  );
}

// ─── Change Password Panel ────────────────────────────────────────────────────

/**
 * Purpose: Password change panel; validates current and new passwords client-side before calling the API.
 */
function PasswordPanel() {
  const { t } = useTranslation();
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  const validate = () => {
    const e = {};
    if (!form.current) e.current = t('validation.current_password_required');
    if (form.next.length < 6) e.next = t('validation.new_password_min');
    if (form.next !== form.confirm) e.confirm = t('validation.passwords_mismatch');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await api.put('/users/password', {
        currentPassword: form.current,
        newPassword: form.next,
      });
      setDone(true);
      setForm({ current: '', next: '', confirm: '' });
      toast.success(t('profile.password_success'), { style: { background: '#16a34a', color: '#fff' } });
    } catch {
      toast.error(t('profile.password_error'), { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setSaving(false);
    }
  };

  const field = (key, id, label) => (
    <FormField id={id} label={label} error={errors[key]}>
      <input
        id={id}
        type="password"
        placeholder="••••••••"
        value={form[key]}
        onChange={(e) => { setForm((p) => ({ ...p, [key]: e.target.value })); setErrors((p) => ({ ...p, [key]: undefined })); setDone(false); }}
        className={inputClass(!!errors[key])}
      />
    </FormField>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted pb-2 border-b border-neutral-border">
        {t('profile.change_password')}
      </h2>

      {field('current', 'pwd-current', t('profile.current_password'))}
      {field('next',    'pwd-next',    t('profile.new_password'))}
      {field('confirm', 'pwd-confirm', t('profile.confirm_password'))}

      {done && (
        <p className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle className="w-4 h-4" /> {t('profile.password_updated')}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-widest font-medium border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {saving ? t('profile.updating') : t('profile.update_password')}
      </button>
    </form>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

/**
 * Purpose: User profile page composed of a profile-details panel and a password-change panel.
 */
export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleUpdated = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <User className="w-5 h-5 text-brand-gold" aria-hidden="true" />
          <h1 className="text-2xl font-light text-text-primary tracking-wide">{t('profile.title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section className="bg-surface-card border border-neutral-border rounded-sm p-6">
            <ProfilePanel user={user} onUpdated={handleUpdated} />
          </section>

          <section className="bg-surface-card border border-neutral-border rounded-sm p-6">
            <PasswordPanel />
          </section>
        </div>

      </div>
    </Layout>
  );
}
