<?php
/**
 * Plugin Name: Shop Gấu Bông - Custom Functions
 * Description: Custom functions cho tính volumetric weight và CORS
 * Version: 1.0.0
 * Author: Your Name
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

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

