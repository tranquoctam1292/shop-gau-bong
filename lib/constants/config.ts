/**
 * Site Configuration Constants
 * 
 * Centralized configuration for site name, description, and other constants
 * to avoid hardcoding values throughout the codebase
 */

/**
 * Site Information
 */
export const SITE_CONFIG = {
  name: 'Shop Gấu Bông',
  shortName: 'Shop Gấu Bông',
  description: 'Khám phá bộ sưu tập gấu bông đáng yêu của chúng tôi',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com',
  email: process.env.NEXT_PUBLIC_SITE_EMAIL || 'info@shop-gaubong.com',
  phone: process.env.NEXT_PUBLIC_SITE_PHONE || '',
  address: process.env.NEXT_PUBLIC_SITE_ADDRESS || '',
} as const;

/**
 * Default Metadata
 */
export const DEFAULT_METADATA = {
  title: `${SITE_CONFIG.name} - Gấu Bông Đáng Yêu`,
  description: SITE_CONFIG.description,
  siteName: SITE_CONFIG.name,
  locale: 'vi_VN',
  type: 'website' as const,
} as const;

/**
 * Get site name (can be extended to fetch from database in the future)
 */
export function getSiteName(): string {
  return SITE_CONFIG.name;
}

/**
 * Get site description (can be extended to fetch from database in the future)
 */
export function getSiteDescription(): string {
  return SITE_CONFIG.description;
}
