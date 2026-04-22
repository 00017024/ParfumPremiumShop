import Header from './Header';
import Footer from './Footer';

/**
 * Purpose: Wraps public pages with the shared Header and Footer.
 */
export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}