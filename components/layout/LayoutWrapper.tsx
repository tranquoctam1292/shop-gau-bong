'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QuickCheckoutModal } from '@/components/checkout/QuickCheckoutModal';
import { MobileHotlineButton } from '@/components/layout/MobileHotlineButton';
import { fetchSiteSettings } from '@/lib/utils/siteSettingsClient';
import type { SiteSettings } from '@/types/siteSettings';

/**
 * Layout Wrapper
 * 
 * Conditionally renders Header/Footer based on route
 * Admin routes (/admin/*) don't get Header/Footer
 * Fetches site settings and passes to Header/Footer
 */
export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  // Fetch site settings once
  useEffect(() => {
    if (!isAdminRoute) {
      fetchSiteSettings().then(setSiteSettings);
    }
  }, [isAdminRoute]);

  if (isAdminRoute) {
    // Admin routes - no Header/Footer, just render children
    return <>{children}</>;
  }

  // Regular routes - with Header/Footer
  return (
    <>
      <Header siteSettings={siteSettings} />
      <main className="flex-1 relative z-0 pb-16 md:pb-0">
        {children}
      </main>
      <Footer siteSettings={siteSettings} />
      <MobileHotlineButton />
      <QuickCheckoutModal />
    </>
  );
}

