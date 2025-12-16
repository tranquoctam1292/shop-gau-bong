# CHECKLIST KHỞI TẠO DỰ ÁN

## Phase 1: Setup WordPress Backend

### 1.1. Cài đặt WordPress
- [ ] Mua hosting WordPress hoặc setup local với XAMPP/WAMP/MAMP
- [ ] Cài đặt WordPress mới nhất
- [ ] Cấu hình database
- [ ] Setup SSL certificate (HTTPS)
- [ ] Cấu hình permalink structure (Settings > Permalinks)

### 1.2. Cài đặt Plugins
- [ ] **WooCommerce** - E-commerce plugin
  - [ ] Kích hoạt và chạy setup wizard
  - [ ] Cấu hình store settings
  - [ ] Setup payment gateways
  - [ ] Cấu hình shipping zones
  - [ ] Cấu hình tax settings
  
- [ ] **JWT Authentication for WP REST API** hoặc **Application Passwords**
  - [ ] Kích hoạt plugin
  - [ ] Cấu hình JWT secret key
  - [ ] Test API authentication

- [ ] **Advanced Custom Fields (ACF)** - Optional
  - [ ] Cài đặt plugin
  - [ ] Tạo custom fields cho products

- [ ] **CORS Headers** plugin - Để cho phép Next.js gọi API
  - [ ] Cài đặt plugin
  - [ ] Cấu hình allowed origins

### 1.3. Cấu hình WooCommerce REST API
- [ ] Vào WooCommerce > Settings > Advanced > REST API
- [ ] Tạo API key mới
- [ ] Chọn permissions: Read/Write
- [ ] Lưu Consumer Key và Consumer Secret
- [ ] Test API với Postman/curl

### 1.4. Tạo dữ liệu mẫu
- [ ] Tạo product categories (Danh mục gấu bông)
- [ ] Thêm ít nhất 10-20 sản phẩm mẫu
- [ ] Upload hình ảnh sản phẩm
- [ ] Cấu hình product attributes (Size, Color, Material)
- [ ] Tạo product variations (nếu cần)

### 1.5. Cấu hình CORS
Thêm vào `wp-config.php` hoặc sử dụng plugin:
```php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

---

## Phase 2: Setup Next.js Frontend

### 2.1. Khởi tạo project
- [ ] Tạo Next.js project: `npx create-next-app@latest .`
- [ ] Chọn TypeScript
- [ ] Chọn Tailwind CSS
- [ ] Chọn App Router
- [ ] Cài đặt dependencies từ `package.json`

### 2.2. Cài đặt dependencies
```bash
npm install @tanstack/react-query zustand react-hook-form zod @hookform/resolvers axios clsx tailwind-merge lucide-react
```

### 2.3. Setup TypeScript
- [ ] Kiểm tra `tsconfig.json` đã đúng cấu hình
- [ ] Tạo file `types/` cho TypeScript definitions

### 2.4. Setup Tailwind CSS
- [ ] Kiểm tra `tailwind.config.js`
- [ ] Tạo file `app/globals.css` với Tailwind directives
- [ ] Cấu hình theme colors

### 2.5. Tạo cấu trúc thư mục
- [ ] Tạo folder `app/` với App Router structure
- [ ] Tạo folder `components/`
- [ ] Tạo folder `lib/`
- [ ] Tạo folder `types/`
- [ ] Tạo folder `public/`

### 2.6. Setup API Client
- [ ] Tạo file `lib/api/wordpress.ts` - WordPress REST API client
- [ ] Tạo file `lib/api/woocommerce.ts` - WooCommerce API client
- [ ] Tạo file `lib/api/auth.ts` - Authentication client
- [ ] Test API connection

### 2.7. Environment Variables
- [ ] Copy `.env.example` thành `.env.local`
- [ ] Điền các giá trị cần thiết
- [ ] Không commit `.env.local` vào Git

---

## Phase 3: Development Setup

### 3.1. Git Setup
- [ ] Khởi tạo Git repository: `git init`
- [ ] Tạo `.gitignore`
- [ ] Commit initial files
- [ ] Tạo GitHub/GitLab repository
- [ ] Push code lên remote

### 3.2. Development Tools
- [ ] Setup ESLint
- [ ] Setup Prettier (optional)
- [ ] Setup VS Code extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript

### 3.3. Base Components
- [ ] Tạo layout components (Header, Footer, Navbar)
- [ ] Tạo base UI components (Button, Card, Input)
- [ ] Setup shadcn/ui (nếu sử dụng)

### 3.4. Routing Structure
- [ ] Tạo homepage (`app/page.tsx`)
- [ ] Tạo product listing page
- [ ] Tạo product detail page
- [ ] Tạo cart page
- [ ] Tạo checkout page
- [ ] Tạo auth pages (login, register)

---

## Phase 4: Core Features Development

### 4.1. Product Features
- [ ] Product listing với pagination
- [ ] Product detail page
- [ ] Product search
- [ ] Product filters (category, price, size, color)
- [ ] Product sorting

### 4.2. Cart Features
- [ ] Add to cart functionality
- [ ] Cart page
- [ ] Update quantity
- [ ] Remove item
- [ ] Cart persistence (localStorage)

### 4.3. Checkout Features
- [ ] Checkout form
- [ ] Shipping address
- [ ] Payment method selection
- [ ] Order creation
- [ ] Order confirmation

### 4.4. User Features
- [ ] User registration
- [ ] User login
- [ ] User profile
- [ ] Order history
- [ ] Wishlist (optional)

---

## Phase 5: Testing & Optimization

### 5.1. Testing
- [ ] Test tất cả user flows
- [ ] Test responsive design
- [ ] Test cross-browser compatibility
- [ ] Test API integration
- [ ] Fix bugs

### 5.2. Performance
- [ ] Optimize images
- [ ] Implement lazy loading
- [ ] Setup caching
- [ ] Optimize bundle size
- [ ] Test page load speed

### 5.3. SEO
- [ ] Add meta tags
- [ ] Add Open Graph tags
- [ ] Generate sitemap
- [ ] Setup robots.txt
- [ ] Add structured data

---

## Phase 6: Deployment

### 6.1. WordPress Deployment
- [ ] Backup database
- [ ] Backup files
- [ ] Update WordPress & plugins
- [ ] Test production API
- [ ] Setup monitoring

### 6.2. Next.js Deployment
- [ ] Setup Vercel/Netlify account
- [ ] Connect Git repository
- [ ] Configure environment variables
- [ ] Deploy staging environment
- [ ] Test staging
- [ ] Deploy production
- [ ] Setup custom domain
- [ ] Setup SSL

### 6.3. Post-Deployment
- [ ] Test all features trên production
- [ ] Setup analytics
- [ ] Setup error tracking
- [ ] Create backup schedule
- [ ] Document deployment process

---

## Phase 7: Documentation

### 7.1. Technical Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] Setup guide
- [ ] Deployment guide

### 7.2. User Documentation
- [ ] Admin user guide
- [ ] Customer FAQ
- [ ] Troubleshooting guide

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

---

**Lưu ý**: Đánh dấu từng mục khi hoàn thành để theo dõi tiến độ!

