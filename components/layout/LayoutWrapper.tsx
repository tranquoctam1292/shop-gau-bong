'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QuickCheckoutModal } from '@/components/checkout/QuickCheckoutModal';

/**
 * Layout Wrapper
 * 
 * Conditionally renders Header/Footer based on route
 * Admin routes (/admin/*) don't get Header/Footer
 */
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    // Admin routes - no Header/Footer, just render children
    return <>{children}</>;
  }

  // Regular routes - with Header/Footer
  return (
    <>
      <Header />
      <main className="flex-1 relative z-0">
        {children}
      </main>
      <Footer />
      <QuickCheckoutModal />
    </>
  );
}

