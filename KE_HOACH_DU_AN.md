# KẾ HOẠCH CHI TIẾT DỰ ÁN WEBSITE BÁN GẤU BÔNG

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Mục tiêu
Xây dựng website thương mại điện tử bán gấu bông với:
- **Backend**: WordPress (Headless CMS)
- **Frontend**: Next.js (React Framework)
- **Kiến trúc**: JAMstack (JavaScript, APIs, Markup)

### 1.2. Phạm vi dự án
- Quản lý sản phẩm (gấu bông)
- Quản lý đơn hàng
- Quản lý khách hàng
- Thanh toán trực tuyến
- Tìm kiếm và lọc sản phẩm
- Quản lý giỏ hàng
- Blog/Tin tức
- SEO tối ưu

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1. Kiến trúc tổng thể
```
┌─────────────────┐
│   Next.js App   │ (Frontend - Vercel/Netlify)
│   (React/SSR)   │
└────────┬────────┘
         │ WPGraphQL
         │ (Single Endpoint)
         │
┌────────▼────────┐
│   WordPress     │ (Backend - Headless CMS)
│   (WooCommerce) │
│   + WPGraphQL   │
└────────┬────────┘
         │
┌────────▼────────┐
│   MySQL DB      │ (Database)
└─────────────────┘
```

### 2.2. Công nghệ sử dụng

#### Backend (WordPress)
- WordPress 6.0+
- WooCommerce Plugin
- **WPGraphQL Plugin** (GraphQL API cho WordPress)
- **WPGraphQL WooCommerce Extension** (GraphQL cho WooCommerce)
- JWT Authentication Plugin (hoặc WPGraphQL JWT Authentication)
- Custom Post Types cho sản phẩm
- ACF (Advanced Custom Fields) với WPGraphQL ACF support

#### Frontend (Next.js)
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS / shadcn/ui
- **GraphQL Client** (Apollo Client / urql / graphql-request)
- **GraphQL Code Generator** (Tự động generate TypeScript types từ GraphQL schema)
- React Query / SWR (Data Fetching - optional, có thể dùng với GraphQL)
- Zustand / Redux Toolkit (State Management)
- React Hook Form (Form Handling)
- NextAuth.js (Authentication)
- **VietQR / MoMo / ZaloPay** (Payment Gateway - Ưu tiên cho thị trường Việt Nam)
- Stripe / PayPal (Payment Gateway - Optional, cho khách hàng quốc tế)

#### Infrastructure
- Vercel / Netlify (Frontend Hosting)
- WordPress Hosting (Backend)
- CDN (Cloudflare)
- Image Optimization (Next.js Image / Cloudinary)

---

## 3. CẤU TRÚC DATABASE

### 3.1. WordPress Database Schema

#### WooCommerce Tables
- `wp_posts` - Sản phẩm, đơn hàng
- `wp_postmeta` - Metadata sản phẩm
- `wp_terms` - Danh mục, thẻ
- `wp_term_relationships` - Quan hệ sản phẩm-danh mục
- `wp_users` - Người dùng
- `wp_woocommerce_order_items` - Chi tiết đơn hàng
- `wp_woocommerce_order_itemmeta` - Metadata đơn hàng

#### Custom Fields (ACF)
**Sản phẩm (Product)**
- `product_size` - Kích thước (S, M, L, XL)
- `product_material` - Chất liệu
- `product_color` - Màu sắc
- `product_weight` - Trọng lượng thực tế (kg) - **Bắt buộc**
- `product_length` - Chiều dài (cm) - **Bắt buộc cho tính phí vận chuyển**
- `product_width` - Chiều rộng (cm) - **Bắt buộc cho tính phí vận chuyển**
- `product_height` - Chiều cao (cm) - **Bắt buộc cho tính phí vận chuyển**
- `product_volumetric_weight` - Cân nặng quy đổi (tự động tính: Dài x Rộng x Cao / 6000)
- `product_images_gallery` - Thư viện ảnh
- `product_video` - Video giới thiệu
- `product_rating` - Đánh giá
- `product_reviews` - Bình luận

**Lưu ý**: Đối với sản phẩm gấu bông, hệ thống sẽ tính phí vận chuyển dựa trên **cân nặng lớn hơn** giữa:
- Cân nặng thực tế (`product_weight`)
- Cân nặng quy đổi thể tích (`product_volumetric_weight = length × width × height / 6000`)

**Danh mục (Category)**
- `category_icon` - Icon danh mục
- `category_banner` - Banner danh mục

---

## 4. API ARCHITECTURE - WPGraphQL

### 4.1. Tổng quan WPGraphQL

**Lý do chọn WPGraphQL thay vì REST API:**
- **Tránh Over-fetching/Under-fetching**: Client chỉ request đúng dữ liệu cần thiết
- **Single Endpoint**: Tất cả queries/mutations qua một endpoint `/graphql`
- **Type Safety**: Tự động generate TypeScript types từ GraphQL schema
- **Performance**: Giảm số lượng HTTP requests, tối ưu cho Next.js SSR/SSG
- **Developer Experience**: GraphQL queries dễ đọc, dễ maintain hơn REST endpoints

**GraphQL Endpoint:**
```
POST /graphql
```

### 4.2. GraphQL Queries (Read Operations)

#### Products Queries
```graphql
# Lấy danh sách sản phẩm với filters
query GetProducts($first: Int, $after: String, $categoryId: ID, $search: String) {
  products(first: $first, after: $after, where: { categoryId: $categoryId, search: $search }) {
    nodes {
      id
      databaseId
      name
      slug
      price
      regularPrice
      salePrice
      image {
        sourceUrl
        altText
      }
      categories {
        nodes {
          name
          slug
        }
      }
      attributes {
        nodes {
          name
          options
        }
      }
      # Custom fields từ ACF
      productWeight
      productLength
      productWidth
      productHeight
      productVolumetricWeight
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

# Lấy chi tiết sản phẩm
query GetProduct($id: ID!, $idType: ProductIdTypeEnum) {
  product(id: $id, idType: $idType) {
    id
    name
    description
    shortDescription
    price
    regularPrice
    salePrice
    stockStatus
    stockQuantity
    galleryImages {
      nodes {
        sourceUrl
        altText
      }
    }
    attributes {
      nodes {
        name
        options
        variation
      }
    }
    variations {
      nodes {
        id
        name
        price
        stockStatus
        attributes {
          nodes {
            name
            value
          }
        }
      }
    }
    # Custom fields
    productWeight
    productLength
    productWidth
    productHeight
    productVolumetricWeight
    productMaterial
    productColor
  }
}

# Tìm kiếm sản phẩm
query SearchProducts($search: String!, $first: Int) {
  products(first: $first, where: { search: $search }) {
    nodes {
      id
      name
      slug
      price
      image {
        sourceUrl
      }
    }
  }
}
```

#### Categories Queries
```graphql
query GetCategories {
  productCategories {
    nodes {
      id
      name
      slug
      description
      image {
        sourceUrl
      }
      count
    }
  }
}

query GetCategory($id: ID!) {
  productCategory(id: $id) {
    id
    name
    slug
    description
    products(first: 20) {
      nodes {
        id
        name
        price
        image {
          sourceUrl
        }
      }
    }
  }
}
```

#### Cart Queries
```graphql
query GetCart {
  cart {
    contents {
      nodes {
        key
        product {
          node {
            id
            name
            price
            image {
              sourceUrl
            }
          }
        }
        quantity
        subtotal
        total
      }
    }
    subtotal
    total
    shippingTotal
    totalTax
    feeTotal
    discountTotal
  }
}
```

#### Orders Queries
```graphql
query GetOrders($customerId: ID!) {
  orders(where: { customerId: $customerId }) {
    nodes {
      id
      orderNumber
      date
      status
      total
      lineItems {
        nodes {
          product {
            node {
              name
              image {
                sourceUrl
              }
            }
          }
          quantity
          total
        }
      }
      shipping {
        address1
        city
        postcode
      }
    }
  }
}

query GetOrder($id: ID!) {
  order(id: $id) {
    id
    orderNumber
    date
    status
    total
    subtotal
    shippingTotal
    totalTax
    lineItems {
      nodes {
        product {
          node {
            name
            image {
              sourceUrl
            }
          }
        }
        quantity
        total
      }
    }
    billing {
      firstName
      lastName
      email
      phone
      address1
      city
      postcode
    }
    shipping {
      firstName
      lastName
      address1
      city
      postcode
    }
  }
}
```

### 4.3. GraphQL Mutations (Write Operations)

#### Cart Mutations
```graphql
mutation AddToCart($productId: Int!, $quantity: Int, $variationId: Int) {
  addToCart(
    input: {
      productId: $productId
      quantity: $quantity
      variationId: $variationId
    }
  ) {
    cartItem {
      key
      product {
        node {
          id
          name
          price
        }
      }
      quantity
    }
    cart {
      contents {
        nodes {
          key
          product {
            node {
              id
              name
            }
          }
          quantity
        }
      }
      total
    }
  }
}

mutation UpdateCartItem($key: ID!, $quantity: Int!) {
  updateItemQuantities(input: { items: [{ key: $key, quantity: $quantity }] }) {
    cart {
      contents {
        nodes {
          key
          quantity
        }
      }
      total
    }
  }
}

mutation RemoveCartItem($key: ID!) {
  removeItemsFromCart(input: { keys: [$key] }) {
    cart {
      contents {
        nodes {
          key
        }
      }
      total
    }
  }
}
```

#### Order Mutations
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    order {
      id
      orderNumber
      status
      total
    }
    clientMutationId
  }
}
```

#### Authentication Mutations
```graphql
mutation Login($username: String!, $password: String!) {
  login(input: { username: $username, password: $password }) {
    authToken
    user {
      id
      name
      email
    }
  }
}

mutation Register($input: RegisterUserInput!) {
  registerUser(input: $input) {
    user {
      id
      name
      email
    }
  }
}
```

### 4.4. TypeScript Type Generation

**Setup GraphQL Code Generator:**
```yaml
# codegen.yml
schema: 'https://your-wordpress-site.com/graphql'
documents: 'lib/graphql/**/*.graphql'
generates:
  types/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

**Lợi ích:**
- Tự động generate TypeScript types từ GraphQL schema
- Type-safe queries/mutations
- Auto-completion trong IDE
- Compile-time error checking
- Giảm bugs và tăng developer productivity

---

## 5. CẤU TRÚC FRONTEND (NEXT.JS)

### 5.1. Thư mục dự án
```
shop-gau-bong/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth routes
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (shop)/                  # Shop routes
│   │   ├── products/
│   │   │   ├── [slug]/
│   │   │   └── category/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── orders/
│   ├── (blog)/                  # Blog routes
│   │   └── posts/
│   ├── about/
│   ├── contact/
│   ├── layout.tsx
│   └── page.tsx                 # Homepage
├── components/                   # React Components
│   ├── ui/                      # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── product/                 # Product components
│   │   ├── ProductCard.tsx
│   │   ├── ProductList.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── ProductFilter.tsx
│   │   └── ProductGallery.tsx
│   ├── cart/                    # Cart components
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartDrawer.tsx
│   └── checkout/                # Checkout components
│       ├── CheckoutForm.tsx
│       ├── PaymentMethod.tsx
│       └── OrderSummary.tsx
├── lib/                         # Utilities
│   ├── api/                     # API clients
│   │   ├── graphql.ts           # GraphQL client setup
│   │   ├── queries/             # GraphQL queries
│   │   │   ├── products.graphql
│   │   │   ├── cart.graphql
│   │   │   └── orders.graphql
│   │   ├── mutations/           # GraphQL mutations
│   │   │   ├── cart.graphql
│   │   │   └── orders.graphql
│   │   └── auth.ts              # Authentication helpers
│   ├── hooks/                   # Custom hooks
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   └── useAuth.ts
│   ├── utils/                   # Helper functions
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   └── store/                   # State management
│       ├── cartStore.ts
│       └── authStore.ts
├── types/                       # TypeScript types
│   ├── generated/               # Auto-generated từ GraphQL
│   │   └── graphql.ts
│   ├── product.ts               # Custom product types
│   ├── order.ts                 # Custom order types
│   └── user.ts                  # Custom user types
├── styles/                      # Global styles
│   └── globals.css
├── public/                      # Static assets
│   ├── images/
│   └── icons/
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 5.2. Các trang chính

#### Homepage (`app/page.tsx`)
- Hero section với banner
- Danh mục sản phẩm
- Sản phẩm nổi bật
- Sản phẩm mới nhất
- Sản phẩm bán chạy
- Testimonials
- Newsletter signup

#### Product Listing (`app/(shop)/products/page.tsx`)
- Grid/List view
- Filter sidebar (danh mục, giá, kích thước, màu sắc)
- Sort options
- Pagination
- Search bar

#### Product Detail (`app/(shop)/products/[slug]/page.tsx`)
- Product images gallery
- Product information
- Size/Color selector
- Quantity selector
- Add to cart button
- Product description
- Reviews & Ratings
- Related products

#### Shopping Cart (`app/(shop)/cart/page.tsx`)
- Cart items list
- Quantity update
- Remove item
- Cart summary
- Continue shopping
- Proceed to checkout

#### Checkout (`app/(shop)/checkout/page.tsx`)
- Customer information form
- Shipping address
- Payment method selection
- Order review
- Place order button

#### User Account (`app/(shop)/account/page.tsx`)
- Profile information
- Order history
- Addresses
- Wishlist
- Logout

---

## 6. TÍNH NĂNG CHI TIẾT

### 6.1. Quản lý sản phẩm

#### Hiển thị sản phẩm
- [ ] Grid/List view toggle
- [ ] Product card với hình ảnh, tên, giá
- [ ] Quick view modal
- [ ] Lazy loading images
- [ ] Image zoom on hover
- [ ] Product badges (New, Sale, Featured)

#### Lọc và tìm kiếm
- [ ] Filter by category
- [ ] Filter by price range
- [ ] Filter by size
- [ ] Filter by color
- [ ] Filter by material
- [ ] Search by keyword
- [ ] Sort by: Price, Name, Newest, Popularity
- [ ] URL query parameters cho filters

#### Chi tiết sản phẩm
- [ ] Image gallery với zoom
- [ ] Product variants (size, color)
- [ ] Stock status
- [ ] Add to cart
- [ ] Add to wishlist
- [ ] Share buttons
- [ ] Product tabs (Description, Reviews, Shipping)
- [ ] Related products
- [ ] Recently viewed products

### 6.2. Giỏ hàng

#### Chức năng
- [ ] Add to cart (với variants)
- [ ] Update quantity
- [ ] Remove item
- [ ] Cart drawer/sidebar
- [ ] Cart page
- [ ] Mini cart icon với badge
- [ ] Persistent cart (localStorage/cookies)
- [ ] Cart total calculation
- [ ] **Shipping cost calculation với Volumetric Weight**

#### 6.2.1. Logic tính phí vận chuyển theo thể tích (Volumetric Weight)

**Vấn đề:**
Sản phẩm gấu bông có đặc thù: **Rất nhẹ nhưng kích thước lớn (cồng kềnh)**. Nếu chỉ tính phí ship theo cân nặng thực tế, shop sẽ bị lỗ nặng tiền vận chuyển vì các đơn vị vận chuyển (Giao Hàng Nhanh, Viettel Post, etc.) tính phí dựa trên **thể tích** của gói hàng, không chỉ cân nặng.

**Giải pháp:**
Hệ thống phải tính phí ship dựa trên **cân nặng quy đổi thể tích** (Volumetric Weight) theo công thức chuẩn của ngành vận chuyển:

```
Volumetric Weight (kg) = (Length × Width × Height) / 6000
```

Trong đó:
- Length, Width, Height tính bằng **cm**
- Hệ số 6000 là chuẩn của hầu hết các đơn vị vận chuyển tại Việt Nam

**Logic tính toán:**
1. **Tính cân nặng quy đổi** cho mỗi sản phẩm:
   ```typescript
   const volumetricWeight = (length * width * height) / 6000;
   ```

2. **So sánh và lấy giá trị lớn hơn**:
   ```typescript
   const shippingWeight = Math.max(actualWeight, volumetricWeight);
   ```

3. **Tính tổng cân nặng cho toàn bộ giỏ hàng**:
   ```typescript
   const totalShippingWeight = cartItems.reduce((total, item) => {
     const itemWeight = Math.max(
       item.product.weight,
       (item.product.length * item.product.width * item.product.height) / 6000
     );
     return total + (itemWeight * item.quantity);
   }, 0);
   ```

4. **Tính phí ship** dựa trên bảng giá của đơn vị vận chuyển:
   - Ví dụ: 0-1kg: 30,000đ, 1-2kg: 40,000đ, 2-3kg: 50,000đ, etc.

**Implementation Requirements:**
- [ ] Validate kích thước sản phẩm (length, width, height) là bắt buộc khi tạo sản phẩm
- [ ] Auto-calculate `volumetric_weight` khi save product (hoặc tính real-time)
- [ ] Hiển thị cả "Cân nặng thực" và "Cân nặng quy đổi" trong product detail
- [ ] Tính phí ship ước tính trong cart preview
- [ ] Tính phí ship chính xác trong checkout
- [ ] Hiển thị breakdown phí ship (theo từng sản phẩm nếu cần)
- [ ] Cache shipping rates để tối ưu performance
- [ ] Support multiple shipping providers với bảng giá khác nhau

**Ví dụ thực tế:**
- Gấu bông lớn: 50cm × 40cm × 30cm, nặng 0.5kg
  - Volumetric weight = (50 × 40 × 30) / 6000 = **10kg**
  - Shipping weight = max(0.5kg, 10kg) = **10kg** ← Lấy giá trị này để tính phí
  - Phí ship sẽ tính theo 10kg, không phải 0.5kg

### 6.3. Thanh toán

#### Checkout Process
- [ ] Guest checkout
- [ ] User registration during checkout
- [ ] Shipping address form
- [ ] Billing address form
- [ ] Shipping method selection
- [ ] Payment method selection
- [ ] Order review
- [ ] Order confirmation
- [ ] Email notification

#### Payment Gateways

**Ưu tiên cho thị trường Việt Nam:**
- [ ] **VietQR Integration** - Thanh toán chuyển khoản tự động qua QR code
  - [ ] Tích hợp API VietQR
  - [ ] Tự động tạo QR code từ thông tin đơn hàng
  - [ ] Webhook xác nhận thanh toán tự động
  - [ ] Cập nhật trạng thái đơn hàng khi nhận được thanh toán
  
- [ ] **MoMo Payment** - Ví điện tử phổ biến tại Việt Nam
  - [ ] Tích hợp MoMo Payment Gateway
  - [ ] Thanh toán qua QR code hoặc app
  
- [ ] **ZaloPay Integration** - Ví điện tử Zalo
  - [ ] Tích hợp ZaloPay SDK
  - [ ] Thanh toán qua app ZaloPay

- [ ] **COD (Cash on Delivery)** - Thanh toán khi nhận hàng
  - [ ] Cấu hình phí COD
  - [ ] Xác nhận đơn hàng COD

- [ ] **Bank Transfer** - Chuyển khoản ngân hàng thủ công
  - [ ] Hiển thị thông tin tài khoản ngân hàng
  - [ ] Form upload ảnh chứng từ chuyển khoản
  - [ ] Admin xác nhận thanh toán thủ công

**Optional (cho khách hàng quốc tế):**
- [ ] Stripe integration (nếu cần)
- [ ] PayPal integration (nếu cần)

### 6.4. Quản lý đơn hàng

#### Khách hàng
- [ ] View order history
- [ ] Order details
- [ ] Order tracking
- [ ] Download invoice
- [ ] Cancel order (nếu cho phép)
- [ ] Reorder

#### Admin (WordPress)
- [ ] Order management trong WooCommerce
- [ ] Order status updates
- [ ] Email notifications
- [ ] Print shipping labels

### 6.5. Tài khoản người dùng

#### Đăng ký/Đăng nhập
- [ ] User registration
- [ ] Email verification
- [ ] Login với email/password
- [ ] Social login (Google, Facebook) - Optional
- [ ] Forgot password
- [ ] Reset password
- [ ] JWT token authentication

#### Profile
- [ ] View/edit profile
- [ ] Change password
- [ ] Manage addresses
- [ ] Wishlist
- [ ] Order history

### 6.6. Blog/Tin tức

#### Features
- [ ] Blog listing page
- [ ] Blog post detail
- [ ] Categories & Tags
- [ ] Related posts
- [ ] Comments
- [ ] Search blog posts
- [ ] RSS feed

### 6.7. SEO & Performance

#### SEO
- [ ] Meta tags (title, description)
- [ ] Open Graph tags
- [ ] Structured data (Schema.org)
- [ ] Sitemap.xml
- [ ] robots.txt
- [ ] Canonical URLs
- [ ] Alt text cho images

#### Performance
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Caching strategy
- [ ] CDN integration
- [ ] Server-side rendering (SSR)
- [ ] Static site generation (SSG) cho product pages
- [ ] Incremental Static Regeneration (ISR)

---

## 7. UI/UX DESIGN

### 7.1. Design System

#### Colors
- Primary: Soft pastel colors (pink, blue, yellow)
- Secondary: Neutral grays
- Accent: Bright colors cho CTAs
- Background: White/Light gray

#### Typography
- Headings: Playful, friendly font
- Body: Readable sans-serif
- Sizes: Responsive typography scale

#### Components
- Buttons: Rounded, soft shadows
- Cards: Rounded corners, subtle shadows
- Forms: Clean, accessible inputs
- Icons: Consistent icon set (Lucide/Feather)

### 7.2. Responsive Design
- Mobile First approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

### 7.3. Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Focus indicators
- Alt text cho images
- ARIA labels

---

## 8. BẢO MẬT

### 8.1. Security Measures
- [ ] HTTPS/SSL certificates
- [ ] JWT token authentication
- [ ] API rate limiting
- [ ] Input validation & sanitization
- [ ] XSS protection
- [ ] CSRF protection
- [ ] SQL injection prevention (WordPress built-in)
- [ ] Secure payment processing
- [ ] GDPR compliance
- [ ] Cookie consent banner

### 8.2. Data Protection
- [ ] Encrypted passwords
- [ ] Secure API endpoints
- [ ] Environment variables cho sensitive data
- [ ] Regular security updates

---

## 9. TESTING STRATEGY

### 9.1. Testing Types
- [ ] Unit tests (Jest, React Testing Library)
- [ ] Integration tests
- [ ] E2E tests (Playwright, Cypress)
- [ ] Performance testing
- [ ] Security testing
- [ ] Accessibility testing

### 9.2. Test Coverage
- Critical user flows:
  - Product browsing
  - Add to cart
  - Checkout process
  - User authentication
  - Order management

---

## 10. DEPLOYMENT

### 10.1. Frontend (Next.js)
- **Platform**: Vercel (recommended) hoặc Netlify
- **Build**: Automatic builds từ Git
- **Environment Variables**: 
  - `NEXT_PUBLIC_WORDPRESS_URL`
  - `NEXT_PUBLIC_GRAPHQL_ENDPOINT` (thường là `${WORDPRESS_URL}/graphql`)
  - `NEXT_PUBLIC_VIETQR_API_KEY` (nếu sử dụng VietQR)
  - `NEXT_PUBLIC_MOMO_PARTNER_CODE` (nếu sử dụng MoMo)
  - `MOMO_SECRET_KEY`
  - `NEXT_PUBLIC_ZALOPAY_APP_ID` (nếu sử dụng ZaloPay)
  - `ZALOPAY_KEY1` / `ZALOPAY_KEY2`

### 10.2. Backend (WordPress)
- **Hosting**: WordPress hosting chuyên nghiệp với Staging & Production environments
  - **Recommended Providers**: WP Engine, SiteGround, Cloudways, Kinsta, Vietnix, P.A Vietnam
  - **Staging Environment**: Subdomain hoặc subdirectory riêng biệt
  - **Production Environment**: Production domain chính
- **Requirements**:
  - PHP 8.0+ (khuyến nghị 8.1+)
  - MySQL 5.7+ hoặc MariaDB 10.3+
  - SSL certificate (bắt buộc cho cả Staging và Production)
  - SSH access (optional nhưng recommended)
  - Backup tự động
  - WordPress 6.0+
  - WooCommerce plugin
  - **WPGraphQL plugin** (v1.0+)
  - **WPGraphQL WooCommerce extension** (v0.10+)
  - WPGraphQL JWT Authentication (hoặc JWT Authentication plugin)

### 10.3. CI/CD Pipeline
- Git workflow (GitHub/GitLab)
- Automated testing
- Automated deployment
- Staging environment
- Production environment

---

## 11. TIMELINE & MILESTONES

### Phase 1: Setup & Planning (Tuần 1-2)
- [ ] Setup WordPress với WooCommerce
- [ ] Setup Next.js project
- [ ] Design system & UI components
- [ ] API integration setup
- [ ] Development environment

### Phase 2: Core Features (Tuần 3-6)
- [ ] Product listing & detail pages
- [ ] Shopping cart functionality
- [ ] User authentication
- [ ] Basic checkout flow
- [ ] Admin product management

### Phase 3: Advanced Features (Tuần 7-9)
- [ ] **Payment integration (Ưu tiên VietQR/MoMo/ZaloPay)**
  - [ ] Tích hợp VietQR API
  - [ ] Tích hợp MoMo Payment Gateway
  - [ ] Tích hợp ZaloPay (nếu cần)
  - [ ] Setup webhook xác nhận thanh toán tự động
  - [ ] Test payment flow end-to-end
- [ ] Order management
- [ ] User account pages
- [ ] Search & filters
- [ ] Blog functionality
- [ ] **Shipping cost calculation với volumetric weight**
  - [ ] Implement logic tính cân nặng quy đổi
  - [ ] Tích hợp với shipping calculator
  - [ ] Test với các sản phẩm có kích thước khác nhau

### Phase 4: Polish & Optimization (Tuần 10-11)
- [ ] UI/UX improvements
- [ ] Performance optimization
- [ ] SEO implementation
- [ ] Testing & bug fixes
- [ ] Mobile responsiveness

### Phase 5: Launch (Tuần 12)
- [ ] Final testing
- [ ] Production deployment
- [ ] Documentation
- [ ] Training (nếu cần)
- [ ] Go live

---

## 12. BUDGET & RESOURCES

### 12.1. Development Team
- 1 Full-stack Developer
- 1 UI/UX Designer (part-time)
- 1 QA Tester (part-time)

### 12.2. Tools & Services
- WordPress hosting: $10-30/tháng
- Vercel hosting: Free tier hoặc $20/tháng
- Domain: $10-15/năm
- SSL certificate: Free (Let's Encrypt)
- Payment gateway: Transaction fees
- Email service: $5-10/tháng
- Design tools: Figma (Free/Paid)

---

## 13. MAINTENANCE & SUPPORT

### 13.1. Ongoing Tasks
- Regular WordPress & plugin updates
- Security patches
- Performance monitoring
- Backup strategy
- Content updates
- Customer support

### 13.2. Monitoring
- Uptime monitoring
- Error tracking (Sentry)
- Analytics (Google Analytics)
- Performance monitoring
- User feedback collection

---

## 14. DOCUMENTATION

### 14.1. Technical Documentation
- API documentation
- Component library
- Deployment guide
- Environment setup guide

### 14.2. User Documentation
- Admin user guide (WordPress)
- Customer FAQ
- Troubleshooting guide

---

## 15. RISK MANAGEMENT

### 15.1. Potential Risks
- API rate limiting
- WordPress security vulnerabilities
- Payment gateway issues
- Performance issues với large catalog
- Third-party service dependencies

### 15.2. Mitigation Strategies
- Implement caching
- Regular security audits
- Backup solutions
- Monitoring & alerting
- Fallback mechanisms

---

## 16. FUTURE ENHANCEMENTS

### 16.1. Phase 2 Features
- Multi-language support (i18n)
- Multi-currency
- Advanced analytics dashboard
- Email marketing integration
- Loyalty program
- Product recommendations (AI)
- Live chat support
- Mobile app (React Native)

---

## 17. CHECKLIST KHỞI ĐỘNG DỰ ÁN

### WordPress Setup
- [ ] Install WordPress
- [ ] Install WooCommerce
- [ ] **Install WPGraphQL plugin** (v1.0+)
- [ ] **Install WPGraphQL WooCommerce extension**
- [ ] **Install WPGraphQL ACF extension** (nếu sử dụng ACF)
- [ ] Install JWT Authentication plugin (hoặc WPGraphQL JWT Authentication)
- [ ] Install ACF (Advanced Custom Fields)
- [ ] Configure WooCommerce settings
- [ ] **Setup Custom Fields cho sản phẩm:**
  - [ ] Thêm fields: length, width, height (bắt buộc)
  - [ ] Thêm field: volumetric_weight (auto-calculate)
- [ ] Setup product categories
- [ ] Add sample products (với đầy đủ kích thước)
- [ ] **Configure payment gateways (VietQR/MoMo/ZaloPay)**
- [ ] Setup shipping zones
- [ ] **Configure shipping calculation với volumetric weight**
- [ ] Configure tax settings
- [ ] **Enable GraphQL endpoint** (`/graphql`)
- [ ] **Test GraphQL queries với GraphQL Playground/GraphiQL**
- [ ] Setup CORS headers (nếu cần)

### Next.js Setup
- [ ] Initialize Next.js project
- [ ] Install dependencies
  - [ ] GraphQL client (Apollo Client / urql / graphql-request)
  - [ ] GraphQL Code Generator (`@graphql-codegen/cli`)
- [ ] Setup TypeScript
- [ ] Setup Tailwind CSS
- [ ] Setup shadcn/ui
- [ ] **Setup GraphQL client**
  - [ ] Configure GraphQL endpoint
  - [ ] Setup authentication headers
  - [ ] Configure caching strategy
- [ ] **Setup GraphQL Code Generator**
  - [ ] Create `codegen.yml` config
  - [ ] Generate TypeScript types từ GraphQL schema
  - [ ] Setup auto-generation script
- [ ] **Create GraphQL queries/mutations files**
- [ ] Setup environment variables
- [ ] Create base layout components
- [ ] Setup routing structure
- [ ] Configure image optimization

### Development Environment
- [ ] Setup Git repository
- [ ] Create .env files
- [ ] Setup local WordPress
- [ ] Setup local database
- [ ] Configure development tools
- [ ] Setup linting & formatting
- [ ] Create README.md

---

---

## 18. TÓM TẮT CÁC THAY ĐỔI CHIẾN LƯỢC

### 18.1. Chuyển đổi từ REST API sang WPGraphQL

**Lý do kỹ thuật:**
- **Performance**: GraphQL cho phép fetch đúng dữ liệu cần thiết, giảm over-fetching
- **Single Request**: Thay vì nhiều REST endpoints, chỉ cần 1 GraphQL query
- **Type Safety**: Tự động generate TypeScript types từ schema, giảm bugs
- **Developer Experience**: Queries dễ đọc, dễ maintain hơn REST
- **Next.js Optimization**: Tối ưu cho SSR/SSG với data fetching chính xác

**Thay đổi:**
- ✅ Thay thế toàn bộ REST API endpoints bằng GraphQL queries/mutations
- ✅ Sử dụng WPGraphQL + WPGraphQL WooCommerce plugins
- ✅ Setup GraphQL Code Generator cho TypeScript type generation
- ✅ Cập nhật API client architecture

### 18.2. Việt hóa Payment Gateways

**Lý do kinh doanh:**
- **Thị trường**: Ưu tiên cho khách hàng Việt Nam
- **Chi phí**: Payment gateways nội địa có phí thấp hơn Stripe/PayPal
- **Trải nghiệm**: VietQR/MoMo/ZaloPay quen thuộc với người dùng Việt Nam
- **Tốc độ**: Thanh toán nội địa nhanh hơn, ít rủi ro hơn

**Thay đổi:**
- ✅ Ưu tiên tích hợp VietQR (chuyển khoản tự động)
- ✅ Tích hợp MoMo Payment Gateway
- ✅ Tích hợp ZaloPay (optional)
- ✅ Stripe/PayPal chuyển sang optional (cho khách quốc tế)

### 18.3. Tính phí vận chuyển theo Volumetric Weight

**Lý do nghiệp vụ:**
- **Đặc thù sản phẩm**: Gấu bông nhẹ nhưng cồng kềnh
- **Tránh lỗ vận chuyển**: Nếu chỉ tính theo cân nặng thực, shop sẽ bị lỗ
- **Chuẩn ngành**: Các đơn vị vận chuyển tính phí theo thể tích, không chỉ cân nặng

**Thay đổi:**
- ✅ Bắt buộc nhập kích thước (length, width, height) cho mỗi sản phẩm
- ✅ Auto-calculate volumetric weight: `(L × W × H) / 6000`
- ✅ Logic so sánh: Lấy max(actual_weight, volumetric_weight)
- ✅ Tính phí ship dựa trên cân nặng quy đổi
- ✅ Hiển thị breakdown phí ship trong cart/checkout

---

**Ngày tạo**: [Ngày hiện tại]
**Ngày cập nhật**: [Ngày hiện tại]
**Phiên bản**: 2.0 (Refined - WPGraphQL + VietQR + Volumetric Weight)
**Trạng thái**: Ready for Implementation
**Reviewed by**: Senior Solutions Architect

