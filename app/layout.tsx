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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${nunito.variable} ${fredoka.variable}`}>
      <body className="min-h-screen bg-background flex flex-col">
        <QueryProvider>
          <ToastProvider>
            <CategoriesProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              {/* Floating Contact Widget - Render sau cùng, client-side only */}
              <FloatingContactWidget />
            </CategoriesProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

