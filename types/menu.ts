/**
 * Menu Type Definitions
 * Based on menu_gau_bong.md specification
 */

export type MenuItemType = 'link' | 'dropdown' | 'mega';

export type BadgeType = 'new' | 'hot' | 'sale';

export interface MenuBadge {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface TopBarConfig {
  left: string;
  right: Array<{
    type: 'hotline' | 'link';
    label: string;
    href: string;
    phone?: string;
  }>;
}

export interface MegaMenuColumn {
  title: string;
  type: 'category' | 'size' | 'banner';
  items: Array<{
    id: string;
    label: string;
    href: string;
    image?: string;
    count?: number;
    badge?: BadgeType;
  }>;
}

export interface MegaMenuConfig {
  layout: 'three-column';
  columns: MegaMenuColumn[];
}

export interface MenuItemChild {
  id: string;
  label: string;
  href: string;
  badge?: BadgeType;
  icon?: string;
}

export interface MenuItemSubItem {
  label: string;
  href: string;
}

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  type: MenuItemType;
  icon?: string | null;
  badge?: BadgeType | null;
  highlight?: boolean;
  color?: string;
  // For mega menu
  megaMenu?: MegaMenuConfig;
  // For dropdown
  children?: MenuItemChild[];
  // For link with sub-items
  subItems?: MenuItemSubItem[];
}

export interface MenuStructure {
  topBar: TopBarConfig;
  mainNavigation: MenuItem[];
}

export interface BadgeConfig {
  [key: string]: MenuBadge;
}

export interface MobileConfig {
  hotlineButton: {
    enabled: boolean;
    position: 'sticky-bottom';
    phone: string;
    href: string;
    label: string;
  };
  searchBehavior: {
    default: 'icon';
    onClick: 'modal';
  };
}

export interface MenuDataConfig {
  menuStructure: MenuStructure;
  badgeConfig: BadgeConfig;
  mobileConfig: MobileConfig;
}

/**
 * Helper function to get badge config
 */
export function getBadgeConfig(badge: BadgeType, config: BadgeConfig): MenuBadge | null {
  return config[badge] || null;
}

/**
 * Helper function to check if menu item has children
 */
export function hasChildren(item: MenuItem): boolean {
  return Boolean(
    (item.type === 'dropdown' && item.children && item.children.length > 0) ||
    (item.type === 'mega' && item.megaMenu !== undefined && item.megaMenu !== null) ||
    (item.type === 'link' && item.subItems && item.subItems.length > 0)
  );
}

/**
 * Helper function to get menu item display color
 */
export function getMenuItemColor(item: MenuItem): string {
  if (item.color) return item.color;
  if (item.highlight) return '#FF9EAA'; // primary
  if (item.badge === 'sale') return '#FF0000'; // red for sale
  return '#5D4037'; // text-main (Warm Brown)
}
