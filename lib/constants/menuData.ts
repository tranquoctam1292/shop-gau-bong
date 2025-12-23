/**
 * Menu Data Constants
 * Based on MENU_DATA_CONFIG.json
 * Hardcoded fallback menu structure
 */

import type { MenuDataConfig, MenuItem, BadgeType } from '@/types/menu';

export const menuDataConfig: MenuDataConfig = {
  menuStructure: {
    topBar: {
      left: "Chào mừng đến với thế giới gấu bông!",
      right: [
        {
          type: "hotline",
          label: "Hotline",
          href: "tel:+84123456789",
          phone: "0123 456 789"
        },
        {
          type: "link",
          label: "Theo dõi đơn hàng",
          href: "/order-tracking"
        }
      ]
    },
    mainNavigation: [
      {
        id: "home",
        label: "Trang chủ",
        href: "/",
        type: "link",
        icon: null,
        badge: null
      },
      {
        id: "products",
        label: "Sản phẩm",
        href: "/products",
        type: "mega",
        icon: null,
        badge: null,
        megaMenu: {
          layout: "three-column",
          columns: [
            {
              title: "Theo loại",
              type: "category",
              items: [
                {
                  id: "teddy",
                  label: "Gấu Teddy",
                  href: "/products?category=teddy",
                  image: undefined, // Will use emoji fallback
                  count: 0,
                  badge: undefined
                },
                {
                  id: "cartoon",
                  label: "Thú bông hoạt hình",
                  href: "/products?category=cartoon",
                  image: undefined, // Will use emoji fallback
                  count: 0,
                  badge: "hot" as BadgeType
                },
                {
                  id: "pillow",
                  label: "Gối ôm",
                  href: "/products?category=pillow",
                  image: undefined, // Will use emoji fallback
                  count: 0,
                  badge: undefined
                }
              ]
            },
            {
              title: "Theo size",
              type: "size",
              items: [
                {
                  id: "giant",
                  label: "Khổng lồ (>1m)",
                  href: "/products?size=giant",
                  image: undefined, // Will use emoji fallback
                  count: 0,
                  badge: "hot" as BadgeType
                },
                {
                  id: "medium",
                  label: "Vừa (50-80cm)",
                  href: "/products?size=medium",
                  image: undefined, // Will use emoji fallback
                  count: 0,
                  badge: undefined
                },
                {
                  id: "small",
                  label: "Nhỏ (Móc khóa)",
                  href: "/products?size=small",
                  image: undefined, // Will use emoji fallback
                  count: 0,
                  badge: undefined
                }
              ]
            },
            {
              title: "Banner",
              type: "banner",
              items: [
                {
                  id: "banner-1",
                  label: "Sản phẩm nổi bật",
                  href: "/products?featured=true",
                  image: undefined, // Will use gradient background only
                  badge: "new" as BadgeType
                }
              ]
            }
          ]
        }
      },
      {
        id: "collections",
        label: "Bộ sưu tập",
        href: "/collections",
        type: "dropdown",
        icon: null,
        badge: null,
        children: [
          {
            id: "graduation",
            label: "Gấu tốt nghiệp",
            href: "/products?collection=graduation",
            badge: "new" as BadgeType,
            icon: "🎓"
          },
          {
            id: "valentine",
            label: "Quà tặng Valentine",
            href: "/products?collection=valentine",
            badge: "hot" as BadgeType,
            icon: "💝"
          },
          {
            id: "birthday",
            label: "Quà sinh nhật",
            href: "/products?collection=birthday",
            badge: undefined,
            icon: "🎂"
          }
        ]
      },
      {
        id: "accessories",
        label: "Phụ kiện",
        href: "/products?category=accessories",
        type: "link",
        icon: null,
        badge: null,
        subItems: [
          {
            label: "Áo cho gấu",
            href: "/products?category=accessories&sub=clothes"
          },
          {
            label: "Hộp quà",
            href: "/products?category=accessories&sub=gift-box"
          },
          {
            label: "Thiệp",
            href: "/products?category=accessories&sub=cards"
          }
        ]
      },
      {
        id: "sharing",
        label: "Góc Chia Sẻ",
        href: "/blog",
        type: "link",
        icon: null,
        badge: null,
        subItems: [
          {
            label: "Cách giặt gấu",
            href: "/blog/how-to-wash-teddy"
          },
          {
            label: "Cách gói quà",
            href: "/blog/how-to-wrap-gift"
          },
          {
            label: "Blog",
            href: "/blog"
          }
        ]
      },
      {
        id: "contact",
        label: "Liên hệ",
        href: "/contact",
        type: "link",
        icon: null,
        badge: null,
        subItems: [
          {
            label: "Hệ thống cửa hàng",
            href: "/stores"
          },
          {
            label: "Form liên hệ",
            href: "/contact"
          }
        ]
      },
      {
        id: "sale",
        label: "Sale %",
        href: "/products?on_sale=true",
        type: "link",
        icon: null,
        badge: "sale" as BadgeType,
        highlight: true,
        color: "#FF0000"
      }
    ]
  },
  badgeConfig: {
    new: {
      label: "Mới",
      color: "#3B82F6",
      bgColor: "#DBEAFE",
      textColor: "#1E40AF"
    },
    hot: {
      label: "Hot",
      color: "#EF4444",
      bgColor: "#FEE2E2",
      textColor: "#991B1B"
    },
    sale: {
      label: "Sale",
      color: "#10B981",
      bgColor: "#D1FAE5",
      textColor: "#065F46"
    }
  },
  mobileConfig: {
    hotlineButton: {
      enabled: false,
      position: "sticky-bottom",
      phone: "0123 456 789",
      href: "tel:+84123456789",
      label: "Gọi ngay"
    },
    searchBehavior: {
      default: "icon",
      onClick: "modal"
    }
  }
};

// Export individual parts for easier access
export const topBarConfig = menuDataConfig.menuStructure.topBar;
export const mainNavigation = menuDataConfig.menuStructure.mainNavigation;
export const badgeConfig = menuDataConfig.badgeConfig;
export const mobileConfig = menuDataConfig.mobileConfig;
