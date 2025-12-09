# 🔧 Troubleshooting Guide

Tổng hợp các vấn đề thường gặp và cách giải quyết trong quá trình phát triển.

---

## 📋 Mục lục

1. [Hydration Errors](#hydration-errors)
2. [WooCommerce REST API 401 Errors](#woocommerce-rest-api-401-errors)
3. [GraphQL Duplicate Field Errors](#graphql-duplicate-field-errors)
4. [Order Creation Errors](#order-creation-errors)
5. [HTML Error Responses](#html-error-responses)
6. [Guest Checkout Issues](#guest-checkout-issues)
7. [Plugin Compatibility Issues](#plugin-compatibility-issues)

---

## Hydration Errors

### Vấn đề
React hydration mismatch errors: "Expected server HTML to contain a matching element"

### Nguyên nhân
- Browser extensions can inject elements vào DOM
- `React.cloneElement` hoặc `Next.js Link` behavior
- Server/client rendering mismatch

### Giải pháp
1. **Browser Extensions (Root Cause):**
   - Lỗi chỉ xảy ra trong regular browser, không xảy ra trong Incognito mode
   - Sử dụng `suppressHydrationWarning` prop trên các elements bị ảnh hưởng
   - Đây là giải pháp tạm thời nhưng cần thiết khi browser extensions can thiệp

2. **Code Fixes:**
   - Đảm bảo server và client render cùng output
   - Tránh sử dụng `window`/`document` trong Server Components
   - Format dates trên client side

### Files liên quan (đã hợp nhất):
- `FIX_HYDRATION_ERROR.md`
- `FIX_HYDRATION_ERROR_FINAL.md`
- `HYDRATION_ERROR_RESOLUTION.md`
- `HYDRATION_ERROR_BROWSER_EXTENSIONS.md`
- `HYDRATION_ERROR_SEVERITY.md`
- `DEBUG_HYDRATION_ERROR.md`
- `FIX_HYDRATION_BUTTON_CHILDREN.md`

---

## WooCommerce REST API 401 Errors

### Vấn đề
`{"code":"woocommerce_rest_cannot_view","message":"Sorry, you cannot list resources.","data":{"status":401}}`

### Nguyên nhân
- API key không có đủ permissions
- User role không đúng (cần Administrator hoặc Shop Manager)
- WordPress plugin không xử lý authentication đúng

### Giải pháp

#### 1. Kiểm tra API Key Permissions
- Đảm bảo API key có **Read/Write** permissions
- User associated với API key phải là **Administrator**

#### 2. WordPress Plugin Fix
Thêm vào `shop-gaubong-custom.php`:
```php
// Handle Basic Authentication for WooCommerce API
add_filter('determine_current_user', function($user_id) {
    if (!empty($_SERVER['PHP_AUTH_USER']) && !empty($_SERVER['PHP_AUTH_PW'])) {
        // Try WooCommerce API key authentication
        $consumer_key = $_SERVER['PHP_AUTH_USER'];
        $consumer_secret = $_SERVER['PHP_AUTH_PW'];
        
        // Verify API key
        $user = wp_authenticate_application_password(null, $consumer_key, $consumer_secret);
        if ($user && !is_wp_error($user)) {
            return $user->ID;
        }
    }
    return $user_id;
});

// Grant permissions for WooCommerce REST API
add_filter('woocommerce_rest_check_permissions', function($permission, $context, $object_id, $post_type) {
    $user = wp_get_current_user();
    if ($user && in_array($user->roles[0] ?? '', ['administrator', 'shop_manager'])) {
        return true;
    }
    return $permission;
}, 10, 4);
```

#### 3. Alternative: WordPress Application Password
- Tạo Application Password trong WordPress User Settings
- Sử dụng username và application password thay vì WooCommerce API key

### Files liên quan (đã hợp nhất):
- `FIX_WOOCOMMERCE_401_FINAL.md`
- `FIX_WOOCOMMERCE_AUTH_401.md`
- `FIX_WOOCOMMERCE_401_ALTERNATIVE.md`
- `FIX_WOOCOMMERCE_401_DEEP_DEBUG.md`
- `DEBUG_WOOCOMMERCE_401_COMPREHENSIVE.md`
- `CHECK_API_KEY_USER_ROLE.md`

---

## GraphQL Duplicate Field Errors

### Vấn đề
`DUPLICATE_FIELD` error: "You cannot register duplicate fields on the same Type"

### Nguyên nhân
- Multiple plugins hoặc custom code đăng ký cùng field
- WPGraphQL WooCommerce conflicts với other plugins

### Giải pháp
**Note:** Đã migrate sang WooCommerce REST API, không còn sử dụng GraphQL cho e-commerce.

Nếu vẫn gặp lỗi với blog features (optional):
1. Deactivate conflicting plugins
2. Check custom code for duplicate field registrations
3. Update WPGraphQL và WPGraphQL WooCommerce plugins

### Files liên quan (đã hợp nhất):
- `FIX_DUPLICATE_FIELD_ERROR.md`
- `FIX_DUPLICATE_ID_FIELD.md`
- `FIX_DUPLICATE_ID_FINAL.md`
- `DEBUG_PRODUCTVARIATION_TYPE.md`
- `TEST_WITHOUT_PRODUCTVARIATION.md`

---

## Order Creation Errors

### Vấn đề
"User does not have the capabilities necessary to create an order"

### Giải pháp
1. **WordPress Plugin Fix:**
   - Đảm bảo guest checkout được enable trong WooCommerce settings
   - Thêm capabilities cho guest users trong custom plugin

2. **WooCommerce Settings:**
   - WooCommerce → Settings → Accounts & Privacy
   - Enable "Allow customers to place orders without an account"

### Files liên quan (đã hợp nhất):
- `FIX_ORDER_CREATION_ERROR.md`
- `FIX_ORDER_CREATION_PERMISSION.md`
- `FIX_NEXTJS_ORDER_ERROR.md`
- `FIX_APOLLO_CLIENT_GUEST_CHECKOUT.md`

---

## HTML Error Responses

### Vấn đề
API trả về HTML thay vì JSON (thường là PHP warnings/errors)

### Nguyên nhân
- PHP errors trong WordPress
- `WP_DEBUG` duplicate definitions
- Plugin conflicts

### Giải pháp
1. **Fix WP_DEBUG Duplicate:**
   - Kiểm tra `wp-config.php` - chỉ có 1 definition
   - Remove duplicate `define('WP_DEBUG', ...)`

2. **Check WordPress Errors:**
   - Enable error logging
   - Check PHP error logs
   - Deactivate problematic plugins

### Files liên quan (đã hợp nhất):
- `FIX_HTML_ERROR_RESPONSE.md`
- `FIX_HTML_ERROR_EXPLAINED.md`
- `FIX_WPGRAPHQL_HTML_ERROR.md`
- `FIX_WP_DEBUG_DUPLICATE.md`
- `DEBUG_HTML_ERROR_STEPS.md`
- `TEST_AFTER_FIX_WPDEBUG.md`
- `CHECK_WPGRAPHQL_STATUS.md`

---

## Guest Checkout Issues

### Vấn đề
Không thể đặt hàng mà không đăng nhập

### Giải pháp
1. **WooCommerce Settings:**
   - Enable guest checkout trong WooCommerce → Settings → Accounts & Privacy

2. **WordPress Plugin:**
   - Thêm filters để allow guest checkout
   - Xem `WORDPRESS_GUEST_CHECKOUT_SETUP.md` cho chi tiết

### Files liên quan (đã hợp nhất):
- `FIX_GUEST_CHECKOUT_FINAL.md`
- `DEBUG_GUEST_CHECKOUT.md`
- `WORDPRESS_GUEST_CHECKOUT_SETUP.md`

---

## Plugin Compatibility Issues

### Vấn đề
Plugins conflicts, errors khi activate/deactivate

### Giải pháp
1. **Check Plugin Versions:**
   - Đảm bảo tất cả plugins compatible với WordPress version
   - Update plugins lên latest versions

2. **Test với Minimal Plugins:**
   - Deactivate tất cả plugins trừ essentials
   - Activate từng plugin để tìm conflict

### Files liên quan (đã hợp nhất):
- `FIX_PLUGIN_COMPATIBILITY.md`
- `FIX_PLUGIN_COMPATIBILITY_URGENT.md`
- `CHECK_PLUGIN_VERSIONS.md`
- `TEST_PLUGIN_DISABLED.md`

---

## Other Common Issues

### Price Format Error
- **File:** `FIX_PRICE_FORMAT.md`
- **Issue:** Price hiển thị sai (500000 → 500₫)
- **Fix:** Update `formatPrice` function để handle large numbers

### Categories API Error
- **File:** `FIX_CATEGORIES_API_ERROR.md`
- **Issue:** 401 error khi fetch categories
- **Fix:** Same as WooCommerce 401 errors above

### Country Enum Error
- **File:** `FIX_COUNTRY_ENUM_ERROR.md`, `GRAPHQL_COUNTRY_ENUM_FIX.md`
- **Issue:** GraphQL enum value phải unquoted
- **Note:** Đã migrate sang REST API, không còn issue này

---

**Last Updated:** 2025-01-XX  
**Status:** Consolidated from multiple troubleshooting files

