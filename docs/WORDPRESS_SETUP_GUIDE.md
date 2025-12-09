# HƯỚNG DẪN SETUP WORDPRESS TRÊN XAMPP

## ✅ Bước 1: Đã hoàn thành
- [x] Cài đặt XAMPP
- [x] Cài đặt WordPress trên XAMPP

## 📦 Bước 2: Cài đặt Plugins

### 2.1. WooCommerce
1. Vào WordPress Admin: `http://localhost/wordpress/wp-admin`
2. Vào **Plugins > Add New**
3. Tìm "WooCommerce"
4. Click **Install Now** > **Activate**
5. Chạy WooCommerce Setup Wizard:
   - Chọn địa điểm cửa hàng: **Việt Nam**
   - Chọn loại sản phẩm: **Vật lý** (Physical products)
   - Cấu hình thanh toán: Bỏ qua bước này (sẽ config sau)
   - Cấu hình vận chuyển: Bỏ qua (sẽ config sau)
   - Cấu hình thuế: Bỏ qua (sẽ config sau)

### 2.2. WPGraphQL
1. Vào **Plugins > Add New**
2. Tìm "WPGraphQL"
3. Click **Install Now** > **Activate**
4. Verify: Vào **GraphQL > Settings** để xem endpoint URL

### 2.3. WPGraphQL WooCommerce Extension
**Lưu ý:** Plugin này KHÔNG có trong WordPress repository, phải tải từ GitHub.

1. **Tải plugin từ GitHub:**
   - Truy cập: https://github.com/wp-graphql/wp-graphql-woocommerce
   - Vào phần **Releases** (bên phải)
   - Tải file ZIP mới nhất (vd: `wp-graphql-woocommerce-v0.x.x.zip`)
   - Hoặc clone repository nếu bạn quen với Git

2. **Cài đặt plugin:**
   - Vào WordPress Admin: **Plugins > Add New**
   - Click **Upload Plugin** (phía trên)
   - Chọn file ZIP vừa tải
   - Click **Install Now**
   - Sau khi install xong, click **Activate Plugin**

3. **Verify:**
   - Vào **Plugins** để xem plugin đã được activate
   - **Lưu ý:** Plugin này yêu cầu WooCommerce và WPGraphQL đã được cài đặt và activate trước

### 2.4. Advanced Custom Fields (ACF)
1. Vào **Plugins > Add New**
2. Tìm "Advanced Custom Fields"
3. Click **Install Now** > **Activate**

### 2.5. WPGraphQL ACF Extension
1. Vào **Plugins > Add New**
2. Tìm "WPGraphQL for Advanced Custom Fields"
3. Click **Install Now** > **Activate**

### 2.6. JWT Authentication (Optional - nếu cần)
1. Vào **Plugins > Add New**
2. Tìm "JWT Authentication for WP REST API"
3. Click **Install Now** > **Activate**
4. Thêm vào `wp-config.php`:
```php
define('JWT_AUTH_SECRET_KEY', 'your-secret-key-here');
define('JWT_AUTH_CORS_ENABLE', true);
```

## 🔧 Bước 3: Cấu hình WooCommerce

### 3.1. Cấu hình Store Settings
1. Vào **WooCommerce > Settings > General**
2. Điền thông tin cửa hàng:
   - Store Address
   - City, Postal Code
   - Country: **Vietnam**
   - Currency: **Vietnamese Dong (₫)**

### 3.2. Cấu hình Shipping
1. Vào **WooCommerce > Settings > Shipping**
2. Click **Add shipping zone**
3. Tạo zone "Vietnam":
   - Zone name: Vietnam
   - Zone regions: Vietnam
   - Shipping methods: Flat rate (sẽ config sau)

### 3.3. Cấu hình Tax
1. Vào **WooCommerce > Settings > Tax**
2. Enable taxes: **Yes**
3. Prices entered with tax: **Yes, I will enter prices inclusive of tax**
4. Calculate tax based on: **Customer shipping address**

## 📝 Bước 4: Setup Custom Fields (ACF)

### 4.1. Tạo Field Group cho Product Specs
1. Vào **Custom Fields > Add New**
2. Field Group Name: **Product Specs**
3. Location Rules: Show this field group if **Post Type** is equal to **Product**

### 4.2. Thêm các Fields

#### Field: Length (Chiều dài)
- Field Label: `Length`
- Field Name: `length`
- Field Type: **Number**
- Required: **Yes**
- Instructions: Chiều dài sản phẩm (cm)

#### Field: Width (Chiều rộng)
- Field Label: `Width`
- Field Name: `width`
- Field Type: **Number**
- Required: **Yes**
- Instructions: Chiều rộng sản phẩm (cm)

#### Field: Height (Chiều cao)
- Field Label: `Height`
- Field Name: `height`
- Field Type: **Number**
- Required: **Yes**
- Instructions: Chiều cao sản phẩm (cm)

#### Field: Volumetric Weight (Tự động tính)
- Field Label: `Volumetric Weight`
- Field Name: `volumetric_weight`
- Field Type: **Number**
- Required: **No**
- Instructions: Cân nặng quy đổi thể tích (tự động tính: L × W × H / 6000)
- **Lưu ý:** Field này sẽ được tính tự động bằng PHP hook (xem bước 4.3)

#### Field: Material (Chất liệu)
- Field Label: `Material`
- Field Name: `material`
- Field Type: **Text**
- Required: **No**

#### Field: Origin (Xuất xứ)
- Field Label: `Origin`
- Field Name: `origin`
- Field Type: **Text**
- Required: **No**

### 4.3. Auto-calculate Volumetric Weight
Thêm vào `functions.php` của theme hoặc tạo custom plugin:

```php
// Auto-calculate volumetric weight khi save product
add_action('acf/save_post', 'calculate_volumetric_weight', 20);
function calculate_volumetric_weight($post_id) {
    // Chỉ áp dụng cho Product post type
    if (get_post_type($post_id) !== 'product') {
        return;
    }
    
    $length = get_field('length', $post_id);
    $width = get_field('width', $post_id);
    $height = get_field('height', $post_id);
    
    // Tính volumetric weight: (L × W × H) / 6000
    if ($length && $width && $height) {
        $volumetric_weight = ($length * $width * $height) / 6000;
        update_field('volumetric_weight', $volumetric_weight, $post_id);
    }
}
```

## 🔌 Bước 5: Cấu hình GraphQL

### 5.1. Verify GraphQL Endpoint
1. Vào **GraphQL > Settings**
2. GraphQL Endpoint: `/graphql`
3. Full URL: `http://localhost/wordpress/graphql`

### 5.2. Test GraphQL với GraphQL Playground
1. Cài đặt plugin "GraphQL Playground" (optional) hoặc
2. Truy cập: `http://localhost/wordpress/graphql` (nếu có GraphiQL enabled)
3. Hoặc sử dụng tool như Postman, Insomnia

### 5.3. Test Query cơ bản
```graphql
query {
  products(first: 5) {
    nodes {
      id
      name
      price
    }
  }
}
```

## 🌐 Bước 6: Cấu hình CORS

Thêm vào `functions.php` của theme hoặc tạo custom plugin:

```php
// Allow CORS cho Next.js localhost
function add_cors_http_header() {
    $allowed_origins = [
        'http://localhost:3000',  // Next.js local development
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
    }
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
add_action('init', 'add_cors_http_header');
```

## 📦 Bước 7: Tạo Sample Products

### 7.1. Tạo Product Categories
1. Vào **Products > Categories**
2. Tạo các categories:
   - Gấu bông nhỏ
   - Gấu bông lớn
   - Gấu bông theo chủ đề
   - Gấu bông theo kích thước

### 7.2. Tạo Sample Products
1. Vào **Products > Add New**
2. Điền thông tin:
   - Product Name: "Gấu bông Teddy lớn"
   - Description: Mô tả sản phẩm
   - Short Description: Mô tả ngắn
   - Product Image: Upload hình ảnh
   - Gallery Images: Upload thêm ảnh
   - Price: 500000 (500.000₫)
   - Stock: In stock
   - Categories: Chọn category
3. **Quan trọng:** Điền Custom Fields:
   - Length: 50 (cm)
   - Width: 40 (cm)
   - Height: 30 (cm)
   - Material: "Bông gòn 4D"
   - Origin: "Việt Nam"
   - Volumetric Weight: Sẽ tự động tính = (50 × 40 × 30) / 6000 = 10kg
4. Click **Publish**

### 7.3. Tạo thêm 2-3 products nữa với kích thước khác nhau để test

## ✅ Checklist hoàn thành

- [ ] WooCommerce đã cài và activate
- [ ] WPGraphQL đã cài và activate
- [ ] WPGraphQL WooCommerce đã cài và activate
- [ ] ACF đã cài và activate
- [ ] WPGraphQL ACF đã cài và activate
- [ ] Custom Fields đã tạo (length, width, height, volumetric_weight, material, origin)
- [ ] Auto-calculate volumetric weight đã setup
- [ ] GraphQL endpoint hoạt động: `http://localhost/wordpress/graphql`
- [ ] CORS đã cấu hình
- [ ] Sample products đã tạo với đầy đủ kích thước
- [ ] Test GraphQL query thành công

## 🔗 Links hữu ích

- WordPress Admin: `http://localhost/wordpress/wp-admin`
- GraphQL Endpoint: `http://localhost/wordpress/graphql`
- WooCommerce Products: `http://localhost/wordpress/wp-admin/edit.php?post_type=product`
- ACF Field Groups: `http://localhost/wordpress/wp-admin/edit.php?post_type=acf-field-group`

