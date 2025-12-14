'use client';

import Link from 'next/link';
import { useMenu, type MenuItem } from '@/lib/hooks/useMenu';
import { MenuDropdown, type MenuDropdownItem } from './MenuDropdown';
import { ProductsMegaMenu } from './ProductsMegaMenu';
import { ShopMegaMenu } from './ShopMegaMenu';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { mainNavigation } from '@/lib/constants/menuData';
import type { MenuItem as ConfigMenuItem } from '@/types/menu';
import { getMenuItemColor } from '@/types/menu';

interface DynamicNavigationMenuProps {
  location?: string;
  fallbackToHardcoded?: boolean;
}

/**
 * Dynamic Navigation Menu Component
 * 
 * Renders navigation menu from CMS API
 * Falls back to hardcoded menu if no menu found or if fallbackToHardcoded is true
 * Desktop: Horizontal menu với hover dropdowns và mega menu
 * Mobile: Hidden (use DynamicMobileMenu instead)
 */
export function DynamicNavigationMenu({
  location = 'primary',
  fallbackToHardcoded = true,
}: DynamicNavigationMenuProps) {
  const { menu, isLoading, error } = useMenu(location);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <nav className="hidden lg:flex items-center space-x-1 relative z-50 overflow-visible">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-20" />
      </nav>
    );
  }

  // If error or no menu, fallback to hardcoded menu
  if (error || !menu || !menu.items || menu.items.length === 0) {
    if (fallbackToHardcoded) {
      return <HardcodedNavigationMenu />;
    }
    return null;
  }

  // Render menu from API
  return (
    <nav className="hidden lg:flex items-center space-x-1 relative z-50 overflow-visible">
      {menu.items.map((item) => (
        <MenuItemRenderer key={item.id} item={item} />
      ))}
    </nav>
  );
}

/**
 * Render individual menu item (recursive for nested items)
 */
function MenuItemRenderer({ item }: { item: MenuItem }) {
  const hasChildren = item.children && item.children.length > 0;

  // If item has children, render as dropdown
  if (hasChildren) {
    const dropdownItems: MenuDropdownItem[] = item.children!.map((child) => ({
      id: child.id,
      label: child.title,
      href: child.url,
    }));

    // Check if this is a shop/mega menu (by checking if it contains product categories)
    // For now, we'll use a simple heuristic: if label contains "Cửa Hàng" or "Shop"
    const isShopMenu = item.title.toLowerCase().includes('cửa hàng') ||
      item.title.toLowerCase().includes('shop') ||
      item.cssClass?.includes('shop') ||
      item.cssClass?.includes('mega-menu');

    if (isShopMenu) {
      return (
        <ShopMegaMenu
          key={item.id}
          label={item.title}
          href={item.url}
          className={item.cssClass || undefined}
        />
      );
    }

    // Regular dropdown
    return (
      <MenuDropdown
        key={item.id}
        label={item.title}
        href={item.url}
        items={dropdownItems}
        trigger="hover"
        className={item.cssClass || undefined}
      />
    );
  }

  // Simple link item
  return (
    <Link
      key={item.id}
      href={item.url}
      target={item.target}
      className={cn(
        'text-sm font-medium text-text-main hover:text-primary transition-colors',
        'min-h-[44px] flex items-center px-3',
        item.cssClass
      )}
    >
      {item.iconClass && <span className={cn('mr-2', item.iconClass)} />}
      {item.title}
    </Link>
  );
}

/**
 * Hardcoded Navigation Menu (Fallback)
 * 
 * Uses menu data from menuDataConfig
 * Based on menu_gau_bong.md specification
 */
function HardcodedNavigationMenu() {
  return (
    <nav className="hidden lg:flex items-center space-x-1 relative z-50 overflow-visible">
      {mainNavigation.map((item) => (
        <ConfigMenuItemRenderer key={item.id} item={item} />
      ))}
    </nav>
  );
}

/**
 * Render menu item from config
 */
function ConfigMenuItemRenderer({ item }: { item: ConfigMenuItem }) {
  // Link item
  if (item.type === 'link') {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    
    if (hasSubItems) {
      // Link with sub-items (dropdown)
      const dropdownItems: MenuDropdownItem[] = item.subItems!.map((subItem) => ({
        id: subItem.href,
        label: subItem.label,
        href: subItem.href,
      }));

      return (
        <MenuDropdown
          key={item.id}
          label={item.label}
          href={item.href}
          items={dropdownItems}
          trigger="hover"
        />
      );
    }

    // Simple link
    const itemColor = getMenuItemColor(item);
    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          'text-sm font-medium transition-colors',
          'min-h-[44px] flex items-center px-3',
          item.highlight && 'font-bold',
          item.badge === 'sale' && 'text-red-600 hover:text-red-700'
        )}
        style={item.color ? { color: itemColor } : undefined}
      >
        {item.label}
        {item.badge && (
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            {item.badge === 'sale' ? 'Sale' : item.badge}
          </span>
        )}
      </Link>
    );
  }

  // Dropdown item
  if (item.type === 'dropdown' && item.children && item.children.length > 0) {
    const dropdownItems: MenuDropdownItem[] = item.children.map((child) => ({
      id: child.id,
      label: child.label,
      href: child.href,
      badge: child.badge,
      icon: child.icon,
    }));

    return (
      <MenuDropdown
        key={item.id}
        label={item.label}
        href={item.href}
        items={dropdownItems}
        trigger="hover"
      />
    );
  }

  // Mega menu item
  if (item.type === 'mega' && item.megaMenu) {
    return (
      <ProductsMegaMenu
        key={item.id}
        label={item.label}
        href={item.href}
        menuItem={item}
      />
    );
  }

  // Fallback to simple link
  return (
    <Link
      key={item.id}
      href={item.href}
      className={cn(
        'text-sm font-medium text-text-main hover:text-primary transition-colors',
        'min-h-[44px] flex items-center px-3'
      )}
    >
      {item.label}
    </Link>
  );
}

