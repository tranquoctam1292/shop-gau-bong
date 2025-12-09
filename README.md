# 🧸 Shop Gấu Bông - E-commerce Website

Website thương mại điện tử bán gấu bông được xây dựng với **WordPress (Headless CMS)** và **Next.js 14 (App Router)**.

## 🚀 Tech Stack

### Frontend
- **Next.js 14+** - React framework với App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling với Design System
- **Apollo Client** - GraphQL client
- **GraphQL Code Generator** - Auto-generate TypeScript types
- **Zustand** - State management
- **React Hook Form + Zod** - Form handling & validation

### Backend
- **WordPress 6.0+** - Headless CMS
- **WooCommerce** - E-commerce plugin
- **WPGraphQL** - GraphQL API cho WordPress
- **WPGraphQL WooCommerce** - GraphQL extension cho WooCommerce

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
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://your-wordpress-site.com/graphql
```

### 4. Generate GraphQL types
```bash
npm run codegen
```

**Lưu ý:** Cần WordPress endpoint sẵn sàng để generate types.

### 5. Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## 📁 Cấu trúc dự án

```
shop-gau-bong/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (shop)/            # Shop routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/             # React Components
│   └── ui/                # Base UI components
├── lib/                    # Utilities
│   ├── api/               # GraphQL client & queries
│   │   ├── graphql.ts     # Apollo Client setup
│   │   ├── queries/       # GraphQL queries
│   │   └── mutations/     # GraphQL mutations
│   ├── utils/            # Helper functions
│   │   ├── shipping.ts    # Volumetric weight calculation
│   │   ├── format.ts      # Price formatting
│   │   └── cn.ts          # Class name utility
│   └── providers/        # React providers
├── types/                 # TypeScript types
│   └── generated/        # Auto-generated từ GraphQL
├── docs/                  # Documentation
└── public/                # Static assets
```

## 📝 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint
- `npm run type-check` - TypeScript type checking
- `npm run codegen` - Generate GraphQL types
- `npm run codegen:watch` - Watch mode cho codegen

## 🎨 Design System

Xem file `docs/DESIGN_SYSTEM.md` để biết:
- Color Palette
- Typography
- Component styling rules
- Mobile First guidelines

## 📚 Tài liệu

- [Kế hoạch dự án](./KE_HOACH_DU_AN.md)
- [Theo dõi tiến độ](./TIEN_DO_DU_AN.md)
- [Hướng dẫn cấu hình](./HUONG_DAN_CAU_HINH.md)
- [Schema Context](./docs/SCHEMA_CONTEXT.md)
- [API Patterns](./docs/API_PATTERNS.graphql)

## 🔑 Tính năng chính

- ✅ Product listing & detail pages
- ✅ Shopping cart với volumetric weight calculation
- ✅ User authentication
- ✅ Checkout flow
- ✅ Payment integration (VietQR, MoMo, ZaloPay)
- ✅ Order management
- ✅ Mobile-first responsive design

## 📄 License

This project is licensed under the MIT License.
