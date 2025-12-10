import type { Metadata } from 'next';
import { Inter, Nunito, Fredoka } from 'next/font/google';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { CategoriesProvider } from '@/lib/providers/CategoriesProvider';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

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

const defaultMetadata = getDefaultMetadata();
const ogTags = generateOpenGraphTags(defaultMetadata);
const twitterTags = generateTwitterCardTags(defaultMetadata);

export const metadata: Metadata = {
  title: {
    default: defaultMetadata.title,
    template: '%s | Shop Gấu Bông',
  },
  description: defaultMetadata.description,
  keywords: ['gấu bông', 'teddy bear', 'thú nhồi bông', 'quà tặng', 'đồ chơi', 'shop gấu bông'],
  authors: [{ name: 'Shop Gấu Bông' }],
  creator: 'Shop Gấu Bông',
  publisher: 'Shop Gấu Bông',
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
        alt: 'Shop Gấu Bông',
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
              <Header />
              <main className="flex-1 relative z-0">
                {children}
              </main>
              <Footer />
            </CategoriesProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

