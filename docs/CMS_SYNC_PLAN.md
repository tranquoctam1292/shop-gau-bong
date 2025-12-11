# 📋 Kế Hoạch Đồng Bộ Chức Năng CMS từ fullcode.txt

**Ngày tạo:** 2025-01-XX  
**Status:** Planning  
**Mục tiêu:** Đồng bộ tất cả chức năng CMS từ `fullcode.txt` vào CMS admin hiện tại

---

## 📊 TỔNG QUAN SO SÁNH

### ✅ CMS Hiện Tại (Đã Triển Khai)

| Module | Trạng thái | Chức năng |
|--------|-----------|-----------|
| **Dashboard** | ✅ Hoàn thành | Basic stats (products, orders, categories, revenue) |
| **Products** | ✅ Cơ bản | List, Search, View, Delete (thiếu Create/Edit form) |
| **Orders** | ✅ Cơ bản | List, Search, View (thiếu Edit status, Detail page) |
| **Categories** | ✅ Cơ bản | List, Search, Delete (thiếu Create/Edit form) |
| **Authentication** | ✅ Hoàn thành | Login, Session management, Protected routes |

### ❌ CMS Từ fullcode.txt (Chưa Triển Khai)

| Module | Ưu tiên | Chức năng chính |
|--------|---------|-----------------|
| **Blog System** | 🔴 Cao | Posts CRUD, Tiptap editor, Author system, Comment moderation |
| **Homepage Builder** | 🔴 Cao | Drag & drop sections, 15+ section types, Live preview |
| **SEO Tools** | 🟡 Trung bình | Keyword tracking, Schema.org, Sitemap, 404 tracking |
| **Analytics** | 🟡 Trung bình | Analytics dashboard, Charts, Reports |
| **Media Library** | 🟡 Trung bình | Image upload, Vercel Blob, Media management |
| **Pages** | 🟢 Thấp | Static pages management |
| **Authors** | 🟢 Thấp | Author CRUD, E-E-A-T system |
| **Comments** | 🟢 Thấp | Comment moderation, Spam detection |
| **Contacts** | 🟢 Thấp | Contact form submissions |
| **Marketing** | 🟢 Thấp | Coupons, Promotions |
| **Payments** | 🟢 Thấp | Payment gateways management |
| **Appearance** | 🟢 Thấp | Background, Customize, Widgets |
| **Products Advanced** | 🟡 Trung bình | Brands, Reviews, Tags |
| **Settings** | 🟡 Trung bình | System settings, Security config |

---

## 🎯 KẾ HOẠCH TRIỂN KHAI (6 Phases)

### **Phase 1: Hoàn Thiện Core Features (Ưu tiên cao)**

**Mục tiêu:** Hoàn thiện các chức năng cơ bản đã có nhưng chưa đầy đủ

#### 1.1. Products Management Enhancement
- [ ] **Create Product Form** (`/admin/products/new`)
  - Form với tất cả fields (name, description, price, images, variants, etc.)
  - Image upload (Vercel Blob hoặc local)
  - Variant management (size, color, price, stock)
  - Category selection
  - SEO fields (meta title, description, keywords)
  - Save as draft / Publish

- [ ] **Edit Product Form** (`/admin/products/[id]/edit`)
  - Tương tự Create form
  - Load existing data
  - Update variants
  - Image management (add/remove/reorder)

- [ ] **Product Detail Page** (`/admin/products/[id]`)
  - Full product information display
  - Variants table
  - Stock management
  - Quick actions (duplicate, delete, publish/unpublish)

#### 1.2. Orders Management Enhancement
- [ ] **Order Detail Page** (`/admin/orders/[id]`)
  - Full order information
  - Customer details
  - Shipping address
  - Payment info
  - Order items table
  - Status update form
  - Notes/History timeline

- [ ] **Order Status Management**
  - Status dropdown (pending, processing, completed, cancelled)
  - Bulk status update
  - Email notifications on status change

#### 1.3. Categories Management Enhancement
- [ ] **Create Category Form** (`/admin/categories/new`)
  - Name, slug, description
  - Parent category selection
  - Image upload
  - SEO fields

- [ ] **Edit Category Form** (`/admin/categories/[id]/edit`)
  - Load existing data
  - Update hierarchy

**Thời gian ước tính:** 1-2 tuần  
**Files cần tạo:**
- `app/admin/products/new/page.tsx`
- `app/admin/products/[id]/edit/page.tsx`
- `app/admin/products/[id]/page.tsx`
- `app/admin/orders/[id]/page.tsx`
- `app/admin/categories/new/page.tsx`
- `app/admin/categories/[id]/edit/page.tsx`
- `components/admin/ProductForm.tsx`
- `components/admin/CategoryForm.tsx`
- `components/admin/OrderDetail.tsx`

---

### **Phase 2: Blog System (Ưu tiên cao)**

**Mục tiêu:** Triển khai hệ thống blog với Tiptap editor

#### 2.1. Database Setup
- [ ] **Collections:**
  - `posts` - Blog posts
  - `authors` - Authors (E-E-A-T)
  - `comments` - Comments với spam detection
  - `post_categories` - Blog categories
  - `post_tags` - Blog tags

#### 2.2. API Routes
- [ ] **Posts API** (`/api/admin/posts`)
  - GET - List posts với filters
  - POST - Create post
  - GET `[id]` - Get single post
  - PUT `[id]` - Update post
  - DELETE `[id]` - Delete post
  - POST `[id]/publish` - Publish post
  - POST `[id]/duplicate` - Duplicate post

- [ ] **Authors API** (`/api/admin/authors`)
  - CRUD operations
  - Author profile management

- [ ] **Comments API** (`/api/admin/comments`)
  - List comments với filters
  - Approve/Reject/Delete
  - Spam detection

#### 2.3. Admin Pages
- [ ] **Posts List** (`/admin/posts`)
  - Table với filters (status, category, author, date)
  - Search functionality
  - Bulk actions (delete, publish, unpublish)
  - Quick edit

- [ ] **Post Editor** (`/admin/posts/new`, `/admin/posts/[id]/edit`)
  - Tiptap rich text editor
  - Featured image upload
  - Category/Tag selection
  - Author assignment
  - SEO panel
  - Preview mode
  - Save draft / Publish

- [ ] **Authors Management** (`/admin/authors`)
  - List authors
  - Create/Edit author
  - Author profile (name, bio, avatar, social links)

- [ ] **Comments Moderation** (`/admin/comments`)
  - Comment list với filters
  - Approve/Reject/Spam actions
  - Comment detail view

#### 2.4. Public API Routes
- [ ] **Public Posts API** (`/api/cms/posts`)
  - GET - List published posts
  - GET `[slug]` - Get single post
  - GET `categories` - List categories
  - GET `tags` - List tags

**Thời gian ước tính:** 2-3 tuần  
**Dependencies:**
- `@tiptap/react` - Rich text editor
- `@tiptap/starter-kit` - Basic editor features
- `@tiptap/extension-image` - Image support
- `@tiptap/extension-link` - Link support

**Files cần tạo:**
- `app/admin/posts/page.tsx`
- `app/admin/posts/new/page.tsx`
- `app/admin/posts/[id]/edit/page.tsx`
- `app/admin/authors/page.tsx`
- `app/admin/authors/[id]/edit/page.tsx`
- `app/admin/comments/page.tsx`
- `app/api/admin/posts/route.ts`
- `app/api/admin/posts/[id]/route.ts`
- `app/api/admin/authors/route.ts`
- `app/api/admin/comments/route.ts`
- `app/api/cms/posts/route.ts`
- `components/admin/PostEditor.tsx`
- `components/admin/CommentModeration.tsx`

---

### **Phase 3: Homepage Builder (Ưu tiên cao)**

**Mục tiêu:** Drag & drop homepage builder với 15+ section types

#### 3.1. Database Setup
- [ ] **Collection:**
  - `homepage_configs` - Homepage configurations
  - Schema: `{ sections: Section[], published: boolean, version: number }`

#### 3.2. Section Types (15+)
- [ ] Hero Carousel
- [ ] Product Grid
- [ ] Category Grid
- [ ] Banner Section
- [ ] Testimonials
- [ ] Video Section
- [ ] Newsletter Signup
- [ ] Text Block
- [ ] Image Gallery
- [ ] Countdown Timer
- [ ] Social Proof
- [ ] FAQ Section
- [ ] Blog Posts Preview
- [ ] Store Locations
- [ ] Custom HTML

#### 3.3. API Routes
- [ ] **Homepage Configs API** (`/api/admin/homepage/configs`)
  - GET - List configs
  - POST - Create config
  - GET `[id]` - Get config
  - PATCH `[id]` - Update config
  - DELETE `[id]` - Delete config
  - POST `[id]/publish` - Publish config
  - POST `[id]/duplicate` - Duplicate config
  - POST `[id]/schedule` - Schedule publish
  - GET `[id]/versions` - Version history
  - POST `[id]/restore` - Rollback version

#### 3.4. Admin Pages
- [ ] **Homepage Builder** (`/admin/homepage`)
  - Drag & drop interface
  - Section library sidebar
  - Section settings panel
  - Live preview
  - Save/Publish buttons
  - Version history

#### 3.5. Public API
- [ ] **Public Homepage API** (`/api/cms/homepage`)
  - GET - Get published homepage config

**Thời gian ước tính:** 3-4 tuần  
**Dependencies:**
- `react-dnd` hoặc `@dnd-kit/core` - Drag & drop
- `react-dnd-html5-backend` - HTML5 backend

**Files cần tạo:**
- `app/admin/homepage/page.tsx`
- `app/api/admin/homepage/configs/route.ts`
- `app/api/admin/homepage/configs/[id]/route.ts`
- `app/api/cms/homepage/route.ts`
- `components/admin/homepage/HomepageBuilder.tsx`
- `components/admin/homepage/SectionLibrary.tsx`
- `components/admin/homepage/SectionSettings.tsx`
- `components/admin/homepage/sections/*.tsx` (15+ section components)

---

### **Phase 4: SEO Tools (Ưu tiên trung bình)**

**Mục tiêu:** SEO management tools

#### 4.1. Database Setup
- [ ] **Collections:**
  - `seo_keywords` - Keyword tracking
  - `seo_404_errors` - 404 error tracking
  - `seo_schema` - Schema.org markup

#### 4.2. Admin Pages
- [ ] **SEO Dashboard** (`/admin/seo`)
  - Overview stats
  - Keyword performance
  - 404 errors list
  - Schema markup status

- [ ] **Keywords Management** (`/admin/seo/keywords`)
  - List keywords
  - Add keyword
  - Track ranking
  - Performance charts

- [ ] **404 Errors** (`/admin/seo/404`)
  - List 404 errors
  - Redirect management
  - Error frequency tracking

- [ ] **Schema Markup** (`/admin/seo/schema`)
  - Schema.org markup editor
  - Auto-generation for products/posts
  - Validation

- [ ] **Sitemap** (`/admin/seo/sitemap`)
  - Generate sitemap
  - Submit to search engines
  - Sitemap status

#### 4.3. API Routes
- [ ] **SEO API** (`/api/admin/seo/*`)
  - Keywords CRUD
  - 404 errors tracking
  - Schema management
  - Sitemap generation

**Thời gian ước tính:** 2 tuần  
**Files cần tạo:**
- `app/admin/seo/page.tsx`
- `app/admin/seo/keywords/page.tsx`
- `app/admin/seo/404/page.tsx`
- `app/admin/seo/schema/page.tsx`
- `app/admin/seo/sitemap/page.tsx`
- `app/api/admin/seo/keywords/route.ts`
- `app/api/admin/seo/404/route.ts`
- `components/admin/seo/KeywordTracker.tsx`
- `components/admin/seo/SchemaEditor.tsx`

---

### **Phase 5: Analytics & Media (Ưu tiên trung bình)**

#### 5.1. Analytics Dashboard
- [ ] **Analytics Page** (`/admin/analytics`)
  - Sales charts
  - Product performance
  - Customer analytics
  - Traffic stats
  - Revenue trends

- [ ] **API Routes** (`/api/admin/analytics/*`)
  - Sales data
  - Product stats
  - Customer stats

#### 5.2. Media Library
- [ ] **Media Library** (`/admin/media`)
  - Image upload (Vercel Blob hoặc local)
  - Media gallery
  - Search & filter
  - Delete/Edit metadata
  - Usage tracking (which products/posts use image)

- [ ] **API Routes** (`/api/admin/media/*`)
  - Upload image
  - List media
  - Delete media
  - Update metadata

**Thời gian ước tính:** 1-2 tuần  
**Dependencies:**
- `@vercel/blob` - Vercel Blob storage (optional)
- `recharts` hoặc `chart.js` - Charts

**Files cần tạo:**
- `app/admin/analytics/page.tsx`
- `app/admin/media/page.tsx`
- `app/api/admin/analytics/route.ts`
- `app/api/admin/media/route.ts`
- `components/admin/analytics/AnalyticsCharts.tsx`
- `components/admin/media/MediaLibrary.tsx`

---

### **Phase 6: Advanced Features (Ưu tiên thấp)**

#### 6.1. Products Advanced
- [ ] **Brands Management** (`/admin/products/brands`)
- [ ] **Product Reviews** (`/admin/products/reviews`)
- [ ] **Product Tags** (`/admin/products/tags`)

#### 6.2. Marketing
- [ ] **Coupons** (`/admin/marketing/coupons`)
- [ ] **Promotions** (`/admin/marketing/promotions`)

#### 6.3. Pages Management
- [ ] **Pages** (`/admin/pages`)
  - Static pages CRUD
  - Page builder (similar to homepage)

#### 6.4. Contacts
- [ ] **Contacts** (`/admin/contacts`)
  - Contact form submissions
  - Reply functionality

#### 6.5. Payments
- [ ] **Payment Gateways** (`/admin/payments/gateways`)
  - Gateway configuration
  - Transaction history

#### 6.6. Appearance
- [ ] **Appearance Settings** (`/admin/appearance/*`)
  - Background settings
  - Customize theme
  - Widgets management

#### 6.7. Settings
- [ ] **System Settings** (`/admin/settings`)
  - General settings
  - Security config
  - Email settings
  - Shipping settings

**Thời gian ước tính:** 3-4 tuần

---

## 📅 TIMELINE TỔNG THỂ

| Phase | Thời gian | Ưu tiên | Phụ thuộc |
|-------|-----------|---------|-----------|
| **Phase 1** | 1-2 tuần | 🔴 Cao | - |
| **Phase 2** | 2-3 tuần | 🔴 Cao | Phase 1 |
| **Phase 3** | 3-4 tuần | 🔴 Cao | Phase 1 |
| **Phase 4** | 2 tuần | 🟡 Trung bình | Phase 2, 3 |
| **Phase 5** | 1-2 tuần | 🟡 Trung bình | Phase 1 |
| **Phase 6** | 3-4 tuần | 🟢 Thấp | Phase 1-5 |

**Tổng thời gian ước tính:** 12-17 tuần (3-4 tháng)

---

## 🔧 TECHNICAL REQUIREMENTS

### Dependencies Cần Thêm

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^7.x",
  "@dnd-kit/utilities": "^3.x",
  "recharts": "^2.x",
  "@vercel/blob": "^0.x" // Optional
}
```

### Database Collections Cần Thêm

```typescript
// lib/db.ts - Update getCollections()
export interface Collections {
  // ... existing collections
  posts: Collection<Post>;
  authors: Collection<Author>;
  comments: Collection<Comment>;
  postCategories: Collection<PostCategory>;
  postTags: Collection<PostTag>;
  homepageConfigs: Collection<HomepageConfig>;
  seoKeywords: Collection<SEOKeyword>;
  seo404Errors: Collection<SEO404Error>;
  media: Collection<Media>;
  // ... more collections
}
```

---

## 📝 NOTES

1. **Ưu tiên Phase 1-3:** Đây là các chức năng core nhất, nên triển khai trước
2. **Tái sử dụng Components:** Nhiều components từ fullcode.txt có thể tái sử dụng trực tiếp
3. **Testing:** Mỗi phase cần có testing trước khi chuyển phase tiếp theo
4. **Documentation:** Cập nhật docs sau mỗi phase
5. **Migration:** Cần migration script cho blog posts nếu có data từ WordPress

---

## ✅ CHECKLIST TRƯỚC KHI BẮT ĐẦU

- [ ] Review toàn bộ fullcode.txt để extract components
- [ ] Setup development environment
- [ ] Install required dependencies
- [ ] Create database indexes cho collections mới
- [ ] Setup Vercel Blob (nếu dùng) hoặc local storage
- [ ] Create base components structure
- [ ] Setup TypeScript types cho tất cả entities

---

**Next Steps:** Bắt đầu với Phase 1 - Hoàn thiện Core Features

