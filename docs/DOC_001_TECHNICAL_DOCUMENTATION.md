# DOC-001: Technical Documentation

## 📋 Mục lục

1. [API Documentation](#api-documentation)
2. [Component Documentation](#component-documentation)
3. [Deployment Guide](#deployment-guide)
4. [Environment Setup Guide](#environment-setup-guide)

---

## 🔌 API Documentation

### Overview

Website này sử dụng **WPGraphQL** làm API layer, kết nối Next.js frontend với WordPress backend.

**GraphQL Endpoint:**
```
POST /graphql
```

**Base URL:**
- Local: `http://localhost/wordpress/graphql`
- Staging: `https://staging.yourdomain.com/graphql`
- Production: `https://yourdomain.com/graphql`

### GraphQL Client Setup

**Apollo Client Configuration:**
```typescript
// lib/providers/apollo-client-provider.tsx
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  credentials: 'include',
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

### Products API

#### Get Products List

**Query:**
```graphql
query GetProducts($first: Int, $after: String, $where: RootQueryToProductConnectionWhereArgs) {
  products(first: $first, after: $after, where: $where) {
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
      productSpecs {
        length
        width
        height
        volumetricWeight
        material
        origin
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Variables:**
```json
{
  "first": 12,
  "after": null,
  "where": {
    "categoryId": "category-id",
    "search": "search term"
  }
}
```

**Usage:**
```typescript
import { useQuery } from '@apollo/client';
import { GetProductsDocument } from '@/types/generated/graphql';

const { data, loading, error } = useQuery(GetProductsDocument, {
  variables: {
    first: 12,
    where: {
      categoryId: categoryId,
    },
  },
});
```

#### Get Single Product

**Query:**
```graphql
query GetProduct($id: ID!, $idType: ProductIdTypeEnum) {
  product(id: $id, idType: $idType) {
    id
    databaseId
    name
    slug
    description
    price
    regularPrice
    salePrice
    image {
      sourceUrl
      altText
    }
    galleryImages {
      nodes {
        sourceUrl
        altText
      }
    }
    productSpecs {
      length
      width
      height
      volumetricWeight
      material
      origin
    }
  }
}
```

**Variables:**
```json
{
  "id": "product-slug",
  "idType": "SLUG"
}
```

### Cart API

#### Get Cart

**Query:**
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
      }
    }
    subtotal
    total
  }
}
```

#### Add to Cart

**Mutation:**
```graphql
mutation AddToCart($productId: Int!, $quantity: Int!) {
  addToCart(input: {
    productId: $productId
    quantity: $quantity
  }) {
    cartItem {
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
}
```

**Usage:**
```typescript
import { useMutation } from '@apollo/client';
import { AddToCartDocument } from '@/types/generated/graphql';

const [addToCart] = useMutation(AddToCartDocument);

await addToCart({
  variables: {
    productId: 123,
    quantity: 1,
  },
});
```

#### Update Cart Item

**Mutation:**
```graphql
mutation UpdateCartItem($key: ID!, $quantity: Int!) {
  updateItemQuantities(input: {
    items: [{
      key: $key
      quantity: $quantity
    }]
  }) {
    cart {
      contents {
        nodes {
          key
          quantity
        }
      }
    }
  }
}
```

#### Remove Cart Item

**Mutation:**
```graphql
mutation RemoveCartItem($key: ID!) {
  removeItemsFromCart(input: {
    keys: [$key]
  }) {
    cart {
      contents {
        nodes {
          key
        }
      }
    }
  }
}
```

### Orders API

#### Create Order

**Mutation:**
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    order {
      id
      databaseId
      orderNumber
      status
      total
      date
    }
  }
}
```

**Input:**
```typescript
{
  input: {
    customerNote: "Giao hàng vào buổi sáng",
    billing: {
      firstName: "Nguyễn",
      lastName: "Văn A",
      email: "email@example.com",
      phone: "0901234567",
      address1: "123 Đường ABC",
      city: "Hà Nội",
      state: "Hà Nội",
      postcode: "100000",
      country: "VN",
    },
    shipping: {
      firstName: "Nguyễn",
      lastName: "Văn A",
      address1: "123 Đường ABC",
      city: "Hà Nội",
      state: "Hà Nội",
      postcode: "100000",
      country: "VN",
    },
    paymentMethod: "cod",
    shippingMethod: "custom",
  }
}
```

#### Get Orders

**Query:**
```graphql
query GetOrders($first: Int) {
  orders(first: $first) {
    nodes {
      id
      databaseId
      orderNumber
      status
      total
      date
      lineItems {
        nodes {
          product {
            node {
              name
            }
          }
          quantity
          total
        }
      }
    }
  }
}
```

#### Get Single Order

**Query:**
```graphql
query GetOrder($id: ID!) {
  order(id: $id) {
    id
    databaseId
    orderNumber
    status
    total
    date
    billing {
      firstName
      lastName
      email
      phone
      address1
      city
      state
      postcode
      country
    }
    shipping {
      firstName
      lastName
      address1
      city
      state
      postcode
      country
    }
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
  }
}
```

### Authentication API

#### Login

**Mutation:**
```graphql
mutation Login($username: String!, $password: String!) {
  login(input: {
    username: $username
    password: $password
  }) {
    authToken
    user {
      id
      name
      email
    }
  }
}
```

**JWT Authentication:**
```typescript
// POST /wp-json/jwt-auth/v1/token
const response = await fetch(`${wordpressUrl}/wp-json/jwt-auth/v1/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'username',
    password: 'password',
  }),
});

const { token } = await response.json();
```

### Categories API

#### Get Categories

**Query:**
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
```

### Error Handling

**GraphQL Errors:**
```typescript
const { data, error } = useQuery(GetProductsDocument);

if (error) {
  console.error('GraphQL Error:', error);
  // Handle error
}
```

**Network Errors:**
```typescript
import { onError } from '@apollo/client/link/error';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`GraphQL Error: ${message}`);
    });
  }
  
  if (networkError) {
    console.error(`Network Error: ${networkError}`);
  }
});
```

---

## 🧩 Component Documentation

### Component Structure

```
components/
├── ui/              # Base UI components (shadcn/ui)
├── product/         # Product-related components
├── cart/           # Cart components
├── checkout/       # Checkout components
├── payment/        # Payment components
├── order/          # Order components
├── account/        # User account components
└── providers/      # Context providers
```

### Core Components

#### ProductCard

**Location:** `components/product/ProductCard.tsx`

**Props:**
```typescript
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: string;
    image?: {
      sourceUrl: string;
      altText?: string;
    };
    slug: string;
  };
  onAddToCart?: (productId: number) => void;
}
```

**Usage:**
```tsx
<ProductCard
  product={product}
  onAddToCart={handleAddToCart}
/>
```

#### CartDrawer

**Location:** `components/cart/CartDrawer.tsx`

**Features:**
- Slide-in drawer từ bên phải
- Hiển thị cart items
- Update quantity
- Remove items
- Display subtotal và shipping estimate
- Checkout button

**Usage:**
```tsx
<CartDrawer isOpen={isOpen} onClose={handleClose} />
```

#### CheckoutForm

**Location:** `components/checkout/CheckoutForm.tsx`

**Features:**
- Multi-step form
- Customer information
- Billing address
- Shipping address
- Payment method selection
- Order summary

**Usage:**
```tsx
<CheckoutForm onSubmit={handleSubmit} />
```

### Custom Hooks

#### useCartSync

**Location:** `lib/hooks/useCartSync.ts`

**Features:**
- Sync local cart với server cart
- Add to cart
- Update quantity
- Remove items
- Validate product dimensions

**Usage:**
```typescript
const { addToCart, updateQuantity, removeItem, items } = useCartSync();
```

#### useShippingEstimate

**Location:** `lib/hooks/useShippingEstimate.ts`

**Features:**
- Calculate shipping weight
- Estimate shipping cost
- No address required

**Usage:**
```typescript
const { shippingWeight, shippingEstimate, isLoading } = useShippingEstimate();
```

#### useCheckout

**Location:** `lib/hooks/useCheckout.ts`

**Features:**
- Handle checkout submission
- Create order
- Handle payment
- Redirect to confirmation

**Usage:**
```typescript
const { submitOrder, isLoading, error } = useCheckout();

await submitOrder({
  billing: { ... },
  shipping: { ... },
  paymentMethod: 'cod',
});
```

### Utility Functions

#### Shipping Calculation

**Location:** `lib/utils/shipping.ts`

**Functions:**
```typescript
// Calculate volumetric weight
calculateVolumetricWeight(length: number, width: number, height: number): number

// Get shipping weight (max of actual and volumetric)
getShippingWeight(actualWeight: number, volumetricWeight: number): number

// Calculate total shipping weight for cart
calculateTotalShippingWeight(items: ShippingItem[]): number
```

**Usage:**
```typescript
import { calculateVolumetricWeight, getShippingWeight } from '@/lib/utils/shipping';

const volumetricWeight = calculateVolumetricWeight(30, 25, 20); // (30 * 25 * 20) / 6000
const shippingWeight = getShippingWeight(0.5, volumetricWeight); // max(0.5, 2.5) = 2.5
```

#### Price Formatting

**Location:** `lib/utils/format.ts`

**Functions:**
```typescript
// Format price to VND
formatPrice(price: number | string | null): string

// Returns "Liên hệ" if price is null/undefined
```

**Usage:**
```typescript
import { formatPrice } from '@/lib/utils/format';

const formatted = formatPrice(150000); // "150.000 ₫"
const contact = formatPrice(null); // "Liên hệ"
```

#### Validation

**Location:** `lib/utils/validation.ts`

**Functions:**
```typescript
// Validate email
validateEmail(email: string): boolean

// Validate Vietnamese phone number
validatePhone(phone: string): boolean

// Validate postcode
validatePostcode(postcode: string): boolean

// Validate checkout form
validateCheckoutForm(data: CheckoutFormData): ValidationResult
```

---

## 🚀 Deployment Guide

Xem chi tiết trong:
- **DEPLOY-001:** `docs/DEPLOY_001_WORDPRESS_HOSTING_SETUP.md`
- **DEPLOY-002:** `docs/DEPLOY_002_WORDPRESS_STAGING.md`
- **DEPLOY-003:** `docs/DEPLOY_003_WORDPRESS_PRODUCTION.md`
- **DEPLOY-004:** `docs/DEPLOY_004_NEXTJS_DEPLOYMENT.md`
- **DEPLOY-005:** `docs/DEPLOY_005_CDN_IMAGE_OPTIMIZATION.md`
- **DEPLOY-006:** `docs/DEPLOY_006_MONITORING_ANALYTICS.md`

### Quick Deployment Checklist

1. **WordPress Hosting:**
   - [ ] Setup Staging environment
   - [ ] Setup Production environment
   - [ ] Configure SSL certificates
   - [ ] Setup databases

2. **WordPress Configuration:**
   - [ ] Install WordPress
   - [ ] Install plugins (WooCommerce, WPGraphQL, etc.)
   - [ ] Configure WPGraphQL
   - [ ] Setup CORS
   - [ ] Configure payment gateways (LIVE MODE for production)

3. **Next.js Deployment:**
   - [ ] Setup Vercel/Netlify account
   - [ ] Connect Git repository
   - [ ] Configure environment variables
   - [ ] Deploy Staging
   - [ ] Test Staging
   - [ ] Deploy Production
   - [ ] Setup custom domain

4. **CDN & Optimization:**
   - [ ] Setup Cloudflare
   - [ ] Configure DNS
   - [ ] Image optimization

5. **Monitoring:**
   - [ ] Setup Sentry
   - [ ] Setup Google Analytics
   - [ ] Setup uptime monitoring

---

## ⚙️ Environment Setup Guide

### Prerequisites

- **Node.js:** 18.0+ (recommended: 20.x)
- **npm:** 9.0+
- **WordPress:** 6.0+
- **PHP:** 8.0+ (for WordPress)
- **MySQL:** 5.7+ or MariaDB 10.3+

### Local Development Setup

#### 1. Clone Repository

```bash
git clone <repository-url>
cd shop-gau-bong
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

**Configure `.env.local`:**
```env
# WordPress Local
NEXT_PUBLIC_WORDPRESS_URL=http://localhost/wordpress
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost/wordpress/graphql

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-local-secret-here

# Payment Gateways (Test Mode)
NEXT_PUBLIC_VIETQR_API_KEY=test_key
NEXT_PUBLIC_MOMO_PARTNER_CODE=test_code
MOMO_SECRET_KEY=test_secret

# Shipping
NEXT_PUBLIC_SHIPPING_DEFAULT_RATE=30000

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
```

#### 4. Generate GraphQL Types

```bash
npm run codegen
```

**Note:** Cần WordPress endpoint sẵn sàng để generate types.

#### 5. Run Development Server

```bash
npm run dev
```

Truy cập: http://localhost:3000

### Staging Setup

**Environment Variables:**
```env
NEXT_PUBLIC_WORDPRESS_URL=https://staging.yourdomain.com
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://staging.yourdomain.com/graphql
NEXTAUTH_URL=https://staging-app.yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=staging
# Payment: Test Mode keys
```

### Production Setup

**Environment Variables:**
```env
NEXT_PUBLIC_WORDPRESS_URL=https://yourdomain.com
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://yourdomain.com/graphql
NEXTAUTH_URL=https://app.yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=production
# Payment: LIVE Mode keys ⚠️
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Generation
npm run codegen          # Generate GraphQL types
npm run codegen:watch    # Watch mode for codegen

# Testing
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests (Playwright)

# Performance
npm run test:lighthouse  # Lighthouse audit
npm run test:performance # Performance test
npm run test:bundle-size # Bundle size analysis

# Linting
npm run lint             # ESLint
npm run type-check       # TypeScript check
```

### Project Structure

```
shop-gau-bong/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (shop)/            # Shop routes
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/             # React Components
│   ├── ui/                # Base UI components
│   ├── product/           # Product components
│   ├── cart/              # Cart components
│   └── ...
├── lib/                    # Utilities & Hooks
│   ├── api/               # GraphQL queries/mutations
│   ├── hooks/              # Custom hooks
│   ├── utils/             # Utility functions
│   └── store/             # State management (Zustand)
├── types/                  # TypeScript types
│   └── generated/         # Auto-generated GraphQL types
├── docs/                   # Documentation
├── e2e/                    # E2E tests
├── scripts/                # Build scripts
└── public/                 # Static assets
```

### Troubleshooting

#### GraphQL Types Not Generated

**Problem:** `npm run codegen` fails

**Solution:**
1. Verify WordPress endpoint is accessible
2. Check `codegen.ts` configuration
3. Verify GraphQL endpoint URL in `.env.local`

#### CORS Errors

**Problem:** GraphQL requests blocked by CORS

**Solution:**
1. Configure CORS in WordPress
2. Add Next.js domain to allowed origins
3. Check `.htaccess` or plugin settings

#### Build Errors

**Problem:** `npm run build` fails

**Solution:**
1. Check TypeScript errors: `npm run type-check`
2. Fix linting errors: `npm run lint`
3. Verify all environment variables are set
4. Check for missing dependencies

---

## 📚 Additional Resources

- **GraphQL Schema:** `docs/GRAPHQL_SCHEMA_NOTES.md`
- **API Patterns:** `docs/API_PATTERNS.graphql`
- **Design System:** `docs/DESIGN_SYSTEM.md`
- **Deployment Strategy:** `docs/DEPLOYMENT_STRATEGY.md`

---

## 🔗 External Documentation

- **Next.js:** https://nextjs.org/docs
- **WPGraphQL:** https://www.wpgraphql.com/docs
- **Apollo Client:** https://www.apollographql.com/docs/react
- **WooCommerce:** https://woocommerce.com/documentation

