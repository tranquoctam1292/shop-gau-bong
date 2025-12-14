TICKET: ĐIỀU CHỈNH GIAO DIỆN HEADER & MENU (GẤU BÔNG SHOP)

Người yêu cầu: [Tên của bạn]
Ngày tạo: 14/12/2025
Mức độ ưu tiên: High (Blocker UI/UX)
File ảnh hưởng: components/layout/Header.tsx, components/search/EnhancedSearchBar.tsx, components/layout/DynamicNavigationMenu.tsx, components/layout/ProductsMegaMenu.tsx

1. TỔNG QUAN VẤN ĐỀ (CURRENT ISSUES)

Dựa trên bản build mới nhất và so sánh với tài liệu đặc tả menu_gau_bong.md, giao diện hiện tại đang gặp các lỗi sai lệch thiết kế nghiêm trọng sau:

Hạng mục

Đặc tả yêu cầu (Expectation)

Hiện trạng (Reality)

Cấu trúc (Layout)

3 Tầng tách biệt:



1. Top Bar



2. Logo - Search - Actions



3. Menu Ngang (Sticky)

Gộp tầng 2 & 3: Menu điều hướng (DynamicNavigationMenu) đang nằm chung hàng với Logo và Search, gây chật chội và vỡ bố cục trên màn hình nhỏ.

Thanh tìm kiếm

Pill Shape: Bo tròn 999px. Nút search nằm bên trong input (bên phải).

Default Style: Input và nút search tách rời. Placeholder bị cắt chữ. Nút search hình vuông bo góc nhẹ.

User Actions

Đầy đủ 3 icon: Tài khoản (User) - Yêu thích (Heart) - Giỏ hàng (Bag).

Thiếu icon Tài khoản và Yêu thích. Chỉ hiển thị Giỏ hàng.

Hiệu ứng Sticky

Chỉ thanh Menu Ngang (Tầng 3) dính lại khi cuộn. Logo và Search trôi đi.

Toàn bộ Header dính lại, chiếm quá nhiều diện tích màn hình dọc.

Active State

Mục menu đang chọn phải đổi màu/in đậm (Active).

Thiếu logic: Không có code kiểm tra pathname hiện tại để highlight menu cha.

2. PHÂN TÍCH CHUYÊN SÂU (DEEP REVIEW FINDINGS)

Ngoài các lỗi hiển thị trên, qua review code, phát hiện thêm các vấn đề logic sau:

2.1. Lỗi Logic Render Dynamic Menu

File: components/layout/DynamicNavigationMenu.tsx

Vấn đề: Trong hàm MenuItemRenderer, logic kiểm tra isShopMenu đang trả về MenuDropdown thay vì ProductsMegaMenu.

Hậu quả: Nếu chuyển từ Hardcoded sang API thật, Mega Menu sẽ bị mất layout 3 cột và trở thành dropdown list đơn giản.

2.2. Vấn đề UX trên Mobile (Bottom Safe Area)

File: components/layout/MobileHotlineButton.tsx

Vấn đề: Nút Hotline dính đáy (bottom-0) nhưng thiếu padding cho vùng an toàn (Safe Area) trên iPhone đời mới (có thanh vuốt home).

Hậu quả: Nút bị đè lên thanh Home ảo của iPhone, khó bấm.

2.3. Cumulative Layout Shift (CLS)

File: components/layout/Header.tsx

Vấn đề: EnhancedSearchBar được lazy load với Skeleton placeholder nhưng chiều cao của Skeleton (h-10) có thể không khớp chính xác với Search Bar thật sau khi CSS lại (h-11 hoặc h-12), gây giật layout nhẹ khi tải trang.

3. YÊU CẦU CHỈNH SỬA CHI TIẾT (ACTION ITEMS)

Task 1: Refactor cấu trúc Header.tsx (Quan trọng nhất)

Tách layout ra làm 3 khối div riêng biệt. Sử dụng lại đoạn code đã Refactor ở mục 4.1.

Task 2: Fix CSS EnhancedSearchBar

Đảm bảo nút Search nằm lọt lòng Input.

Task 3: Fix Logic & UX (Mới bổ sung)

Fix Dynamic Menu: Sửa DynamicNavigationMenu.tsx để render đúng ProductsMegaMenu.

Fix Mobile Hotline: Thêm pb-safe (padding-bottom safe area) cho nút Hotline.

Add Active State: Thêm hook usePathname vào các component Menu để so sánh URL.

4. GIẢI PHÁP CODE (SOLUTION SNIPPETS)

4.1. File components/layout/Header.tsx (Refactored - Full Structure)

'use client';

import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Added for Active State check if needed later
import { ShoppingBag, Heart, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/lib/utils/button-variants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/cn';
import { TopBar } from './TopBar';
import { topBarConfig } from '@/lib/constants/menuData';

// Lazy imports...
const CartDrawer = lazy(() => import('@/components/cart/CartDrawer').then(mod => ({ default: mod.CartDrawer })));
const EnhancedSearchBar = lazy(() => import('@/components/search/EnhancedSearchBar').then(mod => ({ default: mod.EnhancedSearchBar })));
const DynamicNavigationMenu = lazy(() => import('@/components/layout/DynamicNavigationMenu').then(mod => ({ default: mod.DynamicNavigationMenu })));
const mobileMenuImport = () => import('@/components/layout/DynamicMobileMenu').then(mod => ({ default: mod.DynamicMobileMenu }));
const DynamicMobileMenu = lazy(mobileMenuImport);
const SearchModal = lazy(() => import('@/components/search/SearchModal').then(mod => ({ default: mod.SearchModal })));

export function Header() {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const mobileMenuPreloadedRef = useRef(false);

  // Sticky Logic
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileMenuHover = useCallback(() => {
    if (!mobileMenuPreloadedRef.current) {
      mobileMenuPreloadedRef.current = true;
      mobileMenuImport().catch(() => { mobileMenuPreloadedRef.current = false; });
    }
  }, []);

  return (
    <>
      {/* TẦNG 1: TOP BAR */}
      <TopBar leftText={topBarConfig.left} rightItems={topBarConfig.right} />

      {/* TẦNG 2: LOGO - SEARCH - ACTIONS */}
      <div className="bg-background py-4 md:py-6 border-b border-primary/5 relative z-30">
        <div className="container mx-auto px-4 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center text-2xl transition-transform group-hover:rotate-12">🧸</div>
            <div className="flex flex-col">
              <span className="font-logo text-xl md:text-2xl font-extrabold text-primary leading-none tracking-tight">
                GấuBông<span className="text-text-main">Shop</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold hidden md:block">Soft & Cute</span>
            </div>
          </Link>

          {/* Search Bar - Fix CLS with matching Skeleton height */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto">
            <Suspense fallback={<Skeleton className="h-11 w-full rounded-full" />}>
              <EnhancedSearchBar className="w-full" />
            </Suspense>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
             {/* Mobile Search */}
             <button onClick={() => setIsSearchModalOpen(true)} className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden text-text-main')}>
              <Search className="w-5 h-5" />
            </button>

            {/* Desktop Actions */}
            <Link href="/account" className="hidden md:flex flex-col items-center group text-text-main hover:text-primary transition-colors">
                <div className="w-10 h-10 bg-white border border-border rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all"><User className="w-5 h-5" /></div>
            </Link>
            <Link href="/wishlist" className="hidden md:flex flex-col items-center group text-text-main hover:text-primary transition-colors relative">
                <div className="w-10 h-10 bg-white border border-border rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all"><Heart className="w-5 h-5" /></div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">2</span>
            </Link>

            {/* Cart */}
            <Suspense fallback={<Button size="icon" variant="ghost"><ShoppingBag className="w-5 h-5" /></Button>}>
              <CartDrawer />
            </Suspense>
            
            {/* Mobile Menu Trigger */}
            <div className="lg:hidden ml-2" onMouseEnter={handleMobileMenuHover} onTouchStart={handleMobileMenuHover}>
                <Suspense fallback={<div className="w-10 h-10 bg-gray-100 rounded-md" />}>
                    <DynamicMobileMenu location="mobile" fallbackToHardcoded={true} />
                </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* TẦNG 3: NAVIGATION MENU (Sticky) */}
      <header 
        className={cn(
            "hidden lg:block w-full z-40 transition-all duration-300 border-b border-border",
            isSticky ? "fixed top-0 bg-white/95 backdrop-blur-md shadow-soft py-2" : "relative bg-white py-0 border-t border-primary/10"
        )}
      >
        <div className="container mx-auto px-4 flex justify-center">
          <Suspense fallback={<div className="w-full h-12 bg-gray-50 rounded animate-pulse" />}>
            <DynamicNavigationMenu location="primary" fallbackToHardcoded={true} />
          </Suspense>
        </div>
      </header>

      <Suspense fallback={null}><SearchModal open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen} /></Suspense>
    </>
  );
}


4.2. File components/search/EnhancedSearchBar.tsx (CSS Fix)

// Yêu cầu dev update class như sau:
<div className={cn("relative w-full group", className)}>
  <input 
    type="text" 
    placeholder="Bạn đang tìm gấu Teddy..." 
    className="w-full h-11 pl-6 pr-14 rounded-full border-2 border-primary/20 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-gray-400 text-sm"
  />
  <button type="submit" className="absolute right-1 top-1 bottom-1 w-9 h-9 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-all">
    <Search className="w-4 h-4" />
  </button>
</div>


4.3. File components/layout/DynamicNavigationMenu.tsx (Logic Fix)

// ... imports
import { ProductsMegaMenu } from './ProductsMegaMenu'; // Import bị thiếu trong logic cũ

// Trong hàm MenuItemRenderer:
if (isShopMenu) {
  // FIX: Trả về đúng ProductsMegaMenu thay vì MenuDropdown
  return (
    <ProductsMegaMenu
      key={item.id}
      label={item.title}
      href={item.url}
      menuItem={item} // Đảm bảo mapping item API sang cấu trúc menuItem mà ProductsMegaMenu cần
      className={item.cssClass || undefined}
    />
  );
}


4.4. File components/layout/MobileHotlineButton.tsx (Safe Area Fix)

// Thêm class pb-safe (hoặc mb-safe nếu dùng tailwind plugin) hoặc style padding-bottom
export function MobileHotlineButton() {
  // ... check enabled
  return (
    <Link
      href={href}
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-primary text-white flex items-center justify-center gap-2',
        'px-6 py-4 shadow-lg border-t border-primary/20',
        'min-h-[56px] pb-[calc(1rem+env(safe-area-inset-bottom))]', // FIX: Add Safe Area padding
        'transition-transform active:scale-95'
      )}
    >
      {/* ... content */}
    </Link>
  );
}


5. CHECKLIST NGHIỆM THU (UPDATED)

[ ] Layout: Header tách đủ 3 tầng, không bị dính chùm.

[ ] Sticky: Chỉ Menu Bar dính lại, Logo/Search trôi đi.

[ ] Search: Nút Search nằm lọt lòng Input.

[ ] Actions: Đủ 3 icon User, Heart, Cart.

[ ] Mobile: Nút Hotline không bị che bởi thanh Home ảo iPhone.

[ ] Mega Menu: Render đúng layout 3 cột khi dùng Dynamic Menu (nếu test mode dynamic).