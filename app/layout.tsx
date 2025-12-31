import type { Metadata } from 'next';
import { Inter, Nunito, Fredoka } from 'next/font/google';
import dynamic from 'next/dynamic';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { CategoriesProvider } from '@/lib/providers/CategoriesProvider';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import './globals.css';

// CRITICAL: Client-side only rendering để không chặn LCP/CLS
// Widget fixed position nên không cần SSR, render sau khi page interactive
const FloatingContactWidget = dynamic(
  () => import('@/components/layout/FloatingContactWidget').then((mod) => ({ default: mod.FloatingContactWidget })),
  {
    ssr: false, // Không render trên server để không chặn LCP
    loading: () => null, // Không hiển thị loading state
  }
);

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-nunito',
  display: 'swap',
});

// Handwriting font for logo - Soft, friendly, perfect for teddy bear shop
// Note: Fredoka only supports 'latin', 'latin-ext', 'hebrew' subsets
const fredoka = Fredoka({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-fredoka',
  display: 'swap',
  weight: ['400', '500', '600'],
});

import { getDefaultMetadata, generateOpenGraphTags, generateTwitterCardTags } from '@/lib/utils/metadata';
import { SITE_CONFIG } from '@/lib/constants/config';
import { getSiteScripts, HeaderScripts, FooterScripts } from '@/components/layout/ScriptsInjector';
import { getSiteSettings } from '@/lib/repositories/siteSettingsRepository';
import { unstable_cache } from 'next/cache';
import type { SiteSettings } from '@/types/siteSettings';
import { safeToISOString } from '@/lib/utils/dateUtils';
import { getCachedMenu } from '@/lib/utils/menuServer';
import { generateOrganizationSchema, generateWebSiteSchema } from '@/lib/utils/schema';

const defaultMetadata = getDefaultMetadata();
const ogTags = generateOpenGraphTags(defaultMetadata);
const twitterTags = generateTwitterCardTags(defaultMetadata);

export const metadata: Metadata = {
  title: {
    default: defaultMetadata.title,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: defaultMetadata.description,
  keywords: ['gấu bông', 'teddy bear', 'thú nhồi bông', 'quà tặng', 'đồ chơi', 'shop gấu bông'],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com'),
  openGraph: {
    title: ogTags['og:title'],
    description: ogTags['og:description'],
    url: ogTags['og:url'],
    siteName: ogTags['og:site_name'],
    images: [
      {
        url: ogTags['og:image'],
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
    locale: ogTags['og:locale'],
    type: 'website',
  },
  twitter: twitterTags,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification code if available
    // google: 'your-verification-code',
  },
};

/**
 * Map MongoDB document to frontend format
 */
function mapSiteSettings(mongoSettings: any): SiteSettings {
  return {
    id: mongoSettings._id,
    header: {
      logo: mongoSettings.header?.logo
        ? {
            id: mongoSettings.header.logo._id,
            url: mongoSettings.header.logo.url,
            name: mongoSettings.header.logo.name,
            alt: mongoSettings.header.logo.alt || mongoSettings.header.logo.name,
          }
        : null,
      siteTitle: mongoSettings.header?.siteTitle,
      announcementBar: {
        enabled: mongoSettings.header?.announcementBar?.enabled ?? false,
        text: mongoSettings.header?.announcementBar?.text,
        link: mongoSettings.header?.announcementBar?.link,
        linkText: mongoSettings.header?.announcementBar?.linkText,
      },
    },
    footer: {
      copyright: mongoSettings.footer?.copyright,
      description: mongoSettings.footer?.description,
      address: mongoSettings.footer?.address,
      email: mongoSettings.footer?.email,
      phone: mongoSettings.footer?.phone,
      socialLinks: mongoSettings.footer?.socialLinks ?? [],
    },
    scripts: {
      headerScripts: mongoSettings.scripts?.headerScripts,
      footerScripts: mongoSettings.scripts?.footerScripts,
    },
    createdAt: safeToISOString(mongoSettings.createdAt) ?? new Date().toISOString(),
    updatedAt: safeToISOString(mongoSettings.updatedAt) ?? new Date().toISOString(),
  };
}

/**
 * Cached function to get site settings for layout
 * 
 * ✅ FIX: Use unstable_cache with tags for better cache invalidation control
 * Tag 'site-settings' allows instant invalidation via revalidateTag()
 */
const getCachedSiteSettingsForLayout = unstable_cache(
  async () => {
    return await getSiteSettings();
  },
  ['site-settings-layout'], // Cache key
  {
    tags: ['site-settings'], // ✅ FIX: Same tag as API route for coordinated invalidation
    revalidate: 3600, // Cache for 1 hour
  }
);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ FIX: Fetch site settings on server-side to prevent hydration mismatch
  // Use cached function with tag for better cache control and instant invalidation
  const mongoSettings = await getCachedSiteSettingsForLayout();
  const siteSettings = mapSiteSettings(mongoSettings);
  const { headerScripts, footerScripts } = await getSiteScripts();
  
  // ✅ PERFORMANCE: Fetch menu data server-side to prevent render blocking
  const menu = await getCachedMenu('primary');

  // SEO: Generate Organization and WebSite structured data
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com';
  const organizationSchema = generateOrganizationSchema({
    name: SITE_CONFIG.name,
    url: siteUrl,
    logo: siteSettings.header?.logo?.url || `${siteUrl}/logo.png`,
    description: SITE_CONFIG.description,
    contactPoint: {
      telephone: siteSettings.footer?.phone,
      email: siteSettings.footer?.email,
      contactType: 'Customer Service',
    },
    sameAs: siteSettings.footer?.socialLinks
      ?.filter((link) => !!link.url)
      .map((link) => link.url) || [],
  });
  const webSiteSchema = generateWebSiteSchema(siteUrl);

  return (
    <html lang="vi" className={`${inter.variable} ${nunito.variable} ${fredoka.variable} overflow-x-hidden`}>
      <head>
        {/* SEO: Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* SEO: WebSite Schema with SearchAction */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className="min-h-screen bg-background flex flex-col overflow-x-hidden">
        {/* Header Scripts - Injected at beginning of body (Next.js App Router limitation) */}
        <HeaderScripts headerScripts={headerScripts} />
        <QueryProvider>
          <ToastProvider>
            <CategoriesProvider>
              <LayoutWrapper siteSettings={siteSettings} menu={menu}>
                {children}
              </LayoutWrapper>
              {/* Floating Contact Widget - Render sau cùng, client-side only */}
              <FloatingContactWidget />
            </CategoriesProvider>
          </ToastProvider>
        </QueryProvider>
        {/* Footer Scripts - Injected before closing body */}
        <FooterScripts footerScripts={footerScripts} />
      </body>
    </html>
  );
}

