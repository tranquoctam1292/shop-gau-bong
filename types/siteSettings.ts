/**
 * Site Settings Types
 * 
 * Types for global site configuration (Header, Footer, Scripts)
 */

/**
 * MongoDB Site Settings Document
 * 
 * Single document with _id: 'global_config'
 */
export interface MongoSiteSettings {
  _id: string; // Always 'global_config'
  
  // Header Configuration
  header: {
    logo?: {
      _id: string;
      url: string;
      name: string;
      alt?: string;
    } | null;
    siteTitle?: string; // Custom site title (optional, falls back to SITE_CONFIG.name)
    announcementBar: {
      enabled: boolean;
      text?: string;
      link?: string;
      linkText?: string;
    };
  };
  
  // Footer Configuration
  footer: {
    copyright?: string;
    description?: string; // Brand description for footer
    address?: string;
    email?: string;
    phone?: string;
    socialLinks: Array<{
      platform: 'facebook' | 'instagram' | 'youtube' | 'zalo' | 'tiktok' | 'twitter';
      url: string;
      label?: string;
    }>;
  };
  
  // Scripts
  scripts: {
    headerScripts?: string; // Scripts to inject in <head>
    footerScripts?: string; // Scripts to inject before </body>
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string; // Admin user ID
}

/**
 * Frontend Site Settings (mapped from MongoDB)
 */
export interface SiteSettings {
  id: string;
  
  header: {
    logo?: {
      id: string;
      url: string;
      name: string;
      alt?: string;
    } | null;
    siteTitle?: string; // Custom site title (optional, falls back to SITE_CONFIG.name)
    announcementBar: {
      enabled: boolean;
      text?: string;
      link?: string;
      linkText?: string;
    };
  };
  
  footer: {
    copyright?: string;
    description?: string; // Brand description for footer
    address?: string;
    email?: string;
    phone?: string;
    socialLinks: Array<{
      platform: 'facebook' | 'instagram' | 'youtube' | 'zalo' | 'tiktok' | 'twitter';
      url: string;
      label?: string;
    }>;
  };
  
  scripts: {
    headerScripts?: string;
    footerScripts?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Site Settings Input (for API updates)
 */
export interface SiteSettingsInput {
  header?: {
    logo?: {
      _id: string;
      url: string;
      name: string;
      alt?: string;
    } | null;
    siteTitle?: string; // Custom site title (optional, falls back to SITE_CONFIG.name)
    announcementBar?: {
      enabled?: boolean;
      text?: string;
      link?: string;
      linkText?: string;
    };
  };
  
  footer?: {
    copyright?: string;
    description?: string; // Brand description for footer
    address?: string;
    email?: string;
    phone?: string;
    socialLinks?: Array<{
      platform: 'facebook' | 'instagram' | 'youtube' | 'zalo' | 'tiktok' | 'twitter';
      url: string;
      label?: string;
    }>;
  };
  
  scripts?: {
    headerScripts?: string;
    footerScripts?: string;
  };
}

