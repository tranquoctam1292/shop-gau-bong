<?php
/**
 * Custom Functions cho WordPress
 * Copy nội dung này vào functions.php của theme hoặc tạo custom plugin
 */

// ============================================
// AUTO-CALCULATE VOLUMETRIC WEIGHT
// ============================================
// Tính cân nặng quy đổi thể tích khi save product
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
        update_field('volumetric_weight', round($volumetric_weight, 2), $post_id);
    }
}

// ============================================
// CORS HEADERS cho Next.js
// ============================================
function add_cors_http_header() {
    $allowed_origins = [
        'http://localhost:3000',  // Next.js local development
        'http://127.0.0.1:3000',  // Alternative localhost
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce");
        header("Access-Control-Allow-Credentials: true");
    }
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
add_action('init', 'add_cors_http_header');

// ============================================
// EXPOSE ACF FIELDS TO WPGraphQL
// ============================================
// Đảm bảo ACF fields được expose qua GraphQL
// Plugin WPGraphQL ACF sẽ tự động handle, nhưng có thể cần config thêm

// ============================================
// ALLOW GUEST CHECKOUT - Cho phép đặt hàng không cần đăng nhập
// ============================================
// Fix lỗi: "User does not have the capabilities necessary to create an order"
// Cho phép unauthenticated users (guest) tạo order qua GraphQL

// Method 1: Override capability requirement
add_filter('graphql_woocommerce_create_order_mutation_capability', function($capability) {
    // Cho phép tất cả users (bao gồm guest) tạo order
    // 'read' là capability tối thiểu, ai cũng có
    return 'read';
}, 10);

// Method 2: Alternative - Check if user is logged in
// Nếu method 1 không work, thử method này:
add_filter('graphql_woocommerce_create_order_mutation_capability', function($capability, $context) {
    // Nếu user đã đăng nhập, giữ nguyên capability
    if (is_user_logged_in()) {
        return $capability;
    }
    // Nếu là guest, cho phép với 'read' capability
    return 'read';
}, 10, 2);

// Method 3: Bypass capability check hoàn toàn (không khuyến nghị cho production)
// Chỉ dùng nếu 2 methods trên không work
// add_filter('graphql_woocommerce_create_order_mutation_capability', '__return_empty_string', 999);

