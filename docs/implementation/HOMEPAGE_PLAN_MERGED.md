# ðŸ“‹ PLAN: XÃ¢y dá»±ng HomePage cho Website BÃ¡n Gáº¥u BÃ´ng

## ðŸŽ¯ Má»¥c tiÃªu

XÃ¢y dá»±ng HomePage chuyÃªn nghiá»‡p, thÃ¢n thiá»‡n, tá»‘i Æ°u cho mobile (90% traffic) vá»›i cÃ¡c sections phÃ¹ há»£p ngÃ nh gáº¥u bÃ´ng.

## ðŸŽ¨ Design Concept

**Tone & Feel:**
- áº¤m Ã¡p, Ä‘Ã¡ng yÃªu, thÃ¢n thiá»‡n
- Pastel colors (Pink #FF9EB5, Blue #AEC6CF)
- Rounded shapes (rounded-full, rounded-2xl)
- Mobile-first (90% traffic tá»« mobile)

**Visual Elements:**
- Emoji gáº¥u bÃ´ng (ðŸ§¸) lÃ m Ä‘iá»ƒm nháº¥n
- Soft shadows, gentle transitions
- Large, clear images
- Touch-friendly buttons (min 44x44px)

---

## ðŸ“ Cáº¥u trÃºc HomePage

### 1. **Hero Section** (Above the fold)
**Má»¥c Ä‘Ã­ch:** Táº¡o áº¥n tÆ°á»£ng Ä‘áº§u tiÃªn, giá»›i thiá»‡u brand

**Components cáº§n táº¡o:**
- `components/home/HeroSection.tsx`

**Ná»™i dung:**
- Background image hoáº·c gradient pastel
- Headline: "ðŸ§¸ ChÃ o má»«ng Ä‘áº¿n vá»›i Shop Gáº¥u BÃ´ng"
- Subheadline: "NÆ¡i báº¡n tÃ¬m tháº¥y nhá»¯ng chÃº gáº¥u bÃ´ng Ä‘Ã¡ng yÃªu nháº¥t"
- CTA buttons:
  - Primary: "Xem sáº£n pháº©m" â†’ `/products`
  - Secondary: "TÃ¬m hiá»ƒu thÃªm" â†’ `/about`
- Optional: Hero image (gáº¥u bÃ´ng lá»›n, Ä‘Ã¡ng yÃªu)

**Design:**
- Full width trÃªn mobile
- Centered content
- Large, readable text (text-2xl mobile, text-4xl desktop)
- Buttons: `buttonVariants({ size: 'lg' })`

**Mobile Optimization:**
- Stack buttons vertically
- Min height: `min-h-[60vh]` (mobile), `min-h-[80vh]` (desktop)
- Padding: `py-12 md:py-20`

---

### 2. **Categories Section** (Danh má»¥c sáº£n pháº©m)
**Má»¥c Ä‘Ã­ch:** GiÃºp users nhanh chÃ³ng tÃ¬m sáº£n pháº©m theo danh má»¥c

**Components cáº§n táº¡o:**
- `components/home/CategoryGrid.tsx`
- `components/home/CategoryCard.tsx`

**Ná»™i dung:**
- Grid hiá»ƒn thá»‹ cÃ¡c danh má»¥c chÃ­nh:
  - Gáº¥u bÃ´ng cá»¡ nhá»
  - Gáº¥u bÃ´ng cá»¡ trung
  - Gáº¥u bÃ´ng cá»¡ lá»›n
  - Gáº¥u bÃ´ng theo chá»§ Ä‘á» (Valentine, Sinh nháº­t, v.v.)
  - Gáº¥u bÃ´ng theo Ä‘á»™ tuá»•i (Tráº» em, NgÆ°á»i lá»›n)

**Design:**
- Grid: 2 cols mobile, 3-4 cols desktop
- Card vá»›i:
  - Category image (aspect-square)
  - Category name
  - Product count (optional)
  - Hover effect: scale + shadow

**GraphQL Query:**
- Query categories tá»« WordPress
- Include category image, name, slug, product count

**Mobile Optimization:**
- Touch-friendly cards (min 44x44px)
- Clear labels
- Easy navigation

---

### 3. **Featured Products** (Sáº£n pháº©m ná»•i báº­t)
**Má»¥c Ä‘Ã­ch:** Highlight sáº£n pháº©m best sellers hoáº·c featured

**Components:**
- Reuse: `components/product/ProductCard.tsx`
- New: `components/home/FeaturedProducts.tsx` (wrapper)

**Ná»™i dung:**
- Section title: "â­ Sáº£n pháº©m ná»•i báº­t"
- Grid: 2 cols mobile, 4 cols desktop
- Show 4-8 featured products
- "Xem táº¥t cáº£" link â†’ `/products?featured=true`

**Design:**
- Horizontal scroll trÃªn mobile (optional)
- Grid layout trÃªn desktop
- Product cards vá»›i badges (Featured, Sale)

**GraphQL Query:**
- Query products vá»›i `featured: true` hoáº·c `onSale: true`
- Limit: 8 products

---

### 4. **New Arrivals** (Sáº£n pháº©m má»›i nháº¥t)
**Má»¥c Ä‘Ã­ch:** Showcase sáº£n pháº©m má»›i Ä‘á»ƒ táº¡o FOMO

**Components:**
- Reuse: `components/product/ProductCard.tsx`
- New: `components/home/NewArrivals.tsx` (wrapper)

**Ná»™i dung:**
- Section title: "ðŸ†• Sáº£n pháº©m má»›i nháº¥t"
- Grid: 2 cols mobile, 4 cols desktop
- Show 4-8 newest products
- "Xem táº¥t cáº£" link â†’ `/products?sort=newest`

**Design:**
- Similar to Featured Products
- "New" badge trÃªn product cards
- Sort by date (newest first)

**GraphQL Query:**
- Query products sorted by `date` DESC
- Limit: 8 products

---

### 5. **Best Sellers** (Sáº£n pháº©m bÃ¡n cháº¡y)
**Má»¥c Ä‘Ã­ch:** Social proof, show popular products

**Components:**
- Reuse: `components/product/ProductCard.tsx`
- New: `components/home/BestSellers.tsx` (wrapper)

**Ná»™i dung:**
- Section title: "ðŸ”¥ Sáº£n pháº©m bÃ¡n cháº¡y"
- Grid: 2 cols mobile, 4 cols desktop
- Show 4-8 best selling products
- "Xem táº¥t cáº£" link â†’ `/products?sort=popularity`

**Design:**
- Similar to Featured Products
- Optional: Show sales count hoáº·c "BÃ¡n cháº¡y" badge

**GraphQL Query:**
- Query products sorted by sales count hoáº·c popularity
- Limit: 8 products

---

### 6. **Categories Section** (Danh má»¥c sáº£n pháº©m) - UPDATED
**Má»¥c Ä‘Ã­ch:** GiÃºp users nhanh chÃ³ng tÃ¬m sáº£n pháº©m theo danh má»¥c

**Components:**
- `components/home/CategoryGrid.tsx` âœ…
- `components/home/CategoryCard.tsx` âœ…

**Ná»™i dung:**
- Grid hiá»ƒn thá»‹ 8 danh má»¥c chÃ­nh (4 cols x 2 rows trÃªn desktop, 2 cols trÃªn mobile)
- Má»—i card hiá»ƒn thá»‹:
  - Category image (aspect-square)
  - Category name
  - Product count (optional)

**Design:**
- Grid: **2 cols mobile, 4 cols desktop, 2 rows (8 categories)**
- Card vá»›i:
  - Category image (aspect-square)
  - Overlay gradient Ä‘á»ƒ text dá»… Ä‘á»c
  - Category name + count á»Ÿ bottom
  - Hover effect: scale + shadow
  - Touch-friendly (min 44x44px)

**GraphQL Query:**
- Query categories tá»« WordPress vá»›i image
- Limit: 8 categories

**Mobile Optimization:**
- 2 columns trÃªn mobile
- Touch-friendly cards
- Clear labels
- Easy navigation

---

## ðŸ› ï¸ Implementation Plan

### Phase 1: Core Sections (Priority 1)
1. âœ… Hero Section
2. âœ… **Categories Section** (4 cols x 2 rows desktop, 2 cols mobile) - **UPDATED**
3. âœ… Featured Products
4. âœ… New Arrivals
5. âœ… Best Sellers

### Removed Sections (per user request):
- âŒ Why Choose Us
- âŒ Testimonials
- âŒ Newsletter Signup
- âŒ Social Feed

---

## ðŸ“ Components cáº§n táº¡o

### New Components:
1. `components/home/HeroSection.tsx` âœ… **CREATED**
2. `components/home/CategoryGrid.tsx` âœ… **CREATED**
3. `components/home/CategoryCard.tsx` âœ… **CREATED**
4. `components/home/FeaturedProducts.tsx` âœ… **CREATED**
5. `components/home/NewArrivals.tsx` âœ… **CREATED**
6. `components/home/BestSellers.tsx` âœ… **CREATED**
7. `lib/hooks/useProductsForHome.ts` âœ… **CREATED** (new hook for homepage sections)

### Removed Components (per user request):
- âŒ `components/home/WhyChooseUs.tsx`
- âŒ `components/home/FeatureCard.tsx`
- âŒ `components/home/Testimonials.tsx`
- âŒ `components/home/TestimonialCard.tsx`
- âŒ `components/home/NewsletterSignup.tsx`
- âŒ `components/home/SocialFeed.tsx`

### Reuse Existing Components:
- `components/product/ProductCard.tsx`
- `components/ui/Button.tsx`
- `components/ui/Card.tsx`
- `components/ui/Input.tsx`

---

## ðŸ” API Implementation (REST API - Migrated from GraphQL)

### âœ… Implementation Status: **COMPLETED**

**Note:** ÄÃ£ migrate tá»« GraphQL sang WooCommerce REST API theo migration plan.

### 1. Get Categories âœ…
- **Hook:** `useCategoriesREST` (Ä‘Ã£ cÃ³ sáºµn)
- **Endpoint:** `/api/woocommerce/categories?per_page=8`
- **Used in:** `CategoryGrid.tsx`

### 2. Get Featured Products âœ…
- **Hook:** `useProductsForHome({ featured: true, per_page: 8 })`
- **Endpoint:** `/api/woocommerce/products?featured=true&per_page=8&status=publish`
- **Used in:** `FeaturedProducts.tsx`

### 3. Get New Products âœ…
- **Hook:** `useProductsForHome({ orderby: 'date', order: 'desc', per_page: 8 })`
- **Endpoint:** `/api/woocommerce/products?orderby=date&order=desc&per_page=8&status=publish`
- **Used in:** `NewArrivals.tsx`

### 4. Get Best Sellers âœ…
- **Hook:** `useProductsForHome({ orderby: 'popularity', order: 'desc', per_page: 8 })`
- **Endpoint:** `/api/woocommerce/products?orderby=popularity&order=desc&per_page=8&status=publish`
- **Used in:** `BestSellers.tsx`

---

## ðŸ“± Mobile-First Considerations

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

## ðŸŽ¨ Design Tokens

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

## âœ… Checklist Implementation

### Phase 1: Core Sections
- [x] Create `HeroSection.tsx` âœ… **COMPLETED**
- [x] Create `CategoryGrid.tsx` âœ… **COMPLETED**
- [x] Create `CategoryCard.tsx` âœ… **COMPLETED**
- [x] Update REST API query vá»›i category images âœ… **COMPLETED** (migrated to REST API)
- [x] Create `FeaturedProducts.tsx` âœ… **COMPLETED**
- [x] Create `NewArrivals.tsx` âœ… **COMPLETED**
- [x] Create `BestSellers.tsx` âœ… **COMPLETED**
- [x] Create `useProductsForHome.ts` hook âœ… **COMPLETED** (new hook for homepage)
- [x] Update `app/page.tsx` vá»›i cÃ¡c sections âœ… **COMPLETED**
- [ ] Test mobile responsiveness (pending manual test)
- [ ] Test REST API queries (pending manual test)

### Testing
- [ ] Test trÃªn mobile devices
- [ ] Test performance (Lighthouse)
- [ ] Test vá»›i real data tá»« WordPress
- [ ] Test error states
- [ ] Test loading states

---

## ðŸ“Š Success Metrics

- **Performance:** Lighthouse score > 90
- **Mobile UX:** Touch-friendly, fast load
- **Conversion:** Clear CTAs, easy navigation
- **SEO:** Proper headings, structured data

---

**Date:** 2024-12-20  
**Last Updated:** 2025-01-XX  
**Status:** âœ… **Implementation Complete** - All core sections implemented

## ðŸ“ Implementation Notes

### âœ… Completed:
- All 5 core sections implemented
- All components created and integrated
- REST API integration (migrated from GraphQL)
- Mobile-first responsive design
- Loading states with skeleton loaders
- Error handling (fail silently)
- Touch-friendly UI (min 44x44px)

### ðŸ”„ Migration Notes:
- **GraphQL â†’ REST API:** All queries migrated to WooCommerce REST API
- **New Hook:** `useProductsForHome` created specifically for homepage sections
- **API Routes:** Using existing `/api/woocommerce/*` proxy routes

### â³ Pending:
- Manual testing on mobile devices
- Performance testing (Lighthouse)
- Real data testing from WordPress
- Error state testing
- Loading state verification

# ðŸ“‹ PLAN: Homepage Design

**Note:** Gomi.vn Ä‘Æ°á»£c tham kháº£o cho design style, khÃ´ng pháº£i ná»™i dung website.

---

## ðŸŽ¯ Má»¥c tiÃªu

Thiáº¿t káº¿ homepage theo phong cÃ¡ch Gomi vá»›i:
- Clean, modern design
- Focus vÃ o products vá»›i clear CTAs
- Storytelling sections (videos, customer photos)
- Category-based product sections
- Emotional connection ("Cháº¡m vÃ o yÃªu thÆ°Æ¡ng")

---

## ðŸŽ¨ Design Concept (Gomi Style)

### Tone & Feel
- **Warm & Emotional:** Táº¡o cáº£m xÃºc áº¥m Ã¡p, thÃ¢n thiá»‡n
- **Clean & Modern:** Minimal design, focus vÃ o products
- **Trustworthy:** Customer photos, stories
- **Product-Focused:** Nhiá»u product sections vá»›i clear navigation

### Visual Elements
- **Hero Banner:** Carousel vá»›i 5-6 banners
- **Product Cards:** Image + Title + Price + Size options + "Mua ngay" button
- **Section Headers:** Clear titles vá»›i "Xem thÃªm" link
- **Customer Photos:** Social proof section
- **Video Section:** Storytelling
- **Blog/Stories:** Emotional connection section

### Color Palette
- **Primary:** Soft pastels (Pink, Blue) - giá»¯ nguyÃªn tá»« design system
- **Background:** Clean white
- **Text:** Dark gray cho readability
- **Accents:** Product images lÃ m Ä‘iá»ƒm nháº¥n

---

## ðŸ“ Cáº¥u trÃºc Homepage

### 1. **Hero Banner Carousel** â­ NEW
**Má»¥c Ä‘Ã­ch:** Táº¡o áº¥n tÆ°á»£ng Ä‘áº§u tiÃªn, showcase promotions

**Components:**
- `components/home/HeroCarousel.tsx`
- `components/home/HeroSlide.tsx`

**Ná»™i dung:**
- 5-6 banner slides
- Má»—i slide: Image + Headline + CTA button
- Auto-play vá»›i navigation dots
- Touch-friendly trÃªn mobile

**Design:**
- Full width
- Aspect ratio: 16:9 hoáº·c 21:9
- Overlay text vá»›i gradient
- "Mua ngay" button prominent

**Mobile:**
- Stack vertically hoáº·c single slide
- Touch swipe navigation

---

### 2. **Sáº£n pháº©m má»›i nháº¥t** âœ… (ÄÃ£ cÃ³)
**Má»¥c Ä‘Ã­ch:** Showcase new arrivals

**Components:**
- `components/home/NewArrivals.tsx` (Ä‘Ã£ cÃ³)

**Cáº£i tiáº¿n:**
- ThÃªm size options display
- "Mua ngay" button thay vÃ¬ chá»‰ link
- Grid: 2 cols mobile, 4-5 cols desktop

---

### 3. **Gáº¥u BÃ´ng Bigsize** â­ NEW
**Má»¥c Ä‘Ã­ch:** Highlight bigsize products (high value)

**Components:**
- `components/home/BigsizeProducts.tsx`

**Ná»™i dung:**
- Filter products by size (>= 80cm)
- Show 4-6 products
- Emphasize size options
- "Xem thÃªm" â†’ `/products?size=bigsize`

**Design:**
- Similar to New Arrivals
- Highlight size prominently
- "Bigsize" badge

---

### 4. **Gáº¥u Teddy** â­ NEW
**Má»¥c Ä‘Ã­ch:** Category-based section

**Components:**
- `components/home/CategoryProducts.tsx` (reusable)

**Ná»™i dung:**
- Products tá»« category "Gáº¥u Teddy"
- Show 4-6 products
- "Xem thÃªm" â†’ `/products?category=teddy`

---

### 5. **ThÃº BÃ´ng Hot** â­ NEW
**Má»¥c Ä‘Ã­ch:** Showcase trending/popular products

**Components:**
- `components/home/TrendingProducts.tsx`

**Ná»™i dung:**
- Best sellers hoáº·c featured products
- Show 4-6 products
- "Hot" badge
- "Xem thÃªm" â†’ `/products?sort=popularity`

---

### 6. **HÃ¬nh áº£nh khÃ¡ch hÃ ng** â­ NEW
**Má»¥c Ä‘Ã­ch:** Social proof, build trust

**Components:**
- `components/home/CustomerPhotos.tsx`

**Ná»™i dung:**
- Grid of customer photos (Instagram style)
- 6-8 photos
- Optional: Link to Instagram hoáº·c gallery
- Caption: "Cáº£m Æ¡n báº¡n Ä‘Ã£ tin yÃªu vÃ  Ä‘á»“ng hÃ nh cÃ¹ng Shop Gáº¥u BÃ´ng"

**Design:**
- Masonry grid hoáº·c square grid
- Hover effect: show caption
- Click to view larger

**Data Source:**
- Static images (placeholder) hoáº·c
- Instagram API (future)
- Manual uploads

---

### 7. **Video Section** â­ NEW
**Má»¥c Ä‘Ã­ch:** Storytelling, brand connection

**Components:**
- `components/home/VideoSection.tsx`

**Ná»™i dung:**
- Featured video (YouTube embed)
- Title: "VIDEO Táº I SHOP Gáº¤U BÃ”NG"
- Description: "NÆ¡i khÃ¡m phÃ¡ nhá»¯ng cÃ¢u chuyá»‡n vá» táº¥t cáº£ sáº£n pháº©m"
- "Xem thÃªm" link â†’ YouTube channel

**Design:**
- Video player vá»›i thumbnail
- Responsive (16:9 aspect ratio)
- Play button overlay

---

### 8. **Stories/Blog Section** â­ NEW
**Má»¥c Ä‘Ã­ch:** Emotional connection, content marketing

**Components:**
- `components/home/StoriesSection.tsx`
- `components/home/StoryCard.tsx`

**Ná»™i dung:**
- 3-4 featured blog posts/stories
- Title: "CÃ‚U CHUYá»†N YÃŠU THÆ¯Æ NG"
- Each story: Image + Title + Excerpt + "Xem thÃªm"
- Stories vá»:
  - Thiá»‡n nguyá»‡n
  - Customer stories
  - Product stories
  - Brand values

**Design:**
- Card layout
- Large featured image
- Readable typography
- "Xem thÃªm" â†’ `/blog/posts`

---

### 9. **Há»‡ thá»‘ng cá»­a hÃ ng** â­ NEW
**Má»¥c Ä‘Ã­ch:** Local presence, trust

**Components:**
- `components/home/StoreLocations.tsx`

**Ná»™i dung:**
- List of store locations
- Address, phone, hours
- Map integration (optional)
- "Xem thÃªm" â†’ `/contact` hoáº·c `/stores`

**Design:**
- Clean list hoáº·c cards
- Icon for location
- Click to expand details

---

### 10. **Categories Grid** âœ… (ÄÃ£ cÃ³)
**Má»¥c Ä‘Ã­ch:** Quick navigation to categories

**Components:**
- `components/home/CategoryGrid.tsx` (Ä‘Ã£ cÃ³)

**Cáº£i tiáº¿n:**
- Giá»¯ nguyÃªn design hiá»‡n táº¡i
- CÃ³ thá»ƒ move xuá»‘ng dÆ°á»›i náº¿u cáº§n

---

## ðŸ› ï¸ Implementation Plan

### Phase 1: Core Sections (Priority 1)
1. âœ… Hero Banner Carousel
2. âœ… Sáº£n pháº©m má»›i nháº¥t (cáº£i tiáº¿n)
3. âœ… Gáº¥u BÃ´ng Bigsize
4. âœ… Gáº¥u Teddy (category products)
5. âœ… ThÃº BÃ´ng Hot (trending)

### Phase 2: Engagement Sections (Priority 2)
6. âœ… HÃ¬nh áº£nh khÃ¡ch hÃ ng
7. âœ… Video Section
8. âœ… Stories/Blog Section

### Phase 3: Trust & Contact (Priority 3)
9. âœ… Há»‡ thá»‘ng cá»­a hÃ ng
10. âœ… Categories Grid (giá»¯ nguyÃªn)

---

## ðŸ“ Components cáº§n táº¡o

### New Components:
1. `components/home/HeroCarousel.tsx` â­
2. `components/home/HeroSlide.tsx` â­
3. `components/home/BigsizeProducts.tsx` â­
4. `components/home/CategoryProducts.tsx` â­ (reusable)
5. `components/home/TrendingProducts.tsx` â­
6. `components/home/CustomerPhotos.tsx` â­
7. `components/home/VideoSection.tsx` â­
8. `components/home/StoriesSection.tsx` â­
9. `components/home/StoryCard.tsx` â­
10. `components/home/StoreLocations.tsx` â­

### Update Existing:
- `components/home/NewArrivals.tsx` - Add size options, "Mua ngay" button
- `components/home/FeaturedProducts.tsx` - Similar updates
- `components/home/BestSellers.tsx` - Similar updates
- `components/product/ProductCard.tsx` - Add size options display

---

## ðŸŽ¨ Design Details

### Hero Carousel
```tsx
// Features:
- Auto-play (5s interval)
- Navigation dots
- Prev/Next arrows
- Touch swipe (mobile)
- Pause on hover
- Responsive images
```

### Product Cards (Enhanced)
```tsx
// Add:
- Size options display (30cm, 50cm, 80cm, 1m)
- "Mua ngay" button (prominent)
- Price display (large, clear)
- "Hot", "New", "Sale" badges
```

### Section Headers
```tsx
// Pattern:
<div className="flex items-center justify-between mb-6">
  <h2 className="font-heading text-xl md:text-3xl">
    â­ Section Title
  </h2>
  <Link href="..." className="text-sm text-primary hover:underline">
    Xem thÃªm â†’
  </Link>
</div>
```

### Customer Photos Grid
```tsx
// Layout:
- Grid: 3 cols mobile, 4-5 cols desktop
- Square images (aspect-square)
- Hover: show overlay with caption
- Click: open lightbox (optional)
```

### Video Section
```tsx
// Features:
- YouTube embed (responsive)
- Thumbnail vá»›i play button
- Title + description
- "Xem thÃªm" link
```

### Stories Section
```tsx
// Layout:
- Grid: 1 col mobile, 3 cols desktop
- Card vá»›i:
  - Featured image (aspect-16:9)
  - Title
  - Excerpt (2-3 lines)
  - "Xem thÃªm" link
```

---

## ðŸ“± Mobile-First Considerations

### Layout:
- Stack sections vertically
- Full-width sections
- Generous padding (`py-8 md:py-16`)
- Touch-friendly buttons (min 44x44px)

### Hero Carousel:
- Single slide on mobile
- Swipe navigation
- Dots navigation

### Product Grids:
- 2 cols mobile
- 4-5 cols desktop
- Horizontal scroll option (optional)

### Typography:
- H1: `text-2xl` mobile, `text-4xl` desktop
- H2: `text-xl` mobile, `text-3xl` desktop
- Body: `text-[15px]` (readable)

---

## ðŸ” API Requirements

### Products API:
- Filter by size (bigsize >= 80cm)
- Filter by category (teddy, thÃº bÃ´ng)
- Sort by popularity/trending
- Include size options in response

### Blog API (Optional):
- Featured posts
- Limit: 3-4 posts
- Include featured image, title, excerpt

### Store Locations:
- Static data (JSON file) hoáº·c
- WordPress custom post type

---

## ðŸ“Š Content Strategy

### Hero Banners:
1. "ChÃ o má»«ng Ä‘áº¿n Shop Gáº¥u BÃ´ng"
2. "Gáº¥u BÃ´ng Bigsize - QuÃ  táº·ng Ã½ nghÄ©a"
3. "Gáº¥u BÃ´ng Valentine - Tá» tÃ¬nh ngá»t ngÃ o"
4. "Gáº¥u BÃ´ng Sinh Nháº­t - MÃ³n quÃ  hoÃ n háº£o"
5. "Miá»…n phÃ­ váº­n chuyá»ƒn toÃ n quá»‘c"

### Customer Photos:
- Placeholder images (6-8 photos)
- Future: Instagram integration
- Captions: Customer testimonials

### Video:
- YouTube video ID
- Title: "VIDEO Táº I SHOP Gáº¤U BÃ”NG"
- Description: Brand story

### Stories:
- Featured blog posts
- Topics: Thiá»‡n nguyá»‡n, Customer stories, Product stories

---

## âœ… Implementation Checklist

### Phase 1: Core Sections
- [x] Create `HeroCarousel.tsx` âœ… **COMPLETED**
- [x] Create `HeroSlide.tsx` âœ… **COMPLETED**
- [x] Update `ProductCard.tsx` (add size options, "Mua ngay" button) âœ… **COMPLETED**
- [x] Create `BigsizeProducts.tsx` âœ… **COMPLETED**
- [x] Create `CategoryProducts.tsx` (reusable) âœ… **COMPLETED**
- [x] Create `TrendingProducts.tsx` âœ… **COMPLETED**
- [x] Update `app/page.tsx` vá»›i new sections âœ… **COMPLETED**

### Phase 1 Status: âœ… **COMPLETED**

### Phase 2: Engagement Sections
- [x] Create `CustomerPhotos.tsx` âœ… **COMPLETED**
- [x] Create `VideoSection.tsx` âœ… **COMPLETED**
- [x] Create `StoriesSection.tsx` âœ… **COMPLETED**
- [x] Create `StoryCard.tsx` âœ… **COMPLETED**
- [x] Update `app/page.tsx` vá»›i Phase 2 sections âœ… **COMPLETED**

### Phase 2 Status: âœ… **COMPLETED**

### Phase 3: Trust & Contact
- [x] Create `StoreLocations.tsx` âœ… **COMPLETED**
- [x] Update `app/page.tsx` vá»›i StoreLocations section âœ… **COMPLETED**

### Phase 3 Status: âœ… **COMPLETED**

### Enhancements
- [ ] Update `ProductCard.tsx` vá»›i size options
- [ ] Add "Mua ngay" button to product cards
- [ ] Add product badges (Hot, New, Sale)
- [ ] Test mobile responsiveness
- [ ] Test performance

---

## ðŸŽ¯ Success Metrics

- **Visual Appeal:** Clean, modern aesthetic
- **User Engagement:** Clear CTAs, easy navigation
- **Mobile UX:** Touch-friendly, fast load
- **Conversion:** Product-focused sections drive sales
- **Emotional Connection:** Stories, customer photos build trust

---

## ðŸ“ Notes

### Brand Identity:
- **Brand:** "Shop Gáº¥u BÃ´ng"
- **Slogan:** TÃ¹y chá»‰nh theo brand identity
- **Content:** Stories vÃ  videos phÃ¹ há»£p vá»›i brand

### Technical Considerations:
- **Performance:** Lazy load sections below fold
- **Images:** Optimize hero banners vÃ  product images
- **Video:** Use YouTube embed (lightweight)
- **Customer Photos:** Start with static images, upgrade to API later

---

**Date:** 2025-01-XX  
**Last Updated:** 2025-01-XX  
**Status:** âœ… **ALL PHASES COMPLETE - Homepage Ready!**

## ðŸ“ Implementation Notes

### âœ… Phase 1 Completed (2025-01-XX)

**Components Created:**
1. âœ… `HeroCarousel.tsx` - Banner carousel vá»›i auto-play, navigation
2. âœ… `HeroSlide.tsx` - Individual slide component
3. âœ… `BigsizeProducts.tsx` - Bigsize products section (>= 80cm)
4. âœ… `CategoryProducts.tsx` - Reusable category products section
5. âœ… `TrendingProducts.tsx` - Hot/trending products section

**Components Updated:**
1. âœ… `ProductCard.tsx` - Added size options display, "Mua ngay" button, "Xem chi tiáº¿t" link
2. âœ… `app/page.tsx` - Updated vá»›i Hero Carousel vÃ  new sections

**Features:**
- Hero carousel vá»›i 5 slides (placeholder images)
- Auto-play vá»›i pause on hover
- Navigation dots vÃ  arrows
- Product cards vá»›i size display vÃ  dual buttons
- Bigsize filtering (>= 80cm)
- Category-based sections (reusable)
- Trending products section

**Phase 2 Completed (2025-01-XX):**

**Components Created:**
1. âœ… `CustomerPhotos.tsx` - Instagram-style grid vá»›i lightbox (âš ï¸ Removed from homepage)
2. âœ… `VideoSection.tsx` - YouTube embed vá»›i thumbnail vÃ  play button
3. âœ… `StoriesSection.tsx` - Featured blog posts section
4. âœ… `StoryCard.tsx` - Individual story card component

**Features:**
- ~~Customer photos grid vá»›i hover effects vÃ  lightbox modal~~ (Removed)
- YouTube video embed vá»›i lazy loading (chá»‰ load khi play)
- Stories section vá»›i placeholder data (ready for API integration)
- All sections mobile-responsive vÃ  touch-friendly

**Update (2025-01-XX):** Customer Photos section Ä‘Ã£ Ä‘Æ°á»£c loáº¡i bá» khá»i homepage theo yÃªu cáº§u.

**Phase 3 Completed (2025-01-XX):**

**Components Created:**
1. âœ… `StoreLocations.tsx` - Store locations vá»›i address, phone, hours, map links

**Features:**
- Group stores by city
- Address, phone (clickable), hours display
- Google Maps links (optional)
- Responsive grid layout
- "Xem thÃªm" link to contact page

**Final Homepage Structure:**
1. Hero Banner Carousel
2. Sáº£n pháº©m má»›i nháº¥t
3. Gáº¥u BÃ´ng Bigsize
4. Gáº¥u Teddy
5. ThÃº BÃ´ng Hot
6. Categories Grid
7. Featured Products
8. Best Sellers
9. Video Section
10. Stories Section
11. Store Locations

**Note:** Customer Photos section Ä‘Ã£ Ä‘Æ°á»£c loáº¡i bá» theo yÃªu cáº§u.

**Next Steps (Post-Implementation):**
- Replace placeholder images vá»›i real images:
  - Hero banners: `/images/hero-1.jpg` Ä‘áº¿n `hero-5.jpg`
  - Stories: `/images/story-1.jpg` Ä‘áº¿n `story-3.jpg`
  - ~~Customer photos: `/images/customer-1.jpg` Ä‘áº¿n `customer-6.jpg`~~ (Removed)
- Set up environment variables:
  - `NEXT_PUBLIC_YOUTUBE_VIDEO_ID`
  - `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL`
- Update store locations vá»›i real data
- Integrate stories API khi blog functionality ready
- Optimize performance (lazy load sections below fold)
- Test mobile responsiveness
- Test performance vá»›i Lighthouse

**Reference:** [Gomi.vn](https://gomi.vn/)

