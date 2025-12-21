/**
 * Site Settings Repository
 * 
 * Repository pattern for Site Settings operations
 * 
 * Uses single document with _id: 'global_config'
 */

import { getCollections } from '@/lib/db';
import type { MongoSiteSettings, SiteSettingsInput } from '@/types/siteSettings';

const GLOBAL_CONFIG_ID = 'global_config';

/**
 * Default Site Settings
 * 
 * Used as fallback when no settings exist in database
 */
const DEFAULT_SETTINGS: MongoSiteSettings = {
  _id: GLOBAL_CONFIG_ID,
  header: {
    logo: null,
    announcementBar: {
      enabled: false,
    },
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Shop Gấu Bông. All rights reserved.`,
    description: 'Shop Gấu Bông - Nơi bạn tìm thấy những chú gấu bông đáng yêu nhất.',
    socialLinks: [],
  },
  scripts: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Get site settings
 * 
 * @returns Site settings document or DEFAULT_SETTINGS if not found
 */
export async function getSiteSettings(): Promise<MongoSiteSettings> {
  const { siteSettings } = await getCollections();
  
  // MongoDB allows string _id for custom IDs
  const settings = await siteSettings.findOne({ _id: GLOBAL_CONFIG_ID as any });
  
  if (!settings) {
    // Return default settings instead of null
    return DEFAULT_SETTINGS;
  }
  
  return settings as unknown as MongoSiteSettings;
}

/**
 * Update site settings
 * 
 * Uses upsert to create if not exists
 * 
 * @param data - Partial site settings data to update
 * @param updatedBy - Admin user ID who made the update
 * @returns Updated site settings document
 */
export async function updateSiteSettings(
  data: SiteSettingsInput,
  updatedBy?: string
): Promise<MongoSiteSettings> {
  const { siteSettings } = await getCollections();
  
  const now = new Date();
  
  // Get existing settings or create default
  const existing = await getSiteSettings();
  
  // Build update data with proper types
  const updateData: Partial<MongoSiteSettings> = {
    updatedAt: now,
    updatedBy,
  };
  
  // If creating new, set createdAt
  if (!existing) {
    (updateData as any)._id = GLOBAL_CONFIG_ID;
    updateData.createdAt = now;
    
    // Set default structure if not provided
    if (data.header) {
      updateData.header = {
        logo: data.header.logo ?? null,
        siteTitle: data.header.siteTitle, // ✅ FIX: Save siteTitle to MongoDB
        announcementBar: {
          enabled: data.header.announcementBar?.enabled ?? false,
          text: data.header.announcementBar?.text,
          link: data.header.announcementBar?.link,
          linkText: data.header.announcementBar?.linkText,
        },
      };
    } else {
      updateData.header = {
        logo: null,
        announcementBar: {
          enabled: false,
        },
      };
    }
    
    if (data.footer) {
      updateData.footer = {
        copyright: data.footer.copyright,
        description: data.footer.description, // ✅ FIX: Save description to MongoDB
        address: data.footer.address,
        email: data.footer.email,
        phone: data.footer.phone,
        socialLinks: data.footer.socialLinks ?? [],
      };
    } else {
      updateData.footer = {
        socialLinks: [],
      };
    }
    
    updateData.scripts = data.scripts || {};
  } else {
    // Merge with existing data
    if (data.header) {
      updateData.header = {
        logo: data.header.logo !== undefined ? data.header.logo : existing.header.logo,
        siteTitle: data.header.siteTitle !== undefined ? data.header.siteTitle : existing.header.siteTitle, // ✅ FIX: Save siteTitle to MongoDB
        announcementBar: {
          enabled: data.header.announcementBar?.enabled ?? existing.header.announcementBar.enabled,
          text: data.header.announcementBar?.text ?? existing.header.announcementBar.text,
          link: data.header.announcementBar?.link ?? existing.header.announcementBar.link,
          linkText: data.header.announcementBar?.linkText ?? existing.header.announcementBar.linkText,
        },
      };
    } else {
      updateData.header = existing.header;
    }
    if (data.footer) {
      updateData.footer = {
        copyright: data.footer.copyright ?? existing.footer.copyright,
        description: data.footer.description ?? existing.footer.description, // ✅ FIX: Save description to MongoDB
        address: data.footer.address ?? existing.footer.address,
        email: data.footer.email ?? existing.footer.email,
        phone: data.footer.phone ?? existing.footer.phone,
        socialLinks: data.footer.socialLinks ?? existing.footer.socialLinks,
      };
    } else {
      updateData.footer = existing.footer;
    }
    if (data.scripts) {
      updateData.scripts = {
        ...existing.scripts,
        ...data.scripts,
      };
    } else {
      updateData.scripts = existing.scripts;
    }
  }
  
  // MongoDB allows string _id for custom IDs
  const result = await siteSettings.updateOne(
    { _id: GLOBAL_CONFIG_ID as any },
    { $set: updateData },
    { upsert: true }
  );
  
  if (!result.acknowledged) {
    throw new Error('Failed to update site settings');
  }
  
  // Return updated document
  // getSiteSettings() now always returns a value (DEFAULT_SETTINGS if not exists)
  const updated = await getSiteSettings();
  
  return updated;
}

