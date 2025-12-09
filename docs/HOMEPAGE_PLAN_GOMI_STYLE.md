# 📋 PLAN: Homepage Design

**Note:** Gomi.vn được tham khảo cho design style, không phải nội dung website.

---

## 🎯 Mục tiêu

Thiết kế homepage theo phong cách Gomi với:
- Clean, modern design
- Focus vào products với clear CTAs
- Storytelling sections (videos, customer photos)
- Category-based product sections
- Emotional connection ("Chạm vào yêu thương")

---

## 🎨 Design Concept (Gomi Style)

### Tone & Feel
- **Warm & Emotional:** Tạo cảm xúc ấm áp, thân thiện
- **Clean & Modern:** Minimal design, focus vào products
- **Trustworthy:** Customer photos, stories
- **Product-Focused:** Nhiều product sections với clear navigation

### Visual Elements
- **Hero Banner:** Carousel với 5-6 banners
- **Product Cards:** Image + Title + Price + Size options + "Mua ngay" button
- **Section Headers:** Clear titles với "Xem thêm" link
- **Customer Photos:** Social proof section
- **Video Section:** Storytelling
- **Blog/Stories:** Emotional connection section

### Color Palette
- **Primary:** Soft pastels (Pink, Blue) - giữ nguyên từ design system
- **Background:** Clean white
- **Text:** Dark gray cho readability
- **Accents:** Product images làm điểm nhấn

---

## 📐 Cấu trúc Homepage

### 1. **Hero Banner Carousel** ⭐ NEW
**Mục đích:** Tạo ấn tượng đầu tiên, showcase promotions

**Components:**
- `components/home/HeroCarousel.tsx`
- `components/home/HeroSlide.tsx`

**Nội dung:**
- 5-6 banner slides
- Mỗi slide: Image + Headline + CTA button
- Auto-play với navigation dots
- Touch-friendly trên mobile

**Design:**
- Full width
- Aspect ratio: 16:9 hoặc 21:9
- Overlay text với gradient
- "Mua ngay" button prominent

**Mobile:**
- Stack vertically hoặc single slide
- Touch swipe navigation

---

### 2. **Sản phẩm mới nhất** ✅ (Đã có)
**Mục đích:** Showcase new arrivals

**Components:**
- `components/home/NewArrivals.tsx` (đã có)

**Cải tiến:**
- Thêm size options display
- "Mua ngay" button thay vì chỉ link
- Grid: 2 cols mobile, 4-5 cols desktop

---

### 3. **Gấu Bông Bigsize** ⭐ NEW
**Mục đích:** Highlight bigsize products (high value)

**Components:**
- `components/home/BigsizeProducts.tsx`

**Nội dung:**
- Filter products by size (>= 80cm)
- Show 4-6 products
- Emphasize size options
- "Xem thêm" → `/products?size=bigsize`

**Design:**
- Similar to New Arrivals
- Highlight size prominently
- "Bigsize" badge

---

### 4. **Gấu Teddy** ⭐ NEW
**Mục đích:** Category-based section

**Components:**
- `components/home/CategoryProducts.tsx` (reusable)

**Nội dung:**
- Products từ category "Gấu Teddy"
- Show 4-6 products
- "Xem thêm" → `/products?category=teddy`

---

### 5. **Thú Bông Hot** ⭐ NEW
**Mục đích:** Showcase trending/popular products

**Components:**
- `components/home/TrendingProducts.tsx`

**Nội dung:**
- Best sellers hoặc featured products
- Show 4-6 products
- "Hot" badge
- "Xem thêm" → `/products?sort=popularity`

---

### 6. **Hình ảnh khách hàng** ⭐ NEW
**Mục đích:** Social proof, build trust

**Components:**
- `components/home/CustomerPhotos.tsx`

**Nội dung:**
- Grid of customer photos (Instagram style)
- 6-8 photos
- Optional: Link to Instagram hoặc gallery
- Caption: "Cảm ơn bạn đã tin yêu và đồng hành cùng Shop Gấu Bông"

**Design:**
- Masonry grid hoặc square grid
- Hover effect: show caption
- Click to view larger

**Data Source:**
- Static images (placeholder) hoặc
- Instagram API (future)
- Manual uploads

---

### 7. **Video Section** ⭐ NEW
**Mục đích:** Storytelling, brand connection

**Components:**
- `components/home/VideoSection.tsx`

**Nội dung:**
- Featured video (YouTube embed)
- Title: "VIDEO TẠI SHOP GẤU BÔNG"
- Description: "Nơi khám phá những câu chuyện về tất cả sản phẩm"
- "Xem thêm" link → YouTube channel

**Design:**
- Video player với thumbnail
- Responsive (16:9 aspect ratio)
- Play button overlay

---

### 8. **Stories/Blog Section** ⭐ NEW
**Mục đích:** Emotional connection, content marketing

**Components:**
- `components/home/StoriesSection.tsx`
- `components/home/StoryCard.tsx`

**Nội dung:**
- 3-4 featured blog posts/stories
- Title: "CÂU CHUYỆN YÊU THƯƠNG"
- Each story: Image + Title + Excerpt + "Xem thêm"
- Stories về:
  - Thiện nguyện
  - Customer stories
  - Product stories
  - Brand values

**Design:**
- Card layout
- Large featured image
- Readable typography
- "Xem thêm" → `/blog/posts`

---

### 9. **Hệ thống cửa hàng** ⭐ NEW
**Mục đích:** Local presence, trust

**Components:**
- `components/home/StoreLocations.tsx`

**Nội dung:**
- List of store locations
- Address, phone, hours
- Map integration (optional)
- "Xem thêm" → `/contact` hoặc `/stores`

**Design:**
- Clean list hoặc cards
- Icon for location
- Click to expand details

---

### 10. **Categories Grid** ✅ (Đã có)
**Mục đích:** Quick navigation to categories

**Components:**
- `components/home/CategoryGrid.tsx` (đã có)

**Cải tiến:**
- Giữ nguyên design hiện tại
- Có thể move xuống dưới nếu cần

---

## 🛠️ Implementation Plan

### Phase 1: Core Sections (Priority 1)
1. ✅ Hero Banner Carousel
2. ✅ Sản phẩm mới nhất (cải tiến)
3. ✅ Gấu Bông Bigsize
4. ✅ Gấu Teddy (category products)
5. ✅ Thú Bông Hot (trending)

### Phase 2: Engagement Sections (Priority 2)
6. ✅ Hình ảnh khách hàng
7. ✅ Video Section
8. ✅ Stories/Blog Section

### Phase 3: Trust & Contact (Priority 3)
9. ✅ Hệ thống cửa hàng
10. ✅ Categories Grid (giữ nguyên)

---

## 📝 Components cần tạo

### New Components:
1. `components/home/HeroCarousel.tsx` ⭐
2. `components/home/HeroSlide.tsx` ⭐
3. `components/home/BigsizeProducts.tsx` ⭐
4. `components/home/CategoryProducts.tsx` ⭐ (reusable)
5. `components/home/TrendingProducts.tsx` ⭐
6. `components/home/CustomerPhotos.tsx` ⭐
7. `components/home/VideoSection.tsx` ⭐
8. `components/home/StoriesSection.tsx` ⭐
9. `components/home/StoryCard.tsx` ⭐
10. `components/home/StoreLocations.tsx` ⭐

### Update Existing:
- `components/home/NewArrivals.tsx` - Add size options, "Mua ngay" button
- `components/home/FeaturedProducts.tsx` - Similar updates
- `components/home/BestSellers.tsx` - Similar updates
- `components/product/ProductCard.tsx` - Add size options display

---

## 🎨 Design Details

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
    ⭐ Section Title
  </h2>
  <Link href="..." className="text-sm text-primary hover:underline">
    Xem thêm →
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
- Thumbnail với play button
- Title + description
- "Xem thêm" link
```

### Stories Section
```tsx
// Layout:
- Grid: 1 col mobile, 3 cols desktop
- Card với:
  - Featured image (aspect-16:9)
  - Title
  - Excerpt (2-3 lines)
  - "Xem thêm" link
```

---

## 📱 Mobile-First Considerations

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

## 🔍 API Requirements

### Products API:
- Filter by size (bigsize >= 80cm)
- Filter by category (teddy, thú bông)
- Sort by popularity/trending
- Include size options in response

### Blog API (Optional):
- Featured posts
- Limit: 3-4 posts
- Include featured image, title, excerpt

### Store Locations:
- Static data (JSON file) hoặc
- WordPress custom post type

---

## 📊 Content Strategy

### Hero Banners:
1. "Chào mừng đến Shop Gấu Bông"
2. "Gấu Bông Bigsize - Quà tặng ý nghĩa"
3. "Gấu Bông Valentine - Tỏ tình ngọt ngào"
4. "Gấu Bông Sinh Nhật - Món quà hoàn hảo"
5. "Miễn phí vận chuyển toàn quốc"

### Customer Photos:
- Placeholder images (6-8 photos)
- Future: Instagram integration
- Captions: Customer testimonials

### Video:
- YouTube video ID
- Title: "VIDEO TẠI SHOP GẤU BÔNG"
- Description: Brand story

### Stories:
- Featured blog posts
- Topics: Thiện nguyện, Customer stories, Product stories

---

## ✅ Implementation Checklist

### Phase 1: Core Sections
- [x] Create `HeroCarousel.tsx` ✅ **COMPLETED**
- [x] Create `HeroSlide.tsx` ✅ **COMPLETED**
- [x] Update `ProductCard.tsx` (add size options, "Mua ngay" button) ✅ **COMPLETED**
- [x] Create `BigsizeProducts.tsx` ✅ **COMPLETED**
- [x] Create `CategoryProducts.tsx` (reusable) ✅ **COMPLETED**
- [x] Create `TrendingProducts.tsx` ✅ **COMPLETED**
- [x] Update `app/page.tsx` với new sections ✅ **COMPLETED**

### Phase 1 Status: ✅ **COMPLETED**

### Phase 2: Engagement Sections
- [x] Create `CustomerPhotos.tsx` ✅ **COMPLETED**
- [x] Create `VideoSection.tsx` ✅ **COMPLETED**
- [x] Create `StoriesSection.tsx` ✅ **COMPLETED**
- [x] Create `StoryCard.tsx` ✅ **COMPLETED**
- [x] Update `app/page.tsx` với Phase 2 sections ✅ **COMPLETED**

### Phase 2 Status: ✅ **COMPLETED**

### Phase 3: Trust & Contact
- [x] Create `StoreLocations.tsx` ✅ **COMPLETED**
- [x] Update `app/page.tsx` với StoreLocations section ✅ **COMPLETED**

### Phase 3 Status: ✅ **COMPLETED**

### Enhancements
- [ ] Update `ProductCard.tsx` với size options
- [ ] Add "Mua ngay" button to product cards
- [ ] Add product badges (Hot, New, Sale)
- [ ] Test mobile responsiveness
- [ ] Test performance

---

## 🎯 Success Metrics

- **Visual Appeal:** Clean, modern aesthetic
- **User Engagement:** Clear CTAs, easy navigation
- **Mobile UX:** Touch-friendly, fast load
- **Conversion:** Product-focused sections drive sales
- **Emotional Connection:** Stories, customer photos build trust

---

## 📝 Notes

### Brand Identity:
- **Brand:** "Shop Gấu Bông"
- **Slogan:** Tùy chỉnh theo brand identity
- **Content:** Stories và videos phù hợp với brand

### Technical Considerations:
- **Performance:** Lazy load sections below fold
- **Images:** Optimize hero banners và product images
- **Video:** Use YouTube embed (lightweight)
- **Customer Photos:** Start with static images, upgrade to API later

---

**Date:** 2025-01-XX  
**Last Updated:** 2025-01-XX  
**Status:** ✅ **ALL PHASES COMPLETE - Homepage Ready!**

## 📝 Implementation Notes

### ✅ Phase 1 Completed (2025-01-XX)

**Components Created:**
1. ✅ `HeroCarousel.tsx` - Banner carousel với auto-play, navigation
2. ✅ `HeroSlide.tsx` - Individual slide component
3. ✅ `BigsizeProducts.tsx` - Bigsize products section (>= 80cm)
4. ✅ `CategoryProducts.tsx` - Reusable category products section
5. ✅ `TrendingProducts.tsx` - Hot/trending products section

**Components Updated:**
1. ✅ `ProductCard.tsx` - Added size options display, "Mua ngay" button, "Xem chi tiết" link
2. ✅ `app/page.tsx` - Updated với Hero Carousel và new sections

**Features:**
- Hero carousel với 5 slides (placeholder images)
- Auto-play với pause on hover
- Navigation dots và arrows
- Product cards với size display và dual buttons
- Bigsize filtering (>= 80cm)
- Category-based sections (reusable)
- Trending products section

**Phase 2 Completed (2025-01-XX):**

**Components Created:**
1. ✅ `CustomerPhotos.tsx` - Instagram-style grid với lightbox (⚠️ Removed from homepage)
2. ✅ `VideoSection.tsx` - YouTube embed với thumbnail và play button
3. ✅ `StoriesSection.tsx` - Featured blog posts section
4. ✅ `StoryCard.tsx` - Individual story card component

**Features:**
- ~~Customer photos grid với hover effects và lightbox modal~~ (Removed)
- YouTube video embed với lazy loading (chỉ load khi play)
- Stories section với placeholder data (ready for API integration)
- All sections mobile-responsive và touch-friendly

**Update (2025-01-XX):** Customer Photos section đã được loại bỏ khỏi homepage theo yêu cầu.

**Phase 3 Completed (2025-01-XX):**

**Components Created:**
1. ✅ `StoreLocations.tsx` - Store locations với address, phone, hours, map links

**Features:**
- Group stores by city
- Address, phone (clickable), hours display
- Google Maps links (optional)
- Responsive grid layout
- "Xem thêm" link to contact page

**Final Homepage Structure:**
1. Hero Banner Carousel
2. Sản phẩm mới nhất
3. Gấu Bông Bigsize
4. Gấu Teddy
5. Thú Bông Hot
6. Categories Grid
7. Featured Products
8. Best Sellers
9. Video Section
10. Stories Section
11. Store Locations

**Note:** Customer Photos section đã được loại bỏ theo yêu cầu.

**Next Steps (Post-Implementation):**
- Replace placeholder images với real images:
  - Hero banners: `/images/hero-1.jpg` đến `hero-5.jpg`
  - Stories: `/images/story-1.jpg` đến `story-3.jpg`
  - ~~Customer photos: `/images/customer-1.jpg` đến `customer-6.jpg`~~ (Removed)
- Set up environment variables:
  - `NEXT_PUBLIC_YOUTUBE_VIDEO_ID`
  - `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL`
- Update store locations với real data
- Integrate stories API khi blog functionality ready
- Optimize performance (lazy load sections below fold)
- Test mobile responsiveness
- Test performance với Lighthouse

**Reference:** [Gomi.vn](https://gomi.vn/)

