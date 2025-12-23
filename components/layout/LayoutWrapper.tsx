'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { QuickCheckoutModal } from '@/components/checkout/QuickCheckoutModal';
import { MobileHotlineButton } from '@/components/layout/MobileHotlineButton';
import { fetchSiteSettings } from '@/lib/utils/siteSettingsClient';
import type { SiteSettings } from '@/types/siteSettings';
import type { Menu } from '@/lib/utils/menuServer';

/**
 * Layout Wrapper
 * 
 * Conditionally renders Header/Footer based on route
 * Admin routes (/admin/*) don't get Header/Footer
 * 
 * ✅ FIX: Receives siteSettings from Server Component (app/layout.tsx) to prevent hydration mismatch
 * Optionally refetches on client-side when pathname changes to get fresh data after admin updates
 */
export function LayoutWrapper({ 
  children,
  siteSettings: initialSiteSettings,
  menu,
}: { 
  children: React.ReactNode;
  siteSettings?: SiteSettings | null;
  menu?: Menu | null;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  
  // ✅ FIX: Use server-provided siteSettings as initial value to prevent hydration mismatch
  // Only refetch on client-side when pathname changes (for fresh data after admin updates)
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(initialSiteSettings || null);

  // ✅ FIX: Optional refetch on pathname change to get fresh data after admin updates
  // This runs after initial render, so it won't cause hydration mismatch
  useEffect(() => {
    if (!isAdminRoute && pathname) {
      // Refetch to get fresh data after admin updates (runs after hydration)
      fetchSiteSettings().then(setSiteSettings).catch((error) => {
        // Log error but don't break UI - fallback to initial server-provided data
        if (process.env.NODE_ENV === 'development') {
          console.error('[LayoutWrapper] Failed to refetch site settings:', error);
        }
      });
    }
  }, [isAdminRoute, pathname]); // Only refetch when pathname changes

  if (isAdminRoute) {
    // Admin routes - no Header/Footer, just render children
    return <>{children}</>;
  }

  // Regular routes - with Header/Footer
  // ✅ FIX: siteSettings and menu are now available from server-side, preventing hydration mismatch
  return (
    <>
      <Header siteSettings={siteSettings} menu={menu} />
      <main className="flex-1 relative z-0 pb-16 md:pb-0">
        {children}
      </main>
      <Footer siteSettings={siteSettings} />
      <MobileHotlineButton />
      <QuickCheckoutModal />
    </>
  );
}

