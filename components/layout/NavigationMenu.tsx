'use client';

import Link from 'next/link';
import { Gift } from 'lucide-react';
import { MenuDropdown, type MenuDropdownItem } from './MenuDropdown';
import { ShopMegaMenu } from './ShopMegaMenu';
import { cn } from '@/lib/utils/cn';

/**
 * Navigation Menu Component
 * 
 * Main navigation menu với dropdowns và mega menu
 * Desktop: Horizontal menu với hover dropdowns và mega menu
 * Mobile: Hidden (use MobileMenu instead)
 */
export function NavigationMenu() {
  // Removed productsItems - now integrated into ShopMegaMenu

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

      {/* Cửa Hàng - Mega Menu (hợp nhất Sản phẩm & Danh mục) */}
      <ShopMegaMenu label="Cửa Hàng" href="/products" />

      {/* Chọn Quà Tặng - Highlighted for emotional/gifting focus */}
      <MenuDropdown
        label="Chọn Quà Tặng"
        items={occasionsItems}
        trigger="hover"
        icon={<Gift className="w-4 h-4 text-pink-500" />}
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

