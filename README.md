# 🧸 Shop Gấu Bông - E-commerce Website

Website thương mại điện tử bán gấu bông được xây dựng với **WordPress (Headless CMS)** và **Next.js 14 (App Router)**.

## 🚀 Tech Stack

### Frontend
- **Next.js 14+** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling với Design System
- **React Query (@tanstack/react-query)** - Data fetching, caching, and deduplication
- **Zustand** - State management (cart state with localStorage persistence)
- **Shadcn UI** - UI component library
- **React Hook Form + Zod** - Form handling & validation
- **Lucide React** - Icon library

### Backend
- **WordPress 6.0+** - Headless CMS
- **WooCommerce** - E-commerce plugin
- **WooCommerce REST API** - Native REST API (v3)
- **ACF (Advanced Custom Fields)** - Custom fields for products

## 📋 Yêu cầu hệ thống

- Node.js 18+
- npm hoặc yarn
- WordPress hosting với PHP 8.0+
- MySQL 5.7+

## 🛠️ Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd shop-gau-bong
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình environment variables
Copy file `.env.example` thành `.env.local` và điền thông tin:

```env
NEXT_PUBLIC_WORDPRESS_URL=https://your-wordpress-site.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxx
```

**Lưu ý:** WooCommerce REST API credentials được lưu trong `.env.local` (không commit lên Git).

### 4. Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## 📁 Cấu trúc dự án

```
shop-gau-bong/
├── app/                    # Next.js App Router
│   ├── (shop)/            # Shop routes
│   ├── api/               # API routes (WooCommerce proxy)
│   │   └── woocommerce/   # WooCommerce REST API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/             # React Components
│   ├── ui/                # Base UI components (Shadcn: Button, Card, Sheet, Popover, Slider, etc.)
│   ├── product/           # Product components (ProductCard, ProductList, ProductFilters, ProductInfo, etc.)
│   ├── cart/              # Cart components (CartDrawer, CartButton)
│   ├── checkout/          # Checkout components (QuickCheckoutModal, OrderSummarySection, CheckoutFormSection)
│   └── layout/            # Layout components (Header, Footer, NavigationMenu, MobileMenu)
├── lib/                    # Utilities
│   ├── api/               # API client
│   │   └── woocommerce.ts # WooCommerce REST API client
│   ├── hooks/             # Custom React hooks
│   │   ├── useProductsREST.ts
│   │   ├── useProductVariations.ts
│   │   └── useCartSync.ts
│   ├── store/             # Zustand stores
│   │   └── cartStore.ts   # Cart state management
│   ├── utils/             # Helper functions
│   │   ├── shipping.ts    # Volumetric weight calculation
│   │   ├── format.ts      # Price formatting
│   │   ├── productMapper.ts # Product data mapper
│   │   └── cn.ts          # Class name utility
│   └── providers/         # React providers
│       └── QueryProvider.tsx # React Query provider
├── types/                 # TypeScript types
│   └── woocommerce.ts     # WooCommerce REST API types
├── docs/                  # Documentation
└── public/                # Static assets
```

## 📝 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint
- `npm run type-check` - TypeScript type checking

## 🎨 Design System

Xem file `docs/DESIGN_SYSTEM.md` để biết:
- Color Palette
- Typography
- Component styling rules
- Mobile First guidelines

## 📚 Tài liệu

- [Schema Context](./docs/SCHEMA_CONTEXT.md) - WooCommerce REST API structure
- [Design System](./docs/DESIGN_SYSTEM.md) - Color palette, typography, components
- [WooCommerce Variations Guide](./docs/WOOCOMMERCE_VARIATIONS_GUIDE.md) - How to add product variations
- [Setup WooCommerce REST API](./docs/SETUP_WOOCOMMERCE_REST_API.md) - API configuration
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions

## 🔑 Tính năng chính

- ✅ Product listing & detail pages với filters và search
- ✅ **Modern Product Filters** - Horizontal layout (Shopee/Lazada style) với Filter Group và Sort Group chips
- ✅ Product variations (size, color) với dynamic pricing và URL query params preservation
- ✅ Shopping cart với volumetric weight calculation
- ✅ Guest checkout (no authentication required)
- ✅ Quick Checkout Modal - Popup checkout không cần chuyển trang
- ✅ Checkout flow với address selector (Province/District/Ward)
- ✅ Payment integration (VietQR, MoMo, COD, Bank Transfer)
- ✅ Order management
- ✅ React Query caching cho performance optimization
- ✅ Mobile-first responsive design (90% mobile traffic)
- ✅ Optimized product list layout - Full-width filters, reduced gaps on mobile

## 📄 License

This project is licensed under the MIT License.
