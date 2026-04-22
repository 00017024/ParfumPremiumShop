import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';

const RESEND_COOLDOWN_S = 60;

/**
 * Purpose: OTP verification page; reads email from query params, enforces a 60-second resend cooldown.
 */
export default function VerifyOtpPage() {
  const { t } = useTranslation();
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') || '';

  const [otp, setOtp]               = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [cooldown, setCooldown]     = useState(RESEND_COOLDOWN_S);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(otp)) {
      setError(t('auth.otp_error'));
      return;
    }

    setSubmitting(true);
    const result = await verifyOtp(email, otp);
    setSubmitting(false);

    if (result.success) navigate('/products', { replace: true });
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    const result = await resendOtp(email);
    if (result.success) {
      setCooldown(RESEND_COOLDOWN_S);
      timerRef.current = setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) { clearInterval(timerRef.current); return 0; }
          return s - 1;
        });
      }, 1000);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md flex flex-col gap-8">

          {/* Header */}
          <div className="text-center flex flex-col gap-2">
            <ShieldCheck className="w-8 h-8 text-brand-gold mx-auto" aria-hidden="true" />
            <h1 className="text-3xl font-light text-text-primary tracking-wide">
              {t('auth.verify_email')}
            </h1>
            <p className="text-sm text-text-muted">
              {t('auth.otp_sent')}{' '}
              <span className="text-text-primary">{email}</span>.
              <br />{t('auth.otp_enter')}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-surface-card border border-neutral-border rounded-sm p-8 flex flex-col gap-6"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="otp-input"
                className="text-[11px] uppercase tracking-widest text-text-muted"
              >
                {t('auth.verification_code')} <span className="text-brand-gold">*</span>
              </label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setError('');
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                aria-required="true"
                className={`w-full bg-surface-dark border rounded-sm px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold tracking-[0.4em] transition-colors ${
                  error ? 'border-red-500' : 'border-neutral-border'
                }`}
              />
              {error && (
                <p className="text-xs text-red-500" role="alert">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              aria-label={t('auth.verify')}
              className="w-full py-3.5 text-sm uppercase tracking-widest font-medium bg-brand-gold text-brand-black hover:bg-opacity-90 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {submitting ? t('auth.verifying') : t('auth.verify')}
            </button>
          </form>

          {/* Resend */}
          <p className="text-center text-sm text-text-muted">
            {t('auth.no_code')}{' '}
            {cooldown > 0 ? (
              <span className="text-text-muted">
                {t('auth.resend_in', { count: cooldown })}
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-brand-gold hover:underline underline-offset-4 bg-transparent border-none p-0 cursor-pointer"
              >
                {t('auth.resend_otp')}
              </button>
            )}
          </p>

        </div>
      </div>
    </Layout>
  );
}
