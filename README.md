# 🧸 Shop Gấu Bông - E-commerce Website

Website thương mại điện tử bán gấu bông được xây dựng với **Custom CMS (MongoDB)** và **Next.js 14 (App Router)**.

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
- **Tiptap** - Rich text editor (for blog posts)

### Backend
- **MongoDB** - NoSQL database
- **Next.js API Routes** - Custom API endpoints
- **NextAuth.js** - Authentication for admin panel with RBAC
- **MongoDB Native Driver** - Database access
- **RBAC System** - Role-Based Access Control for admin accounts

## 📋 Yêu cầu hệ thống

- Node.js 18+
- npm hoặc yarn
- MongoDB (local hoặc MongoDB Atlas)

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
MONGODB_URI=mongodb://localhost:27017/shop-gau-bong
# hoặc MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shop-gau-bong
MONGODB_DB_NAME=shop-gau-bong
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Admin User Creation
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin User
ADMIN_ROLE=SUPER_ADMIN
```

**Lưu ý:** MongoDB connection string và NextAuth secret được lưu trong `.env.local` (không commit lên Git).

### 4. Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

### 5. Setup Database và Admin Users

#### Setup Database Indexes
```bash
npm run db:setup-indexes
```

#### Create Admin Users

**Option 1: Seed sample users (recommended for testing)**
```bash
npm run seed:admin-users
```

This creates 5 sample users:
- `admin` / `ChangeMe@123` - SUPER_ADMIN
- `product` / `ChangeMe@123` - PRODUCT_MANAGER
- `order` / `ChangeMe@123` - ORDER_MANAGER
- `editor` / `ChangeMe@123` - CONTENT_EDITOR
- `viewer` / `ChangeMe@123` - VIEWER

**Option 2: Create single admin user**
```bash
npm run create:admin-user
```

**Option 3: Migrate from old users collection**
```bash
npm run migrate:users-to-admin-users
```

**⚠️ Security:** All users must change password on first login!

### 6. Access Admin Panel

1. Navigate to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Login with your admin credentials
3. If `must_change_password` is true, you'll be redirected to change password page

## 📁 Cấu trúc dự án

```
shop-gau-bong/
├── app/                    # Next.js App Router
│   ├── (shop)/            # Shop routes
│   ├── admin/             # Admin panel routes
│   ├── api/               # API routes
│   │   ├── cms/           # Public CMS API routes
│   │   ├── admin/         # Admin API routes (authenticated)
│   │   └── auth/          # NextAuth.js routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/             # React Components
│   ├── ui/                # Base UI components (Shadcn)
│   ├── product/           # Product components
│   ├── cart/              # Cart components
│   └── layout/            # Layout components
├── lib/                    # Utilities
│   ├── api/               # API client
│   │   └── cms.ts         # Custom CMS API client
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
│   │   ├── sanitizeHtml.ts # HTML sanitization
│   │   └── cn.ts          # Class name utility
│   ├── constants/         # Constants
│   │   └── config.ts     # Site configuration
│   └── providers/         # React providers
│       └── QueryProvider.tsx # React Query provider
├── types/                 # TypeScript types
│   ├── mongodb.ts         # MongoDB types
│   └── woocommerce.ts     # WooCommerce types (deprecated, for backward compatibility)
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

- [Schema Context](./docs/SCHEMA_CONTEXT.md) - MongoDB schema structure
- [Design System](./docs/DESIGN_SYSTEM.md) - Color palette, typography, components
- [Order Management System](./docs/ORDER_MANAGEMENT_SYSTEM_PROGRESS.md) - Order management features
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions

**Note:** Legacy documentation about WordPress/WooCommerce is kept for historical reference only. The system now uses Custom CMS with MongoDB.

## 🔑 Tính năng chính

- ✅ Product listing & detail pages với filters và search
- ✅ Product variations (size, color) với dynamic pricing
- ✅ Shopping cart với volumetric weight calculation
- ✅ Guest checkout (no authentication required)
- ✅ Checkout flow với address selector (Province/District/Ward)
- ✅ Payment integration (VietQR, MoMo, COD, Bank Transfer)
- ✅ Order management
- ✅ React Query caching cho performance optimization
- ✅ Mobile-first responsive design (90% mobile traffic)

## 📄 License

This project is licensed under the MIT License.
