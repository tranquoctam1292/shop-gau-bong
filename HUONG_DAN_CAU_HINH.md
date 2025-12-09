# HƯỚNG DẪN CẤU HÌNH DỰ ÁN

## 1. CẤU HÌNH WORDPRESS BACKEND

### 1.1. Cài đặt WordPress Local (XAMPP) - Cho Development

**Lưu ý:** Sử dụng XAMPP cho local development, sau đó deploy lên hosting chuyên nghiệp cho Staging/Production.

#### Bước 1: Cài đặt XAMPP
1. **Download XAMPP:**
   - Windows: https://www.apachefriends.org/download.html
   - Mac: Sử dụng MAMP thay vì XAMPP
   - Linux: Cài đặt Apache, MySQL, PHP riêng

2. **Cài đặt XAMPP:**
   - Chạy installer
   - Chọn components: Apache, MySQL, PHP, phpMyAdmin
   - Cài đặt vào `C:\xampp` (Windows) hoặc thư mục tương ứng

3. **Khởi động Services:**
   - Mở XAMPP Control Panel
   - Start Apache
   - Start MySQL

#### Bước 2: Cài đặt WordPress trên XAMPP
1. **Download WordPress:**
   - Download từ https://wordpress.org/download/
   - Giải nén file ZIP

2. **Copy WordPress vào htdocs:**
   - Copy folder WordPress vào `C:\xampp\htdocs\wordpress` (hoặc tên khác bạn muốn)
   - Hoặc đổi tên folder thành tên project của bạn

3. **Tạo Database:**
   - Mở phpMyAdmin: `http://localhost/phpmyadmin`
   - Tạo database mới (vd: `shop_gau_bong`)
   - Chọn collation: `utf8mb4_unicode_ci`

4. **Cài đặt WordPress:**
   - Mở trình duyệt: `http://localhost/wordpress` (hoặc tên folder bạn đặt)
   - Chọn ngôn ngữ: Tiếng Việt
   - Điền thông tin database:
     - Database Name: `shop_gau_bong` (hoặc tên bạn đã tạo)
     - Username: `root`
     - Password: (để trống - mặc định XAMPP)
     - Database Host: `localhost`
     - Table Prefix: `wp_` (hoặc tùy chỉnh)
   - Chạy installation
   - Điền thông tin site và admin user

5. **Cấu hình WordPress:**
   - Login vào WordPress Admin: `http://localhost/wordpress/wp-admin`
   - Cấu hình Settings > General
   - Cấu hình Permalink: Settings > Permalinks (chọn "Post name")

### 1.2. Cài đặt WordPress trên Hosting (Staging & Production)

**Lưu ý:** Sau khi develop xong trên local, deploy lên hosting cho Staging và Production.

#### Bước 1: Chọn và Mua Hosting
1. **Chọn Hosting Provider:**
   - **WP Engine** - Tối ưu cho WordPress, có staging environment built-in
   - **SiteGround** - Giá tốt, performance tốt
   - **Cloudways** - Flexible, có thể chọn cloud provider
   - **Kinsta** - Premium, performance cao
   - **Vietnix, P.A Vietnam** - Hosting Việt Nam, hỗ trợ tiếng Việt

2. **Yêu cầu Hosting:**
   - PHP 8.0+ (khuyến nghị PHP 8.1+)
   - MySQL 5.7+ hoặc MariaDB 10.3+
   - SSL Certificate (Let's Encrypt hoặc paid)
   - Staging environment (hoặc có thể tạo subdomain/subdirectory)
   - SSH access (optional nhưng recommended)
   - Backup tự động

#### Bước 2: Setup Staging Environment
1. **Tạo Staging Site:**
   - Nếu hosting có staging built-in: Sử dụng tính năng staging của hosting
   - Nếu không: Tạo subdomain (vd: `staging.yourdomain.com`) hoặc subdirectory
   
2. **Cài đặt WordPress trên Staging:**
   - Upload WordPress qua FTP/SFTP hoặc sử dụng hosting control panel
   - Tạo database mới cho staging
   - Chạy WordPress installer tại staging URL
   - Cấu hình SSL cho staging

3. **Migrate từ Local (nếu cần):**
   - Export database từ local (phpMyAdmin > Export)
   - Import vào staging database
   - Update URLs trong database (sử dụng plugin "Better Search Replace")

#### Bước 3: Setup Production Environment
1. **Cài đặt WordPress trên Production:**
   - Upload WordPress lên production domain
   - Tạo database mới cho production
   - Chạy WordPress installer tại production URL
   - Cấu hình SSL cho production (bắt buộc)

2. **Migrate từ Staging:**
   - Export database từ staging
   - Import vào production database
   - Update URLs trong database
   - Switch payment gateways sang Live Mode ⚠️

### 1.2. Cài đặt WooCommerce

1. Vào WordPress Admin > Plugins > Add New
2. Tìm "WooCommerce" và cài đặt
3. Kích hoạt plugin
4. Chạy WooCommerce Setup Wizard:
   - Chọn địa điểm cửa hàng
   - Chọn loại sản phẩm
   - Cấu hình thanh toán
   - Cấu hình vận chuyển
   - Cấu hình thuế

### 1.3. Cấu hình WooCommerce REST API

1. Vào **WooCommerce > Settings > Advanced > REST API**
2. Click **Add key**
3. Điền thông tin:
   - **Description**: Next.js Frontend
   - **User**: Chọn admin user
   - **Permissions**: Read/Write
4. Click **Generate API key**
5. **Lưu lại**:
   - Consumer Key
   - Consumer Secret

### 1.4. Cài đặt JWT Authentication

#### Option 1: JWT Authentication for WP REST API
1. Cài đặt plugin "JWT Authentication for WP REST API"
2. Thêm vào `wp-config.php`:
```php
define('JWT_AUTH_SECRET_KEY', 'your-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

#### Option 2: Application Passwords (Built-in WordPress)
- WordPress 5.6+ có sẵn Application Passwords
- Vào Users > Profile > Application Passwords
- Tạo password mới cho Next.js app

### 1.5. Cấu hình CORS

Thêm vào `functions.php` của theme hoặc tạo custom plugin:

```php
// Allow CORS
function add_cors_http_header(){
    // Cho phép localhost (XAMPP development) và staging/production domains
    $allowed_origins = [
      'http://localhost:3000',  // Next.js local development
      'https://staging-nextjs.yourdomain.com',  // Next.js staging
      'https://yourdomain.com'  // Next.js production
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed_origins)) {
      header("Access-Control-Allow-Origin: $origin");
    }
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}
add_action('init','add_cors_http_header');
```

Hoặc sử dụng plugin "CORS Headers".

### 1.6. Tạo dữ liệu mẫu

1. **Tạo Categories**:
   - Vào Products > Categories
   - Tạo các danh mục: Gấu bông nhỏ, Gấu bông lớn, Gấu bông theo chủ đề, etc.

2. **Tạo Products**:
   - Vào Products > Add New
   - Thêm thông tin sản phẩm
   - Upload hình ảnh
   - Chọn category
   - Cấu hình giá
   - Cấu hình inventory (stock)

3. **Cấu hình Attributes** (nếu cần):
   - Vào Products > Attributes
   - Tạo: Size (S, M, L, XL), Color, Material
   - Gán attributes cho products

---

## 2. CẤU HÌNH NEXT.JS FRONTEND

### 2.1. Khởi tạo Project

```bash
# Tạo Next.js project
npx create-next-app@latest shop-gau-bong --typescript --tailwind --app

# Hoặc nếu đã có folder
cd shop-gau-bong
npx create-next-app@latest . --typescript --tailwind --app
```

### 2.2. Cài đặt Dependencies

```bash
# Core dependencies
npm install @tanstack/react-query zustand react-hook-form zod @hookform/resolvers axios clsx tailwind-merge lucide-react

# Optional: UI library
npx shadcn-ui@latest init

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom
```

### 2.3. Cấu hình Environment Variables

Tạo file `.env.local`:

```env
# WordPress URL
NEXT_PUBLIC_WORDPRESS_URL=http://localhost/wordpress
# hoặc production: https://your-wordpress-site.com

# WooCommerce API
NEXT_PUBLIC_WOOCOMMERCE_KEY=ck_your_key_here
NEXT_PUBLIC_WOOCOMMERCE_SECRET=cs_your_secret_here

# JWT (nếu sử dụng)
JWT_SECRET=your_jwt_secret

# Payment (Stripe)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

### 2.4. Tạo API Client

Tạo file `lib/api/woocommerce.ts`:

```typescript
import axios from 'axios';

const WOOCOMMERCE_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL;
const CONSUMER_KEY = process.env.NEXT_PUBLIC_WOOCOMMERCE_KEY;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WOOCOMMERCE_SECRET;

const woocommerceApi = axios.create({
  baseURL: `${WOOCOMMERCE_URL}/wp-json/wc/v3`,
  auth: {
    username: CONSUMER_KEY!,
    password: CONSUMER_SECRET!,
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

export default woocommerceApi;
```

### 2.5. Test API Connection

Tạo file `app/api/test/route.ts`:

```typescript
import woocommerceApi from '@/lib/api/woocommerce';

export async function GET() {
  try {
    const response = await woocommerceApi.get('/products');
    return Response.json({ success: true, data: response.data });
  } catch (error) {
    return Response.json({ success: false, error }, { status: 500 });
  }
}
```

Truy cập `http://localhost:3000/api/test` để kiểm tra.

---

## 3. CẤU HÌNH DEPLOYMENT

### 3.1. WordPress Deployment Strategy

**Với Hosting Chuyên Nghiệp, workflow như sau:**

#### Development Workflow:
1. **Develop trên Staging:**
   - Tất cả thay đổi được test trên Staging trước
   - Staging là môi trường gần giống Production nhất
   - Next.js local development point to Staging WordPress

2. **Test trên Staging:**
   - Test tất cả features trên Staging
   - Test payment gateways (test mode)
   - Test GraphQL queries
   - Test integration giữa Next.js staging và WordPress staging

3. **Deploy lên Production:**
   - Sau khi test xong trên Staging
   - Deploy WordPress changes lên Production (nếu có)
   - Deploy Next.js lên Production
   - Switch payment gateways sang live mode

#### WordPress Staging Maintenance:
1. **Regular Updates:**
   - Update WordPress core trên Staging trước
   - Update plugins trên Staging trước
   - Test sau khi update
   - Nếu OK, mới update lên Production

2. **Backup Strategy:**
   - Sử dụng backup tự động của hosting (nếu có)
   - Hoặc setup backup plugin (UpdraftPlus, BackupBuddy)
   - Backup cả Staging và Production
   - Test restore process định kỳ

3. **Security:**
   - Setup security plugin (Wordfence, Sucuri, etc.)
   - Enable SSL cho cả Staging và Production
   - Setup firewall rules
   - Regular security scans

4. **Performance:**
   - Install caching plugin (WP Super Cache, W3 Total Cache, WP Rocket)
   - Optimize images (Smush, ShortPixel)
   - Setup CDN (Cloudflare, MaxCDN)
   - Database optimization

### 3.2. Next.js Production (Vercel)

1. **Setup Vercel**:
   - Tạo account tại vercel.com
   - Connect GitHub/GitLab repository
   - Import project

2. **Environment Variables**:
   - Vào Project Settings > Environment Variables
   - Thêm tất cả variables từ `.env.local`

3. **Deploy**:
   - Vercel tự động deploy khi push code
   - Hoặc click "Deploy" trong dashboard

4. **Custom Domain**:
   - Vào Project Settings > Domains
   - Thêm domain của bạn
   - Cấu hình DNS records

### 3.3. Next.js Production (Netlify)

1. **Setup Netlify**:
   - Tạo account tại netlify.com
   - Connect Git repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`

2. **Environment Variables**:
   - Vào Site Settings > Environment Variables
   - Thêm variables

3. **Deploy**:
   - Netlify tự động deploy

---

## 4. TROUBLESHOOTING

### 4.1. CORS Errors

**Vấn đề**: Browser chặn API requests do CORS

**Giải pháp**:
- Cấu hình CORS headers trong WordPress
- Sử dụng Next.js API routes làm proxy
- Hoặc sử dụng server-side rendering

### 4.2. API Authentication Failed

**Vấn đề**: 401 Unauthorized khi gọi API

**Giải pháp**:
- Kiểm tra Consumer Key và Secret
- Kiểm tra permissions (Read/Write)
- Kiểm tra WordPress URL

### 4.3. Images Not Loading

**Vấn đề**: Hình ảnh không hiển thị

**Giải pháp**:
- Cấu hình `next.config.js` với `images.domains`
- Sử dụng Next.js Image component
- Kiểm tra CORS cho images

### 4.4. Build Errors

**Vấn đề**: Lỗi khi build Next.js

**Giải pháp**:
- Kiểm tra TypeScript errors
- Kiểm tra environment variables
- Kiểm tra dependencies

---

## 5. TÀI LIỆU THAM KHẢO

### WordPress
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [WooCommerce REST API Docs](https://woocommerce.github.io/woocommerce-rest-api-docs/)
- [JWT Authentication Plugin](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/)

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Query](https://tanstack.com/query/latest)

### Tools
- [Postman](https://www.postman.com/) - Test API
- [WordPress REST API Tester](https://wordpress.org/plugins/rest-api-tester/) - Test WordPress API

---

**Lưu ý**: Luôn test trên môi trường development trước khi deploy production!

