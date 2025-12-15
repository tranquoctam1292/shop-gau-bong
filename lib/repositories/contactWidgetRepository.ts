/**
 * Contact Widget Repository
 * 
 * Repository pattern for Contact Widget Settings operations
 * 
 * Provides CRUD operations for contact widget configuration
 */

import { getCollections } from '@/lib/db';
import type { ContactWidgetConfig } from '@/types/mongodb';

/**
 * Get contact widget settings
 * 
 * @returns Contact widget config or null if not found
 */
export async function getContactWidgetSettings(): Promise<ContactWidgetConfig | null> {
  const { contactWidgetSettings } = await getCollections();
  
  // There should only be one settings document
  const settings = await contactWidgetSettings.findOne({});
  
  return settings as ContactWidgetConfig | null;
}

/**
 * Get public contact widget settings (only enabled items)
 * 
 * @returns Public config with only enabled items, or null if widget is disabled
 */
export async function getPublicContactWidgetSettings(): Promise<Omit<ContactWidgetConfig, 'createdAt' | 'updatedAt'> | null> {
  const settings = await getContactWidgetSettings();
  
  if (!settings || !settings.enabled) {
    return null;
  }
  
  // Filter only active items
  const activeItems = settings.items.filter(item => item.active);
  
  if (activeItems.length === 0) {
    return null;
  }
  
  // Return public config without timestamps
  return {
    _id: settings._id,
    enabled: settings.enabled,
    position: settings.position,
    primaryColor: settings.primaryColor,
    items: activeItems,
  };
}

/**
 * Update contact widget settings
 * 
 * @param config - Settings to update
 * @returns Updated settings document
 */
export async function updateContactWidgetSettings(
  config: Omit<ContactWidgetConfig, '_id' | 'createdAt' | 'updatedAt'>
): Promise<ContactWidgetConfig> {
  const { contactWidgetSettings } = await getCollections();
  
  const now = new Date();
  
  // Check if settings already exist
  const existing = await contactWidgetSettings.findOne({});
  
  if (existing) {
    // Update existing settings
    const result = await contactWidgetSettings.findOneAndUpdate(
      {},
      {
        $set: {
          ...config,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      throw new Error('Failed to update contact widget settings');
    }
    
    return result as ContactWidgetConfig;
  } else {
    // Create new settings
    const newSettings: Omit<ContactWidgetConfig, '_id'> = {
      ...config,
      createdAt: now,
      updatedAt: now,
    };
    
    const result = await contactWidgetSettings.insertOne(newSettings);
    
    if (!result.insertedId) {
      throw new Error('Failed to create contact widget settings');
    }
    
    const created = await contactWidgetSettings.findOne({ _id: result.insertedId });
    if (!created) {
      throw new Error('Failed to retrieve created contact widget settings');
    }
    
    return created as ContactWidgetConfig;
  }
}

