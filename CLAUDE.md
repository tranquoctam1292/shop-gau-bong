# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vietnamese teddy bear e-commerce website built with Next.js 14 (App Router) + MongoDB + Custom CMS. Mobile-first design (90% mobile traffic).

**Key Constraints:**
- Products are bulky (Volumetric Weight logic: `L * W * H / 6000`)
- Database data can be unpredictable (null/undefined) - always handle gracefully
- UI text must be in Vietnamese

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run type-check       # TypeScript check (npx tsc --noEmit)
npm run lint             # ESLint

# Pre-deployment (MANDATORY before pushing)
npm run pre-deploy       # Runs type-check + build + lint + cron check

# Database
npm run db:setup-indexes # Create MongoDB indexes
npm run create:admin-user # Create admin user
npm run seed:admin-users  # Seed sample admin users

# Testing
npm run test             # Jest unit tests
npm run test:e2e         # Playwright E2E tests
```

## Architecture

### Directory Structure
```
app/
├── (shop)/              # Public shop routes
├── (blog)/              # Blog routes
├── admin/               # Admin panel pages
├── api/
│   ├── cms/             # Public API (products, categories, orders)
│   ├── admin/           # Authenticated admin API
│   └── auth/            # NextAuth.js
components/
├── admin/               # Admin UI components
├── product/             # Product components
├── ui/                  # Shadcn UI base components
lib/
├── api/cms.ts           # CMS API client
├── db.ts                # MongoDB connection (getCollections())
├── hooks/               # React hooks (useProductVariations, useProduct, etc.)
├── repositories/        # Data access layer
├── services/            # Business logic services
├── store/               # Zustand stores (cart)
├── utils/               # Helper functions
├── middleware/          # Auth middleware (withAuthAdmin)
types/
├── mongodb.ts           # MongoDB document types
├── woocommerce.ts       # Legacy types (deprecated, kept for compatibility)
```

### Data Flow
1. Client calls API routes (`/api/cms/*` or `/api/admin/*`)
2. API routes use `getCollections()` from `lib/db.ts`
3. MongoDB documents mapped via `mapMongoProduct()` / `mapMongoCategory()`
4. Frontend uses React Query for caching (`@tanstack/react-query`)

### Key Patterns

**API Route Authentication:**
```typescript
import { withAuthAdmin, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export async function POST(request: NextRequest) {
  return withAuthAdmin(request, async (req: AuthenticatedRequest) => {
    // req.adminUser available here
  });
}
```

**Client-Side Fetch (always include credentials):**
```typescript
fetch('/api/admin/...', { credentials: 'include' })
```

**MongoDB Document Mapping:**
```typescript
const product = await collections.products.findOne({ _id: new ObjectId(id) });
if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
return NextResponse.json({ product: mapMongoProduct(product as unknown as MongoProduct) });
```

**HTML Sanitization (lazy load in API routes):**
```typescript
// Avoid ES Module errors on Vercel
const { cleanHtmlForStorage } = await import('@/lib/utils/sanitizeHtml');
```

## Critical Rules

### Product Variants
- MongoDB variants use direct `size` and `color` fields, NOT an `attributes` object
- Match by `variation.size === selectedSize` directly
- Variants only have `price` field (no sale_price/regular_price)

### API Conventions
- Pagination: use `per_page` (not `limit`)
- Stock status: `instock`, `outofstock`, `onbackorder` (no underscores)
- Soft delete: use `deletedAt` + `status: 'trash'`
- Optimistic locking: always include `version` field in PUT requests

### File Size Limits
- Component files: max 300 lines
- Hook files: max 200 lines
- API route files: max 300 lines
- Use folder pattern when module has 3+ related files

### Mobile First
- Default Tailwind classes = mobile, use `md:`, `lg:` for larger screens
- Touch targets: minimum 44x44px
- Never use `:hover` for critical info

## Key Documentation

- `docs/SCHEMA_CONTEXT.md` - MongoDB schema structure
- `docs/DESIGN_SYSTEM.md` - Color palette, typography
- `docs/PRODUCT_MODULE_REFERENCE.md` - Product module comprehensive reference
- `docs/product-module/API.md` - All product API endpoints
- `.cursorrules` - Detailed coding rules (62KB, comprehensive)
