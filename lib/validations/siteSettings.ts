/**
 * Site Settings Validation Schemas
 * 
 * Zod schemas for validating site settings input
 */

import { z } from 'zod';

/**
 * Logo validation schema
 * 
 * ✅ SEO: Ensure logo metadata is complete
 * ✅ FIX: Allow `type` and `thumbnail_url` fields from MediaPicker
 * ✅ FIX: Accept both `id` and `_id` for compatibility (MediaPicker uses `_id`, API uses `id`)
 * ✅ FIX: Use preprocess to normalize to `_id` for API compatibility
 */
const logoSchema = z.preprocess(
  (val) => {
    // Handle both `id` and `_id` for backward compatibility
    // MediaPicker returns `_id`, API returns `id` - normalize to `_id` for API
    if (val && typeof val === 'object' && val !== null) {
      const normalized: any = { ...val };
      if ('id' in val && !('_id' in val)) {
        normalized._id = val.id;
      }
      // Handle thumbnail_url: if undefined or empty, set to empty string
      if (!normalized.thumbnail_url || normalized.thumbnail_url === '') {
        normalized.thumbnail_url = '';
      }
      // Ensure name is not empty (fallback to 'Untitled' if empty)
      if (!normalized.name || normalized.name.trim() === '') {
        normalized.name = normalized.name || 'Untitled';
      }
      return normalized;
    }
    return val;
  },
  z.object({
    _id: z.string().min(1, 'Media ID không được để trống'),
    url: z.string().url('URL không hợp lệ'),
    name: z.string().min(1, 'Tên file không được để trống'),
    type: z.string().optional(), // Media type from MediaPicker (image, video, etc.)
    thumbnail_url: z.union([
      z.string().url('Thumbnail URL không hợp lệ'),
      z.literal(''),
      z.undefined(),
    ]).optional(), // Thumbnail URL from MediaPicker (allow empty, undefined, or valid URL)
    alt: z.string().optional(), // Alt text for SEO (optional but recommended)
  }).nullable().optional()
);

/**
 * Announcement bar validation schema
 * 
 * ✅ FIX: Allow empty string, null, and undefined for all fields (better UX)
 */
const announcementBarSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.preprocess(
    (val) => val === null || val === undefined ? undefined : val,
    z.string().optional()
  ).optional(),
  link: z.preprocess(
    (val) => {
      // Normalize null/undefined/empty to undefined (skip validation if empty)
      if (val === null || val === undefined || val === '') {
        return undefined;
      }
      return val;
    },
    z.string().url('Link không hợp lệ').optional()
  ).optional(),
  linkText: z.preprocess(
    (val) => val === null || val === undefined ? undefined : val,
    z.string().optional()
  ).optional(),
}).optional();

/**
 * Social link validation schema
 * 
 * ✅ UX FIX: Allow empty URL to prevent validation errors when Admin just adds new link
 */
const socialLinkSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'youtube', 'zalo', 'tiktok', 'twitter'], {
    errorMap: () => ({ message: 'Vui lòng chọn platform' }),
  }),
  url: z.string().url('URL không hợp lệ').or(z.literal('')), // Allow empty string
  label: z.string().optional(),
});

/**
 * Header configuration schema
 */
const headerConfigSchema = z.object({
  logo: logoSchema,
  siteTitle: z.string().optional(), // Custom site title (optional, falls back to SITE_CONFIG.name)
  announcementBar: announcementBarSchema,
}).optional();

/**
 * Footer configuration schema
 */
const footerConfigSchema = z.object({
  copyright: z.string().optional(),
  description: z.preprocess(
    (val) => val === null || val === undefined ? undefined : val,
    z.string().optional()
  ).optional(), // ✅ FIX: Allow null/undefined for description (convert to undefined)
  address: z.string().optional(),
  email: z.preprocess(
    (val) => val === '' || val === null || val === undefined ? '' : val,
    z.string().email('Email không hợp lệ').or(z.literal(''))
  ).optional(),
  phone: z.string().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
}).optional();

/**
 * Scripts configuration schema
 */
const scriptsConfigSchema = z.object({
  headerScripts: z.string().optional(),
  footerScripts: z.string().optional(),
}).optional();

/**
 * Site settings update schema
 * 
 * Used for POST/PUT requests to update site settings
 * 
 * ✅ FIX: Removed .refine() check - form always has at least one section from API
 * All sections are optional, but at least one will always be present when form is loaded
 */
export const siteSettingsUpdateSchema = z.object({
  header: headerConfigSchema,
  footer: footerConfigSchema,
  scripts: scriptsConfigSchema,
});

/**
 * Type inference for site settings update
 */
export type SiteSettingsUpdateInput = z.infer<typeof siteSettingsUpdateSchema>;

