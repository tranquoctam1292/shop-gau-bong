/**
 * Admin Route Group Layout
 * 
 * This layout excludes Header/Footer from root layout
 * Only renders admin-specific layout
 */

'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
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
} from 'lucide-react';

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Don't redirect if on login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // Don't redirect during loading state - wait for session to be determined
    if (!isLoginPage && status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router, isLoginPage]);

  // For login page, render without sidebar
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Show loading only for protected pages
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // For protected pages, check authentication
  // Don't redirect during loading - wait for session to load
  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  if (!session || (session.user as any)?.role !== 'admin') {
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Sản phẩm', icon: Package },
    { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
    { href: '/admin/categories', label: 'Danh mục', icon: FolderTree },
    { href: '/admin/posts', label: 'Bài viết', icon: FileText },
    { href: '/admin/authors', label: 'Tác giả', icon: User },
    { href: '/admin/comments', label: 'Bình luận', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Shop Gấu Bông</p>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
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
