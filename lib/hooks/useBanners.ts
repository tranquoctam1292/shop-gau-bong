'use client';

import { useState, useEffect } from 'react';

export interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  order?: number;
}

/**
 * Hook để fetch hero banners từ WordPress
 * 
 * @returns Banners, loading, error
 */
export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBanners() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/woocommerce/banners');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch banners: ${response.status}`);
        }

        const data = await response.json();
        const bannersData = data.banners || [];
        
        // Sort by order if available
        const sortedBanners = bannersData.sort((a: Banner, b: Banner) => {
          const orderA = a.order ?? 999;
          const orderB = b.order ?? 999;
          return orderA - orderB;
        });
        
        setBanners(sortedBanners);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch banners'));
        setBanners([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, []);

  return {
    banners,
    loading,
    error,
  };
}

