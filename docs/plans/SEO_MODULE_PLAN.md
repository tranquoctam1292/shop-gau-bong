# Ke Hoach Xay Dung Module SEO Management

**Ngay tao:** 2025-12-31
**Cap nhat:** 2025-12-31
**Trang thai:** Planning
**Phien ban:** 2.1

---

## Muc Luc

1. [Tong Quan He Thong Hien Tai](#1-tong-quan-he-thong-hien-tai)
2. [Phan Tich Van De](#2-phan-tich-van-de)
3. [Muc Tieu Module SEO](#3-muc-tieu-module-seo)
4. [Kien Truc De Xuat](#4-kien-truc-de-xuat)
5. [Database Schema](#5-database-schema)
6. [Ke Hoach Trien Khai](#6-ke-hoach-trien-khai)
7. [API Specifications](#7-api-specifications)
8. [UI/UX Specifications](#8-uiux-specifications)
9. [Risk Mitigation](#9-risk-mitigation)
10. [Testing Plan](#10-testing-plan)
11. [Appendix A: Integration Analysis & Potential Conflicts](#appendix-a-integration-analysis--potential-conflicts)
12. [Appendix B: Risk Matrix](#appendix-b-risk-matrix)
13. [Appendix C: Glossary](#appendix-c-glossary)

> **Progress Checklist:** Xem file [SEO_PROGRESS_CHECKLIST.md](./SEO_PROGRESS_CHECKLIST.md) de theo doi tien do chi tiet.

---

## 1. Tong Quan He Thong Hien Tai

### 1.1 Cac File SEO Da Co

| File | Chuc nang | Dong code | Trang thai |
|------|-----------|-----------|------------|
| `app/layout.tsx` | Root metadata, OG tags, Twitter cards | ~197 | ✅ Hoan thanh |
| `app/sitemap.ts` | Dynamic sitemap (products only) | ~77 | ⚠️ Can mo rong |
| `app/robots.ts` | Robots.txt configuration | ~39 | ✅ Hoan thanh |
| `app/(shop)/products/[slug]/metadata.ts` | Product dynamic metadata | ~72 | ✅ Hoan thanh |
| `app/(shop)/products/[slug]/page.tsx` | Product schema (JSON-LD) | ~166 | ✅ Hoan thanh |
| `app/(blog)/posts/[slug]/metadata.ts` | Blog post metadata | ~54 | ⚠️ Chua dynamic |
| `lib/utils/metadata.ts` | Metadata utilities | ~118 | ✅ Hoan thanh |
| `lib/utils/schema.ts` | Schema.org utilities | ~148 | ✅ Hoan thanh |
| `components/seo/StructuredData.tsx` | JSON-LD injection | ~38 | ✅ Hoan thanh |
| `components/admin/products/SEOMetaBox.tsx` | Product SEO editor | ~872 | ✅ Hoan thanh |

### 1.2 Schema Hien Tai

**Product SEO Fields (trong MongoProduct):**
```typescript
// Cac field SEO da co trong product
{
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;

  // SEO fields (da co trong SEOMetaBox)
  seo?: {
    focusKeyword?: string;
    seoTitle?: string;
    seoDescription?: string;
    canonicalUrl?: string;
    robotsMeta?: string;
    ogImage?: string;
    ogImageId?: string;
    socialDescription?: string;
  };
}
```

### 1.3 Hien Trang SEO Score

| Thanh phan | Trang thai | Ghi chu |
|------------|------------|---------|
| Root Metadata | ✅ Co | Title, description, keywords |
| Dynamic Product Metadata | ✅ Co | generateMetadata |
| Dynamic Blog Metadata | ⚠️ Mot phan | Chua fetch tu CMS |
| Sitemap.xml | ⚠️ Mot phan | Chi products, thieu categories/posts |
| Robots.txt | ✅ Co | Day du |
| Product Schema (JSON-LD) | ✅ Co | Product, BreadcrumbList |
| Organization Schema | ❌ Thieu | Can them vao root |
| WebSite Schema | ❌ Thieu | Can them SearchAction |
| LocalBusiness Schema | ❌ Thieu | Optional cho local SEO |
| FAQ Schema | ❌ Thieu | Optional cho product pages |
| AggregateRating Schema | ❌ Thieu | Tu reviews |
| SEO Dashboard | ❌ Thieu | Can xay dung |
| Bulk SEO Editor | ❌ Thieu | Can xay dung |
| Redirects Management | ❌ Thieu | Can xay dung |

**Uoc tinh SEO Score hien tai:** ~65/100

---

## 2. Phan Tich Van De

### 2.1 Van De Nghiem Trong (CRITICAL)

#### SEO-ISSUE-01: Thieu quan ly SEO tap trung

**Van de:**
- Khong co trang dashboard de xem tong quan SEO
- Khong the bulk edit SEO cho nhieu products
- Khong co scoring/audit system

**Anh huong:**
- Mat thoi gian khi can update SEO cho nhieu san pham
- Khong biet san pham nao can toi uu

**Giai phap:** Xay dung SEO Dashboard + Bulk Editor

---

#### SEO-ISSUE-02: Sitemap khong day du

**Van de:**
```typescript
// Hien tai chi co products
const productPages = products.map((product) => ({
  url: `${baseUrl}/products/${product.slug}`,
  // ...
}));
// Thieu: categories, blog posts
```

**Anh huong:**
- Google khong index het cac trang
- Categories va blog posts bi bo qua

**Giai phap:** Mo rong sitemap.ts de bao gom categories va posts

---

#### SEO-ISSUE-03: Thieu Redirects Management

**Van de:**
- Khi doi slug san pham, URL cu bi 404
- Khong co cach quan ly 301/302 redirects

**Anh huong:**
- Mat link juice tu backlinks cu
- Trai nghiem nguoi dung xau (404 errors)

**Giai phap:** Xay dung Redirects manager + Middleware integration

---

### 2.2 Van De Trung Binh (MEDIUM)

#### SEO-ISSUE-04: Thieu Organization/WebSite Schema

**Van de:**
- Khong co Organization schema o root
- Khong co WebSite schema voi SearchAction

**Giai phap:** Them schemas vao app/layout.tsx

---

#### SEO-ISSUE-05: Blog metadata khong dynamic

**Van de:**
```typescript
// app/(blog)/posts/[slug]/metadata.ts
// Hien tai hardcode, khong fetch tu CMS
const metadata = getPostMetadata({
  title: 'Bai viet',  // Hardcode!
  excerpt: 'Doc bai viet moi nhat...',
  slug: params.slug,
});
```

**Giai phap:** Fetch post data tu CMS API

---

### 2.3 Van De Nhe (LOW)

#### SEO-ISSUE-06: Thieu AggregateRating Schema

**Van de:** Product schema khong co rating/review count

**Giai phap:** Them vao khi co reviews system

---

## 3. Muc Tieu Module SEO

### 3.1 Muc Tieu Chinh

1. **SEO Dashboard:** Xem tong quan SEO toan website
2. **Bulk SEO Editor:** Edit SEO cho nhieu products cung luc
3. **SEO Scoring:** Cham diem va phan tich SEO tung san pham
4. **Redirects Manager:** Quan ly 301/302 redirects
5. **Schema Enhancement:** Them Organization, WebSite schemas

### 3.2 Pham Vi

| Trong pham vi | Ngoai pham vi (Phase sau) |
|---------------|---------------------------|
| SEO Dashboard | Google Search Console integration |
| Bulk SEO Editor | Keyword tracking |
| SEO Scoring Algorithm | AI-generated SEO suggestions |
| Redirects Management | A/B testing |
| Sitemap improvements | Multi-language SEO |
| Basic schema enhancements | Advanced analytics |

### 3.3 Success Metrics

| Metric | Target |
|--------|--------|
| SEO Score trung binh | > 80/100 |
| Products co day du SEO | > 95% |
| Time to bulk edit 50 products | < 30 seconds |
| Redirects response time | < 50ms |
| Dashboard load time | < 2 seconds |

---

## 4. Kien Truc De Xuat

### 4.1 Cau Truc Thu Muc

```
app/admin/seo/
├── page.tsx                    # SEO Dashboard
├── products/page.tsx           # Bulk SEO Editor
├── redirects/page.tsx          # Redirects Manager
└── settings/page.tsx           # Global SEO Settings

app/api/admin/seo/
├── route.ts                    # GET: Dashboard stats
├── products/route.ts           # GET: Products SEO list
├── products/bulk/route.ts      # PATCH: Bulk update
├── redirects/route.ts          # GET/POST: Redirects
├── redirects/[id]/route.ts     # PUT/DELETE: Single redirect
├── settings/route.ts           # GET/PUT: Global settings
└── audit/route.ts              # POST: Run SEO audit

components/admin/seo/
├── SEODashboardStats.tsx       # Dashboard stats cards
├── SEOScoreDistribution.tsx    # Score chart
├── SEOIssuesList.tsx           # Top issues list
├── ProductsSEOTable.tsx        # Bulk editor table
├── ProductSEORow.tsx           # Single row (inline edit)
├── SEOScoreBadge.tsx           # Score badge (0-100)
├── RedirectsTable.tsx          # Redirects list
├── RedirectForm.tsx            # Add/edit redirect
└── GlobalSEOForm.tsx           # Settings form

lib/
├── repositories/seoRepository.ts   # Data access
├── services/seoService.ts          # Business logic
├── utils/seoAudit.ts               # Scoring algorithm
└── hooks/useSEO.ts                 # React Query hooks

types/
└── seo.ts                      # TypeScript interfaces
```

### 4.2 SEO Scoring Algorithm

```typescript
// lib/utils/seoAudit.ts

interface SEOAuditResult {
  score: number;              // 0-100
  issues: SEOIssue[];
  passed: SEOCheck[];
}

interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

// Scoring Weights (total: 100 points)
const SEO_WEIGHTS = {
  // Critical (40 points)
  hasTitle: 10,
  hasSeoDescription: 10,
  hasImage: 10,
  hasPrice: 10,

  // Important (35 points)
  titleLength: 8,           // 50-60 chars optimal
  descriptionLength: 8,     // 150-160 chars optimal
  hasFocusKeyword: 7,
  keywordInTitle: 6,
  keywordInDescription: 6,

  // Good to have (25 points)
  hasCanonical: 5,
  hasOgImage: 5,
  hasSlug: 5,
  noLongSlug: 5,           // Slug < 60 chars
  hasShortDescription: 5,
};

// Score interpretation
// 90-100: Excellent (green)
// 70-89: Good (light green)
// 50-69: Needs Work (yellow)
// 0-49: Poor (red)
```

---

## 5. Database Schema

### 5.1 Collection: `seoSettings` (Global SEO)

```typescript
interface SEOSettings {
  _id: ObjectId;

  // Title Templates
  titleTemplate: string;            // "%title% | %sitename%"
  productTitleTemplate: string;     // "Mua %title% - %price% | %sitename%"

  // Verification Codes
  googleVerification?: string;
  bingVerification?: string;

  // Default OG Image
  defaultOgImage?: string;

  // Organization Schema
  organization: {
    name: string;
    logo?: string;
    url: string;
    phone?: string;
    email?: string;
    address?: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      addressCountry: string;
    };
    socialProfiles?: string[];
  };

  updatedAt: Date;
  updatedBy: ObjectId;
}
```

### 5.2 Collection: `seoRedirects`

```typescript
interface SEORedirect {
  _id: ObjectId;
  source: string;             // "/old-product-url"
  destination: string;        // "/new-product-url"
  type: 301 | 302;
  enabled: boolean;
  hitCount: number;
  lastHitAt?: Date;
  note?: string;
  createdAt: Date;
  createdBy: ObjectId;
  updatedAt: Date;
}
```

### 5.3 Extended Product Fields (existing)

```typescript
// Sudung fields da co trong SEOMetaBox
// Them 2 fields moi:
interface ProductSEOExtended {
  seo?: {
    // ... existing fields ...
    seoScore?: number;        // 0-100 (calculated)
    seoIssues?: string[];     // ["MISSING_DESCRIPTION", ...]
    lastAuditAt?: Date;
  };
}
```

### 5.4 Database Indexes

```javascript
// seoSettings - single document, no special index needed

// seoRedirects
db.seoRedirects.createIndex({ source: 1 }, { unique: true });
db.seoRedirects.createIndex({ enabled: 1, source: 1 });
db.seoRedirects.createIndex({ createdAt: -1 });

// products (add to existing indexes)
db.products.createIndex({ "seo.seoScore": 1 });
db.products.createIndex({ "seo.lastAuditAt": 1 });
```

---

## 6. Ke Hoach Trien Khai

### Phase 0: Foundation

**Muc tieu:** Tao types, repository, utilities co ban

| Task | File | Mo ta |
|------|------|-------|
| Tao SEO types | `types/seo.ts` | Interfaces cho SEO |
| Tao SEO repository | `lib/repositories/seoRepository.ts` | Data access layer |
| Tao SEO audit algorithm | `lib/utils/seoAudit.ts` | Scoring logic |
| Tao SEO service | `lib/services/seoService.ts` | Business logic |
| Tao SEO hooks | `lib/hooks/useSEO.ts` | React Query hooks |
| Setup database indexes | `scripts/setup-database-indexes.ts` | Indexes |

---

### Phase 1: Core Module

**Muc tieu:** SEO Dashboard + Bulk Editor + Global Settings

#### 1.1 Backend - API Routes

| Method | Endpoint | Mo ta |
|--------|----------|-------|
| GET | `/api/admin/seo` | Dashboard stats |
| GET | `/api/admin/seo/products` | Products SEO list |
| PATCH | `/api/admin/seo/products/bulk` | Bulk update |
| GET/PUT | `/api/admin/seo/settings` | Global settings |
| POST | `/api/admin/seo/audit` | Run audit on products |

#### 1.2 Frontend - Pages & Components

| Item | File | Mo ta |
|------|------|-------|
| Dashboard Page | `app/admin/seo/page.tsx` | Overview |
| Products SEO Page | `app/admin/seo/products/page.tsx` | Bulk editor |
| Settings Page | `app/admin/seo/settings/page.tsx` | Global settings |
| Dashboard Stats | `components/admin/seo/SEODashboardStats.tsx` | Stats cards |
| Score Distribution | `components/admin/seo/SEOScoreDistribution.tsx` | Chart |
| Products Table | `components/admin/seo/ProductsSEOTable.tsx` | Bulk edit table |
| SEO Score Badge | `components/admin/seo/SEOScoreBadge.tsx` | Score badge |

#### 1.3 Integration

| Task | Mo ta |
|------|-------|
| Admin sidebar menu | Them menu "SEO" voi submenu |
| Permission check | SUPER_ADMIN, CONTENT_MANAGER |
| Sitemap improvement | Them categories, blog posts |
| Schema enhancement | Them Organization, WebSite schemas |

---

### Phase 2: Redirects & Advanced

**Muc tieu:** Redirects manager + Sitemap management

#### 2.1 Redirects Management

| Task | File |
|------|------|
| Redirects API | `app/api/admin/seo/redirects/route.ts` |
| Redirects [id] API | `app/api/admin/seo/redirects/[id]/route.ts` |
| Redirects Page | `app/admin/seo/redirects/page.tsx` |
| Redirects Table | `components/admin/seo/RedirectsTable.tsx` |
| Redirect Form | `components/admin/seo/RedirectForm.tsx` |
| Middleware integration | `middleware.ts` |

#### 2.2 Sitemap Improvements

| Task | File |
|------|------|
| Add categories to sitemap | `app/sitemap.ts` |
| Add blog posts to sitemap | `app/sitemap.ts` |

---

### Phase 3: Optimization (Optional)

**Muc tieu:** Categories SEO + Audit enhancements

| Task | Mo ta |
|------|-------|
| Categories SEO Page | Edit SEO cho categories |
| Scheduled SEO Audit | Cron job chay audit dinh ky |
| SEO Audit Report | Bao cao chi tiet |

---

## 7. API Specifications

### 7.1 GET /api/admin/seo (Dashboard)

**Response:**
```json
{
  "overview": {
    "totalProducts": 150,
    "productsWithSEO": 120,
    "productsWithoutSEO": 30,
    "averageSEOScore": 72,
    "totalRedirects": 25
  },
  "scoreDistribution": {
    "excellent": 45,
    "good": 35,
    "needsWork": 25,
    "poor": 15
  },
  "topIssues": [
    { "code": "MISSING_SEO_DESCRIPTION", "count": 30, "label": "Thieu mo ta SEO" },
    { "code": "SHORT_TITLE", "count": 25, "label": "Tieu de qua ngan" },
    { "code": "NO_FOCUS_KEYWORD", "count": 20, "label": "Chua co tu khoa chinh" }
  ]
}
```

### 7.2 GET /api/admin/seo/products

**Query params:**
- `page`, `per_page`: Pagination
- `search`: Search by name/SKU
- `scoreMin`, `scoreMax`: Filter by score
- `hasIssues`: Filter products with issues
- `sortBy`: "score" | "name" | "updatedAt"
- `sortOrder`: "asc" | "desc"

**Response:**
```json
{
  "products": [
    {
      "id": "...",
      "name": "Gau bong teddy 50cm",
      "slug": "gau-bong-teddy-50cm",
      "thumbnail": "...",
      "seo": {
        "focusKeyword": "gau bong teddy",
        "seoTitle": "Mua Gau Bong Teddy 50cm...",
        "seoDescription": "...",
        "seoScore": 85,
        "issues": ["MISSING_OG_IMAGE"]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 7.3 PATCH /api/admin/seo/products/bulk

**Request:**
```json
{
  "updates": [
    {
      "productId": "...",
      "seo": {
        "focusKeyword": "...",
        "seoTitle": "...",
        "seoDescription": "..."
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "updated": 5,
  "failed": 0,
  "errors": []
}
```

### 7.4 CRUD /api/admin/seo/redirects

**GET Response:**
```json
{
  "redirects": [
    {
      "id": "...",
      "source": "/old-url",
      "destination": "/new-url",
      "type": 301,
      "enabled": true,
      "hitCount": 150
    }
  ],
  "pagination": {...}
}
```

**POST Request:**
```json
{
  "source": "/old-url",
  "destination": "/new-url",
  "type": 301,
  "note": "Product renamed"
}
```

---

## 8. UI/UX Specifications

### 8.1 SEO Dashboard

```
+----------------------------------------------------------+
|  SEO Dashboard                                            |
+----------------------------------------------------------+
|  +------------+ +------------+ +------------+ +----------+|
|  | Products   | | With SEO   | | No SEO     | | Avg Score||
|  |    150     | |    120     | |     30     | |    72    ||
|  +------------+ +------------+ +------------+ +----------+|
|                                                           |
|  +------------------------+ +----------------------------+|
|  | Score Distribution     | | Top Issues                 ||
|  | ████████████ Excellent | | ⚠ Missing description (30)||
|  | ██████████ Good        | | ⚠ Short title (25)        ||
|  | ███████ Needs Work     | | ⚠ No focus keyword (20)   ||
|  | ████ Poor              | |                            ||
|  +------------------------+ +----------------------------+|
+----------------------------------------------------------+
```

### 8.2 Bulk SEO Editor

```
+----------------------------------------------------------+
|  Products SEO                    [Run Audit] [Export]     |
+----------------------------------------------------------+
|  Search: [____________]  Score: [All ▼]  Issues: [All ▼] |
+----------------------------------------------------------+
|  ☐ | Product        | SEO Title     | Description | Score|
|  --+----------------+---------------+-------------+------|
|  ☐ | [img] Gau bong | Mua Gau bong..| Shop Gau... | 85 ● |
|  ☐ | [img] Teddy XL | Teddy XL...   | Gau bong... | 72 ● |
|  ☑ | [img] Bear 30  | [empty]       | [empty]     | 35 ● |
|  --+----------------+---------------+-------------+------|
|  Selected: 1          [Generate Title] [Generate Desc]   |
+----------------------------------------------------------+
```

### 8.3 SEO Score Badge

```
Score 90-100: ● Excellent (green)
Score 70-89:  ● Good (light green)
Score 50-69:  ● Needs Work (yellow)
Score 0-49:   ● Poor (red)
```

---

## 9. Risk Mitigation

| Risk ID | Mo ta | Muc do | Giai phap |
|---------|-------|--------|-----------|
| SEO-R01 | Redirect loops | HIGH | Validate before save, detect cycles |
| SEO-R02 | Bulk update timeout | MEDIUM | Batch processing (50 items/batch) |
| SEO-R03 | Middleware redirect performance | MEDIUM | Cache redirects in memory |
| SEO-R04 | Concurrent SEO edits | LOW | Optimistic locking |
| SEO-R05 | Schema validation | LOW | Validate with schema.org |

---

## 10. Testing Plan

### Unit Tests

| Test | File |
|------|------|
| SEO Audit algorithm | `lib/utils/__tests__/seoAudit.test.ts` |
| SEO Repository | `lib/repositories/__tests__/seoRepository.test.ts` |
| useSEO hooks | `lib/hooks/__tests__/useSEO.test.tsx` |

### Integration Tests

- API endpoints testing
- Redirects middleware testing

### Manual Testing

- Bulk edit 50+ products
- Create 100+ redirects
- Dashboard with 500+ products

---

## Appendix A: Integration Analysis & Potential Conflicts

### A.1 Integration Points Identified

| Component | File | Integration Method | Notes |
|-----------|------|-------------------|-------|
| Admin Sidebar | `app/admin/layout.tsx` | Them menu item vao `navItems` array (line ~89) | RBAC: SUPER_ADMIN, CONTENT_MANAGER |
| Middleware | `middleware.ts` | Them redirect handling truoc CSP logic | Can cache redirects, avoid DB query moi request |
| SEOMetaBox | `components/admin/products/SEOMetaBox.tsx` | Reuse cho Bulk Editor | Da co 872 lines, day du tinh nang |
| ProductForm | `components/admin/ProductForm.tsx` | Giu nguyen, bulk editor la rieng | Khong can thay doi |
| Schema Utils | `lib/utils/schema.ts` | Mo rong, them generateOrganizationSchema | Da co san, chi can goi trong layout.tsx |
| Sitemap | `app/sitemap.ts` | Mo rong them categories, posts | Chi edit 1 file |
| Product API | `app/api/admin/products/[id]/route.ts` | Giu nguyen, seo field da duoc xu ly | Da co Zod schema cho seo |

### A.2 Potential Conflicts & Mitigations

#### CONFLICT-01: MongoProduct Type Thieu SEO Field (HIGH)

**Van de:**
```typescript
// lib/utils/productMapper.ts line 279-362
export interface MongoProduct {
  // ... nhieu fields ...
  // THIEU: seo field khong co trong interface
}
```

**Nhung API route van xu ly seo:**
```typescript
// app/api/admin/products/[id]/route.ts line 157-166
seo: z.object({
  focusKeyword: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  // ...
}).optional(),
```

**Anh huong:**
- TypeScript khong validate seo field khi doc product
- Bulk SEO Editor co the gap type errors

**Giai phap:**
- [ ] Them `seo?` field vao `MongoProduct` interface trong `lib/utils/productMapper.ts`
- [ ] Tao interface `ProductSEOFields` trong `types/seo.ts` va import

---

#### CONFLICT-02: Middleware Performance (MEDIUM)

**Van de:**
Middleware hien tai chay cho moi request (tru API, static). Them redirect lookup co the anh huong performance.

**Code hien tai (middleware.ts):**
```typescript
// Line 87-98: Matcher config
matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
]
```

**Giai phap:**
- [ ] Cache redirects trong memory (TTL: 5 phut)
- [ ] Fetch redirects lazy (chi khi can)
- [ ] Su dung edge-compatible cache (Map hoac LRU)

---

#### CONFLICT-03: Admin Sidebar Structure (LOW)

**Van de:**
Admin sidebar duoc dinh nghia truc tiep trong `app/admin/layout.tsx` (line 89-169), khong phai separate component.

**Giai phap:**
```typescript
// Them vao navItems array (sau "Quan ly tai khoan", truoc "Cai dat")
{
  href: '/admin/seo',
  label: 'SEO',
  icon: Search, // Import tu lucide-react
  roles: [AdminRole.SUPER_ADMIN, AdminRole.CONTENT_EDITOR],
  submenu: [
    { href: '/admin/seo', label: 'Tong quan', icon: LayoutDashboard },
    { href: '/admin/seo/products', label: 'SEO San pham', icon: Package },
    { href: '/admin/seo/redirects', label: 'Chuyen huong', icon: ArrowRight },
    { href: '/admin/seo/settings', label: 'Cai dat', icon: Settings },
  ],
},
```

---

#### CONFLICT-04: Schema.ts Da Co OrganizationSchema (LOW)

**Van de:**
`lib/utils/schema.ts` da co `generateOrganizationSchema()` function (line 87-111), nhung chua duoc su dung trong layout.tsx.

**Giai phap:**
- [ ] Import va goi trong `app/layout.tsx`
- [ ] Khong can tao moi, chi can su dung

---

#### CONFLICT-05: Types Folder Structure (LOW)

**Van de:**
Cac types hien tai:
```
types/
├── mongodb.ts      # MongoOrder, MongoVariant, SkuSetting, etc.
├── inventory.ts    # Inventory types
├── media.ts        # Media types
├── admin.ts        # AdminRole enum
├── ...
```

Them `types/seo.ts` co the duplicate voi existing types trong cac file khac.

**Giai phap:**
- [ ] Review `types/mongodb.ts` truoc khi tao `types/seo.ts`
- [ ] SEOSettings va SEORedirect la MongoDB documents -> them vao `types/mongodb.ts` thay vi file moi
- [ ] Hoac tao `types/seo.ts` va import types tu do vao `types/mongodb.ts`

---

#### CONFLICT-06: Sitemap Fetch Categories (MEDIUM)

**Van de:**
Hien tai `app/sitemap.ts` chi fetch products. Can them categories va posts.

**Code hien tai (sitemap.ts line 42-56):**
```typescript
const response = await fetch(`${baseUrl}/api/cms/products?per_page=100&status=publish`, {
  // ...
});
```

**Giai phap:**
- [ ] Them fetch categories: `/api/cms/categories`
- [ ] Them fetch posts: `/api/cms/posts`
- [ ] Can kiem tra API endpoints ton tai

---

#### CONFLICT-07: SEOMetaBox State vs Bulk Editor (MEDIUM)

**Van de:**
`SEOMetaBox.tsx` duoc thiet ke cho edit 1 product (controlled component). Bulk Editor can edit nhieu products cung luc.

**Giai phap:**
- [ ] KHONG reuse SEOMetaBox cho bulk editor
- [ ] Tao `ProductSEORow.tsx` (inline edit trong table)
- [ ] Hoac tao `SEOInlineEditor.tsx` lightweight component

---

### A.3 Dependency Check

| Dependency | Purpose | Status |
|------------|---------|--------|
| lucide-react | Icons cho SEO menu | Co san |
| @tanstack/react-query | Data fetching hooks | Co san |
| zod | Form validation | Co san |
| recharts (optional) | SEO Score distribution chart | Can cai them |

---

## Appendix B: Risk Matrix

| Risk ID | Strategy | Owner | Status |
|---------|----------|-------|--------|
| SEO-ISSUE-01 | Build Dashboard + Bulk Editor | Dev | Pending |
| SEO-ISSUE-02 | Expand sitemap.ts | Dev | Pending |
| SEO-ISSUE-03 | Build Redirects Manager | Dev | Pending |
| SEO-ISSUE-04 | Add schemas to layout.tsx | Dev | Pending |
| SEO-ISSUE-05 | Fetch blog data from CMS | Dev | Pending |
| SEO-R01 | Cycle detection algorithm | Dev | Pending |
| SEO-R02 | Batch processing | Dev | Pending |
| SEO-R03 | Memory cache for redirects | Dev | Pending |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| SEO Score | Diem danh gia SEO (0-100) |
| Focus Keyword | Tu khoa chinh can toi uu |
| Meta Description | Mo ta hien thi tren Google |
| Canonical URL | URL chinh thuc cua trang |
| 301 Redirect | Chuyen huong vinh vien |
| 302 Redirect | Chuyen huong tam thoi |
| JSON-LD | Dinh dang structured data |
| Open Graph | Metadata cho Facebook/social |
| Sitemap | Danh sach URLs cho search engines |

---

**Document Control:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-31 | Claude | Initial draft |
| 2.0 | 2025-12-31 | Claude | Deep review: Added TOC, current system analysis, simplified phases (7->3), added risk matrix, glossary, document control |
| 2.1 | 2025-12-31 | Claude | Added Appendix A: Integration Analysis & Potential Conflicts (7 conflicts identified) |

---

*Ke hoach nay dang trong giai doan Planning. Xem [SEO_PROGRESS_CHECKLIST.md](./SEO_PROGRESS_CHECKLIST.md) de theo doi tien do.*
