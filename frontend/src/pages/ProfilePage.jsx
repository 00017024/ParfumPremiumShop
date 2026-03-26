import { useState } from 'react';
import { User, Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { UZ_PHONE_REGEX, UZ_PHONE_MESSAGE } from '@/lib/validation';
import Layout from '@/components/layout/Layout';

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputClass = (hasError) =>
  `w-full bg-surface-card border rounded-sm px-4 py-3 text-sm text-text-primary placeholder-text-muted
   focus:outline-none focus:border-brand-gold transition-colors
   ${hasError ? 'border-red-500' : 'border-neutral-border'}`;

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

function ProfilePanel({ user, onUpdated }) {
  const [form, setForm]     = useState({ name: user.name ?? '', phone: user.phone ?? '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters.';
    if (!UZ_PHONE_REGEX.test(form.phone.trim())) e.phone = UZ_PHONE_MESSAGE;
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
      toast.success('Profile updated.', { style: { background: '#16a34a', color: '#fff' } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      toast.error(msg, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted pb-2 border-b border-neutral-border">
        Profile Details
      </h2>

      <FormField id="profile-name" label="Full Name" error={errors.name}>
        <input
          id="profile-name"
          type="text"
          value={form.name}
          onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((p) => ({ ...p, name: undefined })); }}
          className={inputClass(!!errors.name)}
        />
      </FormField>

      <FormField id="profile-email" label="Email">
        <input
          id="profile-email"
          type="email"
          value={user.email}
          disabled
          className={`${inputClass(false)} opacity-50 cursor-not-allowed`}
        />
      </FormField>

      <FormField id="profile-phone" label="Phone Number" error={errors.phone}>
        <input
          id="profile-phone"
          type="tel"
          placeholder="+998901234567"
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
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}

// ─── Change Password Panel ────────────────────────────────────────────────────

function PasswordPanel() {
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  const validate = () => {
    const e = {};
    if (!form.current) e.current = 'Current password is required.';
    if (form.next.length < 6) e.next = 'New password must be at least 6 characters.';
    if (form.next !== form.confirm) e.confirm = 'Passwords do not match.';
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
      toast.success('Password changed.', { style: { background: '#16a34a', color: '#fff' } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      toast.error(msg, { style: { background: '#dc2626', color: '#fff' } });
    } finally {
      setSaving(false);
    }
  };

  const field = (key, id, label, placeholder) => (
    <FormField id={id} label={label} error={errors[key]}>
      <input
        id={id}
        type="password"
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => { setForm((p) => ({ ...p, [key]: e.target.value })); setErrors((p) => ({ ...p, [key]: undefined })); setDone(false); }}
        className={inputClass(!!errors[key])}
      />
    </FormField>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <h2 className="text-xs uppercase tracking-[0.2em] text-text-muted pb-2 border-b border-neutral-border">
        Change Password
      </h2>

      {field('current', 'pwd-current', 'Current Password', '••••••••')}
      {field('next',    'pwd-next',    'New Password',     '••••••••')}
      {field('confirm', 'pwd-confirm', 'Confirm New Password', '••••••••')}

      {done && (
        <p className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle className="w-4 h-4" /> Password updated successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-widest font-medium border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {saving ? 'Updating…' : 'Update Password'}
      </button>
    </form>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, login } = useAuth();

  // Sync local display when profile is saved
  const handleUpdated = (updatedUser) => {
    // Persist the refreshed user object to localStorage so AuthContext picks it up
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Force a lightweight re-render by re-reading from storage on next mount
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <User className="w-5 h-5 text-brand-gold" aria-hidden="true" />
          <h1 className="text-2xl font-light text-text-primary tracking-wide">My Profile</h1>
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
