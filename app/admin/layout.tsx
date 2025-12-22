/**
 * Admin Route Group Layout
 * 
 * This layout excludes Header/Footer from root layout
 * Only renders admin-specific layout
 */

'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  FolderTree,
  LayoutDashboard,
  LogOut,
  FileText,
  User,
  MessageSquare,
  Tags,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  Image,
  Users,
  Shield,
  Hash,
  Palette,
  Loader2,
} from 'lucide-react';
import { AdminRole } from '@/types/admin';

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Don't redirect if on login page or change password page
  const isLoginPage = pathname === '/admin/login';
  const isChangePasswordPage = pathname === '/admin/change-password';
  
  // IMPORTANT: All hooks must be called before any conditional returns
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // RBAC: Check if user has valid admin role (calculate before hooks)
  const userRoleRaw = session?.user?.role as string | AdminRole | undefined;
  const validAdminRoles = Object.values(AdminRole) as string[];
  // Also allow legacy 'admin' role for backward compatibility
  const isValidRole = userRoleRaw && typeof userRoleRaw === 'string' && (
    validAdminRoles.includes(userRoleRaw) || userRoleRaw === 'admin'
  );

  // Cast to AdminRole for type safety (after validation)
  // Map legacy 'admin' to SUPER_ADMIN for backward compatibility
  // Use a safe default if not authenticated yet
  const userRole = (typeof userRoleRaw === 'string' && userRoleRaw === 'admin' 
    ? AdminRole.SUPER_ADMIN 
    : (userRoleRaw || AdminRole.VIEWER)) as AdminRole;

  interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: AdminRole[]; // Optional: if empty or undefined, accessible to all admin roles
    submenu?: Array<{
      href: string;
      label: string;
      icon?: React.ComponentType<{ className?: string }>;
    }>;
  }

  // Define navigation items with role-based access control (memoized to prevent recreation)
  // CRITICAL: This hook must be called before any conditional returns
  const navItems: NavItem[] = useMemo(() => [
    { 
      href: '/admin', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      // Public for all admin roles
    },
    {
      href: '/admin/products',
      label: 'Sản phẩm',
      icon: Package,
      roles: [AdminRole.PRODUCT_MANAGER, AdminRole.SUPER_ADMIN],
      submenu: [
        { href: '/admin/products', label: 'Tất cả sản phẩm', icon: List },
        { href: '/admin/products/new', label: 'Thêm mới', icon: Plus },
        { href: '/admin/categories', label: 'Danh mục', icon: FolderTree },
        { href: '/admin/attributes', label: 'Thuộc tính', icon: Tags },
      ],
    },
    { 
      href: '/admin/orders', 
      label: 'Đơn hàng', 
      icon: ShoppingCart,
      roles: [AdminRole.ORDER_MANAGER, AdminRole.SUPER_ADMIN],
    },
    { 
      href: '/admin/media', 
      label: 'Media', 
      icon: Image,
      // Accessible to all admin roles except VIEWER
      roles: [AdminRole.PRODUCT_MANAGER, AdminRole.ORDER_MANAGER, AdminRole.CONTENT_EDITOR, AdminRole.SUPER_ADMIN],
    },
    {
      href: '/admin/posts',
      label: 'Bài viết',
      icon: FileText,
      roles: [AdminRole.CONTENT_EDITOR, AdminRole.SUPER_ADMIN],
      submenu: [
        { href: '/admin/posts', label: 'Tất cả bài viết', icon: List },
        { href: '/admin/posts/new', label: 'Thêm mới', icon: Plus },
        { href: '/admin/authors', label: 'Tác giả', icon: User },
      ],
    },
    { 
      href: '/admin/comments', 
      label: 'Bình luận', 
      icon: MessageSquare,
      roles: [AdminRole.CONTENT_EDITOR, AdminRole.SUPER_ADMIN],
    },
    {
      href: '/admin/users',
      label: 'Quản lý tài khoản',
      icon: Users,
      roles: [AdminRole.SUPER_ADMIN],
    },
    {
      href: '/admin/settings',
      label: 'Cài đặt',
      icon: Shield,
      roles: [AdminRole.SUPER_ADMIN],
      submenu: [
        { href: '/admin/settings/appearance', label: 'Cài đặt Giao diện', icon: Palette },
        { href: '/admin/settings/security', label: 'Bảo mật', icon: Shield },
        { href: '/admin/settings/sku', label: 'Cài đặt SKU', icon: Hash },
        { href: '/admin/settings/contact-widget', label: 'Nút Liên hệ Nổi', icon: MessageSquare },
      ],
    },
  ], []); // Empty dependency array since navItems structure doesn't change

  // Filter navigation items based on user role (memoized to prevent unnecessary re-renders)
  // CRITICAL: This hook must be called before any conditional returns
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      // If no roles specified, accessible to all admin roles
      if (!item.roles || item.roles.length === 0) return true;
      // Check if user role is in the allowed roles list
      return item.roles.includes(userRole);
    });
  }, [navItems, userRole]);

  // Auto-expand sidebar: Find parent menu item when pathname matches submenu
  // CRITICAL: This hook must be called before any conditional returns
  useEffect(() => {
    if (!pathname) return;

    // Find the parent menu item that contains the current pathname in its submenu
    const activeParent = filteredNavItems.find((item) => 
      item.submenu?.some((sub) => pathname === sub.href || pathname.startsWith(sub.href))
    );

    if (activeParent && activeParent.href) {
      setExpandedMenus((prev) => {
        const next = new Set(prev);
        // Only add if not already expanded to prevent unnecessary state updates
        if (!next.has(activeParent.href)) {
          next.add(activeParent.href);
          return next;
        }
        return prev;
      });
    }
  }, [pathname, filteredNavItems]);

  // Redirect effect
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // Don't redirect during loading state - wait for session to be determined
    // Allow change password page without authentication (user may need to change password on first login)
    if (!isLoginPage && !isChangePasswordPage && status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router, isLoginPage, isChangePasswordPage]);

  // Security Audit: Log logout activity before signOut
  const handleLogout = async () => {
    try {
      // Call logout API to log activity before clearing session
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('[Logout] Error logging activity:', error);
    } finally {
      await signOut({ callbackUrl: '/admin/login' });
    }
  };

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(menuKey)) {
        next.delete(menuKey);
      } else {
        next.add(menuKey);
      }
      return next;
    });
  };

  // For login page or change password page, render without sidebar
  if (isLoginPage || isChangePasswordPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Show loading state when session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  // For protected pages, check authentication
  // Don't redirect during loading - wait for session to load
  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  // RBAC: Check if user has valid admin role
  if (!session || !isValidRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Shop Gấu Bông</p>
        </div>

        <nav className="px-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = hasSubmenu && expandedMenus.has(item.href);
            // Fix Active State Logic: Menu parent stays active when on child routes
            const isActive = pathname === item.href || 
                            (item.href !== '/admin' && pathname?.startsWith(item.href)) ||
                            (hasSubmenu && item.submenu?.some(sub => pathname === sub.href || pathname?.startsWith(sub.href)));

            return (
              <div key={item.href}>
                {/* Main Menu Item */}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive && !hasSubmenu
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                  {hasSubmenu && (
                    <button
                      onClick={() => toggleMenu(item.href)}
                      className="px-2 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Submenu */}
                {hasSubmenu && isExpanded && item.submenu && (
                  <div className="ml-4 space-y-1 border-l-2 border-gray-200 pl-2">
                    {item.submenu.map((subItem) => {
                      const SubIcon = subItem.icon || Package;
                      // Fix Active State Logic: Submenu item active when exact match or path starts with submenu href
                      const isSubActive = pathname === subItem.href || 
                                         (subItem.href !== '/admin/products' && pathname?.startsWith(subItem.href));
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span>{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-gray-900">
              {session.user?.name || session.user?.email}
            </p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  );
}
