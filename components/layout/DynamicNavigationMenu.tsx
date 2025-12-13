'use client';

import Link from 'next/link';
import { useMenu, type MenuItem } from '@/lib/hooks/useMenu';
import { MenuDropdown, type MenuDropdownItem } from './MenuDropdown';
import { ShopMegaMenu } from './ShopMegaMenu';
import { cn } from '@/lib/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';

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
 * This is the original hardcoded menu structure
 * Used as fallback when no menu is found from API
 */
function HardcodedNavigationMenu() {
  // Occasions dropdown items
  const occasionsItems: MenuDropdownItem[] = [
    { id: 'valentine', label: 'Valentine', href: '/products?category=valentine' },
    { id: 'sinh-nhat', label: 'Sinh nhật', href: '/products?category=sinh-nhat' },
    { id: '8-3', label: '8/3', href: '/products?category=8-3' },
    { id: '20-10', label: '20/10', href: '/products?category=20-10' },
    { id: 'giang-sinh', label: 'Giáng Sinh', href: '/products?category=giang-sinh' },
    { id: 'tet', label: 'Tết', href: '/products?category=tet' },
    { id: 'tot-nghiep', label: 'Tốt nghiệp', href: '/products?category=tot-nghiep' },
  ];

  // Services dropdown items
  const servicesItems: MenuDropdownItem[] = [
    { id: 'embroidery', label: 'Thêu tên gấu bông', href: '/services/embroidery' },
    { id: 'gift-wrapping', label: 'Gói quà miễn phí', href: '/services/gift-wrapping' },
    { id: 'shipping', label: 'Vận chuyển', href: '/services/shipping' },
    { id: 'warranty', label: 'Bảo hành', href: '/services/warranty' },
    { id: 'return', label: 'Đổi trả', href: '/services/return' },
  ];

  return (
    <nav className="hidden lg:flex items-center space-x-1 relative z-50 overflow-visible">
      {/* Trang chủ */}
      <Link
        href="/"
        className={cn(
          'text-sm font-medium text-text-main hover:text-primary transition-colors',
          'min-h-[44px] flex items-center px-3'
        )}
      >
        Trang chủ
      </Link>

      {/* Cửa Hàng - Mega Menu */}
      <ShopMegaMenu label="Cửa Hàng" href="/products" />

      {/* Chọn Quà Tặng */}
      <MenuDropdown
        label="Chọn Quà Tặng"
        items={occasionsItems}
        trigger="hover"
        highlight={true}
      />

      {/* Dịch vụ */}
      <MenuDropdown
        label="Dịch vụ"
        items={servicesItems}
        trigger="hover"
      />

      {/* Về chúng tôi */}
      <Link
        href="/about"
        className={cn(
          'text-sm font-medium text-text-main hover:text-primary transition-colors',
          'min-h-[44px] flex items-center px-3'
        )}
      >
        Về chúng tôi
      </Link>
    </nav>
  );
}

