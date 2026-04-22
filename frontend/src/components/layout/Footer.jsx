import { useTranslation } from 'react-i18next';

/**
 * Purpose: Renders the site footer with the brand name, tagline, and dynamic copyright year.
 */
export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-dark border-t border-neutral-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h3 className="text-2xl font-bold text-brand-gold mb-2">
          PARFUM PREMIUM
        </h3>
        <p className="text-text-secondary text-sm mb-6">
          {t('footer.tagline')}
        </p>
        <p className="text-text-muted text-xs">
          {t('footer.rights', { year: currentYear })}
        </p>
      </div>
    </footer>
  );
}