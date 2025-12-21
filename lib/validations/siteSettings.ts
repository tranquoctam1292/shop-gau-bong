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
 */
const logoSchema = z.object({
  _id: z.string().min(1, 'Media ID không được để trống'),
  url: z.string().url('URL không hợp lệ'),
  name: z.string().min(1, 'Tên file không được để trống'),
  type: z.string().optional(), // Media type from MediaPicker (image, video, etc.)
  thumbnail_url: z.string().url().optional(), // Thumbnail URL from MediaPicker
  alt: z.string().optional(), // Alt text for SEO (optional but recommended)
}).nullable().optional();

/**
 * Announcement bar validation schema
 */
const announcementBarSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().optional(),
  link: z.string().url('Link không hợp lệ').optional().or(z.literal('')),
  linkText: z.string().optional(),
}).optional();

/**
 * Social link validation schema
 * 
 * ✅ UX FIX: Allow empty URL to prevent validation errors when Admin just adds new link
 */
const socialLinkSchema = z.object({
  platform: z.enum(['facebook', 'instagram', 'youtube', 'zalo', 'tiktok', 'twitter'], {
    errorMap: () => ({ message: 'Platform không hợp lệ' }),
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
  description: z.string().optional(), // Brand description for footer
  address: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
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

