# 📋 PLAN: Xây dựng HomePage cho Website Bán Gấu Bông

## 🎯 Mục tiêu

Xây dựng HomePage chuyên nghiệp, thân thiện, tối ưu cho mobile (90% traffic) với các sections phù hợp ngành gấu bông.

## 🎨 Design Concept

**Tone & Feel:**
- Ấm áp, đáng yêu, thân thiện
- Pastel colors (Pink #FF9EB5, Blue #AEC6CF)
- Rounded shapes (rounded-full, rounded-2xl)
- Mobile-first (90% traffic từ mobile)

**Visual Elements:**
- Emoji gấu bông (🧸) làm điểm nhấn
- Soft shadows, gentle transitions
- Large, clear images
- Touch-friendly buttons (min 44x44px)

---

## 📐 Cấu trúc HomePage

### 1. **Hero Section** (Above the fold)
**Mục đích:** Tạo ấn tượng đầu tiên, giới thiệu brand

**Components cần tạo:**
- `components/home/HeroSection.tsx`

**Nội dung:**
- Background image hoặc gradient pastel
- Headline: "🧸 Chào mừng đến với Shop Gấu Bông"
- Subheadline: "Nơi bạn tìm thấy những chú gấu bông đáng yêu nhất"
- CTA buttons:
  - Primary: "Xem sản phẩm" → `/products`
  - Secondary: "Tìm hiểu thêm" → `/about`
- Optional: Hero image (gấu bông lớn, đáng yêu)

**Design:**
- Full width trên mobile
- Centered content
- Large, readable text (text-2xl mobile, text-4xl desktop)
- Buttons: `buttonVariants({ size: 'lg' })`

**Mobile Optimization:**
- Stack buttons vertically
- Min height: `min-h-[60vh]` (mobile), `min-h-[80vh]` (desktop)
- Padding: `py-12 md:py-20`

---

### 2. **Categories Section** (Danh mục sản phẩm)
**Mục đích:** Giúp users nhanh chóng tìm sản phẩm theo danh mục

**Components cần tạo:**
- `components/home/CategoryGrid.tsx`
- `components/home/CategoryCard.tsx`

**Nội dung:**
- Grid hiển thị các danh mục chính:
  - Gấu bông cỡ nhỏ
  - Gấu bông cỡ trung
  - Gấu bông cỡ lớn
  - Gấu bông theo chủ đề (Valentine, Sinh nhật, v.v.)
  - Gấu bông theo độ tuổi (Trẻ em, Người lớn)

**Design:**
- Grid: 2 cols mobile, 3-4 cols desktop
- Card với:
  - Category image (aspect-square)
  - Category name
  - Product count (optional)
  - Hover effect: scale + shadow

**GraphQL Query:**
- Query categories từ WordPress
- Include category image, name, slug, product count

**Mobile Optimization:**
- Touch-friendly cards (min 44x44px)
- Clear labels
- Easy navigation

---

### 3. **Featured Products** (Sản phẩm nổi bật)
**Mục đích:** Highlight sản phẩm best sellers hoặc featured

**Components:**
- Reuse: `components/product/ProductCard.tsx`
- New: `components/home/FeaturedProducts.tsx` (wrapper)

**Nội dung:**
- Section title: "⭐ Sản phẩm nổi bật"
- Grid: 2 cols mobile, 4 cols desktop
- Show 4-8 featured products
- "Xem tất cả" link → `/products?featured=true`

**Design:**
- Horizontal scroll trên mobile (optional)
- Grid layout trên desktop
- Product cards với badges (Featured, Sale)

**GraphQL Query:**
- Query products với `featured: true` hoặc `onSale: true`
- Limit: 8 products

---

### 4. **New Arrivals** (Sản phẩm mới nhất)
**Mục đích:** Showcase sản phẩm mới để tạo FOMO

**Components:**
- Reuse: `components/product/ProductCard.tsx`
- New: `components/home/NewArrivals.tsx` (wrapper)

**Nội dung:**
- Section title: "🆕 Sản phẩm mới nhất"
- Grid: 2 cols mobile, 4 cols desktop
- Show 4-8 newest products
- "Xem tất cả" link → `/products?sort=newest`

**Design:**
- Similar to Featured Products
- "New" badge trên product cards
- Sort by date (newest first)

**GraphQL Query:**
- Query products sorted by `date` DESC
- Limit: 8 products

---

### 5. **Best Sellers** (Sản phẩm bán chạy)
**Mục đích:** Social proof, show popular products

**Components:**
- Reuse: `components/product/ProductCard.tsx`
- New: `components/home/BestSellers.tsx` (wrapper)

**Nội dung:**
- Section title: "🔥 Sản phẩm bán chạy"
- Grid: 2 cols mobile, 4 cols desktop
- Show 4-8 best selling products
- "Xem tất cả" link → `/products?sort=popularity`

**Design:**
- Similar to Featured Products
- Optional: Show sales count hoặc "Bán chạy" badge

**GraphQL Query:**
- Query products sorted by sales count hoặc popularity
- Limit: 8 products

---

### 6. **Categories Section** (Danh mục sản phẩm) - UPDATED
**Mục đích:** Giúp users nhanh chóng tìm sản phẩm theo danh mục

**Components:**
- `components/home/CategoryGrid.tsx` ✅
- `components/home/CategoryCard.tsx` ✅

**Nội dung:**
- Grid hiển thị 8 danh mục chính (4 cols x 2 rows trên desktop, 2 cols trên mobile)
- Mỗi card hiển thị:
  - Category image (aspect-square)
  - Category name
  - Product count (optional)

**Design:**
- Grid: **2 cols mobile, 4 cols desktop, 2 rows (8 categories)**
- Card với:
  - Category image (aspect-square)
  - Overlay gradient để text dễ đọc
  - Category name + count ở bottom
  - Hover effect: scale + shadow
  - Touch-friendly (min 44x44px)

**GraphQL Query:**
- Query categories từ WordPress với image
- Limit: 8 categories

**Mobile Optimization:**
- 2 columns trên mobile
- Touch-friendly cards
- Clear labels
- Easy navigation

---

## 🛠️ Implementation Plan

### Phase 1: Core Sections (Priority 1)
1. ✅ Hero Section
2. ✅ **Categories Section** (4 cols x 2 rows desktop, 2 cols mobile) - **UPDATED**
3. ✅ Featured Products
4. ✅ New Arrivals
5. ✅ Best Sellers

### Removed Sections (per user request):
- ❌ Why Choose Us
- ❌ Testimonials
- ❌ Newsletter Signup
- ❌ Social Feed

---

## 📝 Components cần tạo

### New Components:
1. `components/home/HeroSection.tsx` ✅ **CREATED**
2. `components/home/CategoryGrid.tsx` ✅ **CREATED**
3. `components/home/CategoryCard.tsx` ✅ **CREATED**
4. `components/home/FeaturedProducts.tsx` ✅ **CREATED**
5. `components/home/NewArrivals.tsx` ✅ **CREATED**
6. `components/home/BestSellers.tsx` ✅ **CREATED**
7. `lib/hooks/useProductsForHome.ts` ✅ **CREATED** (new hook for homepage sections)

### Removed Components (per user request):
- ❌ `components/home/WhyChooseUs.tsx`
- ❌ `components/home/FeatureCard.tsx`
- ❌ `components/home/Testimonials.tsx`
- ❌ `components/home/TestimonialCard.tsx`
- ❌ `components/home/NewsletterSignup.tsx`
- ❌ `components/home/SocialFeed.tsx`

### Reuse Existing Components:
- `components/product/ProductCard.tsx`
- `components/ui/Button.tsx`
- `components/ui/Card.tsx`
- `components/ui/Input.tsx`

---

## 🔍 API Implementation (REST API - Migrated from GraphQL)

### ✅ Implementation Status: **COMPLETED**

**Note:** Đã migrate từ GraphQL sang WooCommerce REST API theo migration plan.

### 1. Get Categories ✅
- **Hook:** `useCategoriesREST` (đã có sẵn)
- **Endpoint:** `/api/woocommerce/categories?per_page=8`
- **Used in:** `CategoryGrid.tsx`

### 2. Get Featured Products ✅
- **Hook:** `useProductsForHome({ featured: true, per_page: 8 })`
- **Endpoint:** `/api/woocommerce/products?featured=true&per_page=8&status=publish`
- **Used in:** `FeaturedProducts.tsx`

### 3. Get New Products ✅
- **Hook:** `useProductsForHome({ orderby: 'date', order: 'desc', per_page: 8 })`
- **Endpoint:** `/api/woocommerce/products?orderby=date&order=desc&per_page=8&status=publish`
- **Used in:** `NewArrivals.tsx`

### 4. Get Best Sellers ✅
- **Hook:** `useProductsForHome({ orderby: 'popularity', order: 'desc', per_page: 8 })`
- **Endpoint:** `/api/woocommerce/products?orderby=popularity&order=desc&per_page=8&status=publish`
- **Used in:** `BestSellers.tsx`

---

## 📱 Mobile-First Considerations

### Layout:
- Stack sections vertically
- Full-width sections
- Generous padding (`py-8 md:py-16`)
- Touch-friendly buttons (min 44x44px)

### Typography:
- H1: `text-2xl` mobile, `text-4xl` desktop
- H2: `text-xl` mobile, `text-3xl` desktop
- Body: `text-[15px]` (readable)

### Images:
- Use Next.js `Image` component
- Lazy loading
- Responsive sizes
- Aspect ratios: square cho products, 16:9 cho hero

### Performance:
- Lazy load sections below fold
- Optimize images
- Minimize initial bundle size

---

## 🎨 Design Tokens

### Colors:
- Primary: `#FF9EB5` (Pastel Pink)
- Secondary: `#AEC6CF` (Pastel Blue)
- Accent: `#FFB347` (Pastel Orange)
- Background: `#FFF9FA` (Warm White)

### Spacing:
- Section padding: `py-8 md:py-16`
- Container: `container-mobile` (px-4 md:px-8)
- Gap between sections: `space-y-12 md:space-y-20`

### Typography:
- Font: Nunito (headings), Inter (body)
- Sizes: Mobile-first, scale up for desktop

---

## ✅ Checklist Implementation

### Phase 1: Core Sections
- [x] Create `HeroSection.tsx` ✅ **COMPLETED**
- [x] Create `CategoryGrid.tsx` ✅ **COMPLETED**
- [x] Create `CategoryCard.tsx` ✅ **COMPLETED**
- [x] Update REST API query với category images ✅ **COMPLETED** (migrated to REST API)
- [x] Create `FeaturedProducts.tsx` ✅ **COMPLETED**
- [x] Create `NewArrivals.tsx` ✅ **COMPLETED**
- [x] Create `BestSellers.tsx` ✅ **COMPLETED**
- [x] Create `useProductsForHome.ts` hook ✅ **COMPLETED** (new hook for homepage)
- [x] Update `app/page.tsx` với các sections ✅ **COMPLETED**
- [ ] Test mobile responsiveness (pending manual test)
- [ ] Test REST API queries (pending manual test)

### Testing
- [ ] Test trên mobile devices
- [ ] Test performance (Lighthouse)
- [ ] Test với real data từ WordPress
- [ ] Test error states
- [ ] Test loading states

---

## 📊 Success Metrics

- **Performance:** Lighthouse score > 90
- **Mobile UX:** Touch-friendly, fast load
- **Conversion:** Clear CTAs, easy navigation
- **SEO:** Proper headings, structured data

---

**Date:** 2024-12-20  
**Last Updated:** 2025-01-XX  
**Status:** ✅ **Implementation Complete** - All core sections implemented

## 📝 Implementation Notes

### ✅ Completed:
- All 5 core sections implemented
- All components created and integrated
- REST API integration (migrated from GraphQL)
- Mobile-first responsive design
- Loading states with skeleton loaders
- Error handling (fail silently)
- Touch-friendly UI (min 44x44px)

### 🔄 Migration Notes:
- **GraphQL → REST API:** All queries migrated to WooCommerce REST API
- **New Hook:** `useProductsForHome` created specifically for homepage sections
- **API Routes:** Using existing `/api/woocommerce/*` proxy routes

### ⏳ Pending:
- Manual testing on mobile devices
- Performance testing (Lighthouse)
- Real data testing from WordPress
- Error state testing
- Loading state verification

