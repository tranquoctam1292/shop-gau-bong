# 📋 PLAN: Nâng cấp Menu cho Website Gấu Bông Teddy

**Last Updated:** 2025-01-XX  
**Note:** Gomi.vn được tham khảo cho menu structure, không phải nội dung website.

---

## 🎯 Mục tiêu

Nâng cấp menu navigation để:
- **User-friendly:** Dễ tìm sản phẩm theo danh mục
- **Mobile-optimized:** Touch-friendly, hamburger menu
- **SEO-friendly:** Clear hierarchy, proper links
- **Conversion-focused:** Highlight promotions, featured categories

---

## 📊 Phân tích Menu hiện tại

### Current Structure
- Basic navigation với links đơn giản
- Cần cải thiện: Dropdown menus, category navigation, mobile menu

### Reference Menu Structure (tham khảo)
```
- Trang chủ
- Thông tin
- Gấu Teddy
  - Gấu Teddy Fullsize
  - Gấu Teddy Bigsize
  - Gấu Teddy Mini
- Hoạt hình
  - Nhân Vật Hoạt Hình
    - Doraemon
    - Hello Kitty
    - Gấu Pooh
    - ...
  - Hoạt Hình Hot Trend
    - Capybara
    - Lena
    - Lotso
    - ...
- Bộ sưu tập
  - Gấu Bông Khuyến Mãi
  - Gấu Bông Bigsize
  - Gấu Bông Mùng 8/3
  - Gấu Bông Tặng Nàng
  - ...
- Thú bông
  - Thú Bông Hot
  - Hải Cẩu Bông
  - Chó Bông
  - Vịt Bông
  - ...
- Gối bông
  - Gối Cổ Bông
  - Gối Ôm Nằm
  - Gối Ôm Đứng
  - ...
- Phụ kiện
  - Hoa Bông
  - Móc Khóa Bông
- Dịch vụ
  - Thêu Tên Gấu Bông
  - Gói Quà Miễn Phí
  - ...
```

---

## 🎨 Menu Structure mới (Proposed)

### Desktop Menu (Horizontal)

```
[Logo]  Trang chủ  |  Sản phẩm ▼  |  Danh mục ▼  |  Dịp lễ ▼  |  Dịch vụ ▼  |  Về chúng tôi  |  [Search] [Cart]
```

### Mobile Menu (Hamburger)

```
☰ Menu
  ├─ Trang chủ
  ├─ Sản phẩm
  │  ├─ Tất cả sản phẩm
  │  ├─ Gấu Bông Bigsize
  │  ├─ Sản phẩm mới
  │  └─ Sản phẩm bán chạy
  ├─ Danh mục
  │  ├─ Gấu Teddy
  │  ├─ Thú Bông
  │  ├─ Gối Bông
  │  └─ Phụ kiện
  ├─ Dịp lễ
  │  ├─ Valentine
  │  ├─ Sinh nhật
  │  ├─ 8/3
  │  └─ Giáng Sinh
  ├─ Dịch vụ
  │  ├─ Thêu tên
  │  ├─ Gói quà
  │  └─ Vận chuyển
  └─ Về chúng tôi
```

---

## 📐 Menu Items chi tiết

### 1. **Trang chủ** (Home)
- Link: `/`
- No dropdown
- Icon: 🏠 (optional)

### 2. **Sản phẩm** (Products) - Dropdown
**Main Link:** `/products`

**Dropdown Items:**
- Tất cả sản phẩm → `/products`
- Gấu Bông Bigsize → `/products?size=bigsize`
- Sản phẩm mới → `/products?sort=newest`
- Sản phẩm bán chạy → `/products?sort=popularity`
- Sản phẩm nổi bật → `/products?featured=true`
- Sản phẩm giảm giá → `/products?on_sale=true`

### 3. **Danh mục** (Categories) - Mega Menu
**Main Link:** `/categories` (optional)

**Dropdown Structure:**
```
Danh mục
├─ Gấu Teddy
│  ├─ Gấu Teddy Fullsize → /products?category=teddy-fullsize
│  ├─ Gấu Teddy Bigsize → /products?category=teddy-bigsize
│  └─ Gấu Teddy Mini → /products?category=teddy-mini
├─ Thú Bông
│  ├─ Thú Bông Hot → /products?category=thu-bong-hot
│  ├─ Hải Cẩu Bông → /products?category=hai-cau-bong
│  ├─ Chó Bông → /products?category=cho-bong
│  ├─ Vịt Bông → /products?category=vit-bong
│  └─ Thú Bông Khác → /products?category=thu-bong-khac
├─ Gối Bông
│  ├─ Gối Cổ Bông → /products?category=goi-co-bong
│  ├─ Gối Ôm Nằm → /products?category=goi-om-nam
│  └─ Gối Ôm Đứng → /products?category=goi-om-dung
└─ Phụ kiện
   ├─ Hoa Bông → /products?category=hoa-bong
   └─ Móc Khóa Bông → /products?category=moc-khoa-bong
```

**Note:** Categories sẽ được fetch từ WooCommerce REST API.

### 4. **Dịp lễ** (Occasions) - Dropdown
**Main Link:** `/products?occasion=all` (optional)

**Dropdown Items:**
- Valentine → `/products?category=valentine`
- Sinh nhật → `/products?category=sinh-nhat`
- 8/3 → `/products?category=8-3`
- 20/10 → `/products?category=20-10`
- Giáng Sinh → `/products?category=giang-sinh`
- Tết → `/products?category=tet`
- Tốt nghiệp → `/products?category=tot-nghiep`

### 5. **Dịch vụ** (Services) - Dropdown
**Main Link:** `/services` (optional page)

**Dropdown Items:**
- Thêu tên gấu bông → `/services/embroidery`
- Gói quà miễn phí → `/services/gift-wrapping`
- Vận chuyển → `/services/shipping`
- Bảo hành → `/services/warranty`
- Đổi trả → `/services/return`

### 6. **Về chúng tôi** (About)
- Link: `/about`
- No dropdown
- Sub-items (optional):
  - Giới thiệu → `/about`
  - Câu chuyện → `/blog/stories`
  - Hệ thống cửa hàng → `/stores`
  - Liên hệ → `/contact`

---

## 🛠️ Implementation Plan

### Phase 1: Core Menu Structure (Priority 1)
1. ✅ Create `NavigationMenu` component với dropdown support
2. ✅ Create `MobileMenu` component (hamburger menu)
3. ✅ Update `Header.tsx` với new menu structure
4. ✅ Add category fetching từ WooCommerce REST API

### Phase 2: Mega Menu & Dropdowns (Priority 2)
5. ✅ Implement mega menu cho Categories
6. ✅ Add dropdown animations và transitions
7. ✅ Add icons cho menu items (optional)
8. ✅ Add badges (New, Hot, Sale) cho menu items

### Phase 3: Mobile Optimization (Priority 3)
9. ✅ Optimize mobile menu với smooth animations
10. ✅ Add search bar trong mobile menu
11. ✅ Add cart icon trong mobile menu
12. ✅ Test touch interactions

### Phase 4: Enhancements (Priority 4)
13. ✅ Add menu item images (category thumbnails)
14. ✅ Add featured products trong dropdown
15. ✅ Add promotional banners trong menu
16. ✅ Add breadcrumbs navigation

---

## 📝 Components cần tạo

### New Components:
1. `components/layout/NavigationMenu.tsx` - Main navigation menu
2. `components/layout/MobileMenu.tsx` - Mobile hamburger menu
3. `components/layout/MenuDropdown.tsx` - Reusable dropdown component
4. `components/layout/MegaMenu.tsx` - Mega menu cho categories
5. `components/layout/MenuItem.tsx` - Individual menu item component

### Update Existing:
- `components/layout/Header.tsx` - Integrate new menu components
- `components/layout/SearchBar.tsx` - Enhance search (if exists)
- `components/layout/CartIcon.tsx` - Update cart icon (if exists)

---

## 🎨 Design Specifications

### Desktop Menu
- **Height:** `64px` (min-h-[64px])
- **Background:** `bg-background` với border-bottom
- **Font:** `font-heading` cho main items
- **Hover:** Background color change + underline
- **Dropdown:** Shadow, rounded corners, padding
- **Z-index:** Dropdowns should be above content (z-50)

### Mobile Menu
- **Hamburger Icon:** 44x44px touch target
- **Menu Overlay:** Full screen hoặc slide-in từ left
- **Background:** `bg-background` với backdrop blur
- **Animation:** Smooth slide-in/out
- **Close Button:** Top right, 44x44px

### Menu Items
- **Font Size:** `text-sm md:text-base`
- **Padding:** `px-4 py-2` (desktop), `px-4 py-3` (mobile)
- **Touch Target:** Min 44x44px (mobile)
- **Active State:** Primary color + underline
- **Hover State:** Background color change

---

## 🔌 API Requirements

### Categories API
```typescript
// Fetch categories for menu
GET /api/woocommerce/categories?per_page=100&orderby=menu_order&order=asc

// Response structure
{
  categories: [
    {
      id: number;
      name: string;
      slug: string;
      count: number;
      parent: number; // 0 = top level
      image: { src: string; alt: string; } | null;
    }
  ]
}
```

### Menu Structure từ WordPress
**Option 1:** Use WooCommerce categories (recommended)
- Categories tự động sync với products
- Easy to maintain

**Option 2:** WordPress Custom Menu
- More control over menu structure
- Can include custom links
- Requires WordPress menu setup

**Recommendation:** Use WooCommerce categories + custom menu items for static pages.

---

## 📱 Mobile-First Considerations

### Hamburger Menu
- **Trigger:** 44x44px button, top-left
- **Animation:** Slide-in from left hoặc overlay
- **Close:** X button hoặc click outside
- **Scroll:** Menu content scrollable nếu dài

### Touch Interactions
- **Tap:** Open/close menu
- **Swipe:** Close menu (optional)
- **Long press:** (optional) Quick actions

### Performance
- **Lazy load:** Menu items load on demand
- **Cache:** Cache category data
- **Optimize:** Minimize re-renders

---

## 🎯 Features

### 1. Dropdown Menus
- **Hover trigger:** Desktop (hover to open)
- **Click trigger:** Mobile (click to toggle)
- **Auto-close:** Close when clicking outside
- **Keyboard navigation:** Arrow keys, Enter, Escape

### 2. Mega Menu (Categories)
- **Multi-column layout:** 2-3 columns
- **Category images:** Thumbnail images
- **Product count:** Show number of products
- **Featured categories:** Highlight popular categories

### 3. Search Integration
- **Search bar:** In header (desktop) or mobile menu
- **Auto-complete:** Search suggestions
- **Quick search:** Search icon in menu

### 4. Cart Integration
- **Cart icon:** Badge với item count
- **Cart dropdown:** Quick view (optional)
- **Cart link:** Direct to cart page

---

## ✅ Implementation Checklist

### Phase 1: Core Structure
- [x] Create `NavigationMenu.tsx` component ✅ **COMPLETED**
- [x] Create `MobileMenu.tsx` component ✅ **COMPLETED**
- [x] Create `MenuDropdown.tsx` component ✅ **COMPLETED**
- [x] Update `Header.tsx` với new menu ✅ **COMPLETED**
- [x] Add category fetching hook ✅ **COMPLETED** (using useCategoriesREST)

### Phase 1 Status: ✅ **COMPLETED**

### Phase 2: Dropdowns & Mega Menu
- [x] Implement Products dropdown ✅ **COMPLETED** (in Phase 1)
- [x] Implement Categories mega menu ✅ **COMPLETED**
- [x] Implement Occasions dropdown ✅ **COMPLETED** (in Phase 1)
- [x] Implement Services dropdown ✅ **COMPLETED** (in Phase 1)
- [x] Add dropdown animations ✅ **COMPLETED**

### Phase 2 Status: ✅ **COMPLETED**

### Phase 3: Mobile Optimization
- [x] Implement hamburger menu ✅ **COMPLETED** (in Phase 1)
- [x] Add mobile menu animations ✅ **COMPLETED**
- [x] Add search trong mobile menu ✅ **COMPLETED**
- [x] Test touch interactions ✅ **COMPLETED** (touch-manipulation CSS)

### Phase 3 Status: ✅ **COMPLETED**

### Phase 4: Enhancements
- [x] Add category images ✅ **COMPLETED** (improved in MegaMenu)
- [x] Add menu item badges ✅ **COMPLETED** (enhanced in MenuDropdown)
- [x] Add promotional banners ✅ **COMPLETED** (PromotionalBanner component)
- [x] Add breadcrumbs ✅ **COMPLETED** (Breadcrumbs component)

### Phase 4 Status: ✅ **COMPLETED**

---

## 📊 Menu Data Structure

### Menu Item Type
```typescript
interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: 'new' | 'hot' | 'sale';
  children?: MenuItem[];
  image?: string; // For category thumbnails
}
```

### Menu Configuration
```typescript
const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Trang chủ',
    href: '/',
  },
  {
    id: 'products',
    label: 'Sản phẩm',
    href: '/products',
    children: [
      { id: 'all', label: 'Tất cả sản phẩm', href: '/products' },
      { id: 'bigsize', label: 'Gấu Bông Bigsize', href: '/products?size=bigsize' },
      { id: 'new', label: 'Sản phẩm mới', href: '/products?sort=newest' },
      { id: 'popular', label: 'Sản phẩm bán chạy', href: '/products?sort=popularity' },
    ],
  },
  {
    id: 'categories',
    label: 'Danh mục',
    href: '/categories',
    children: [], // Will be populated from API
  },
  // ... more items
];
```

---

## 🔗 Related Files

- `components/layout/Header.tsx` - Main header component
- `lib/hooks/useCategoriesREST.ts` - Category fetching hook
- `app/api/woocommerce/categories/route.ts` - Categories API route
- `types/woocommerce.ts` - Type definitions

---

## 📚 References

- Gomi.vn được tham khảo cho menu structure (không phải nội dung website)
- [Shadcn UI Navigation Menu](https://ui.shadcn.com/docs/components/navigation-menu) - Component library
- [WooCommerce REST API Categories](https://woocommerce.github.io/woocommerce-rest-api-docs/#categories)

---

## 🎯 Success Metrics

- **User Engagement:** Menu usage, click-through rates
- **Mobile UX:** Touch-friendly, easy navigation
- **SEO:** Proper link structure, breadcrumbs
- **Conversion:** Easy access to products, categories

---

**Date:** 2025-01-XX  
**Status:** 📋 Planning Complete - Ready for Implementation

