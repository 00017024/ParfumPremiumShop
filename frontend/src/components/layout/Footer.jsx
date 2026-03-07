export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-dark border-t border-neutral-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h3 className="text-2xl font-bold text-brand-gold mb-2">
          PARFUM PREMIUM
        </h3>
        <p className="text-text-secondary text-sm mb-6">
          Luxury Fragrances Since 2024
        </p>
        <p className="text-text-muted text-xs">
          © {currentYear} All Rights Reserved
        </p>
      </div>
    </footer>
  );
}