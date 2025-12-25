'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Copy, Trash2, RotateCcw, AlertTriangle, Loader2, Edit } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { useToastContext } from '@/components/providers/ToastProvider';
import { RestoreProductModal } from './RestoreProductModal';
import { ForceDeleteModal } from './ForceDeleteModal';
// PERFORMANCE OPTIMIZATION (3.2.1): Lazy load ProductQuickEditDialog for code splitting
import dynamic from 'next/dynamic';

const ProductQuickEditDialog = dynamic(
  () => import('./ProductQuickEditDialog').then((mod) => ({ default: mod.ProductQuickEditDialog })),
  {
    loading: () => null, // Don't show loading spinner, dialog will show its own loading state
    ssr: false, // Disable SSR for this component (client-only)
  }
);
// PERFORMANCE OPTIMIZATION (1.1.1): Pre-fetch CSRF token on hover
import { usePrefetchCsrfToken } from '@/lib/hooks/usePrefetchCsrfToken';
// PERFORMANCE OPTIMIZATION (2.1.1): Pre-fetch product data on hover
import { usePrefetchProduct } from '@/lib/hooks/usePrefetchProduct';

interface ProductActionMenuProps {
  product: MappedProduct;
  isTrashTab?: boolean;
  isDeleting?: boolean;
  onDelete?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onForceDelete?: (id: string) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
  onProductUpdate?: (updatedProduct: MappedProduct) => void; // ✅ NEW
}

export function ProductActionMenu({
  product,
  isTrashTab = false,
  onDelete,
  onRestore,
  onForceDelete,
  onDuplicate,
  onProductUpdate,
}: ProductActionMenuProps) {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showForceDeleteModal, setShowForceDeleteModal] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  // PERFORMANCE OPTIMIZATION (1.1.1): Pre-fetch CSRF token on hover
  const { handleMouseEnter: handleCsrfMouseEnter, handleMouseLeave: handleCsrfMouseLeave } = usePrefetchCsrfToken({ debounceMs: 400 });
  // PERFORMANCE OPTIMIZATION (2.1.1): Pre-fetch product data on hover (only for single product edit)
  const { handleMouseEnter: handleProductMouseEnter, handleMouseLeave: handleProductMouseLeave } = usePrefetchProduct(product.id, { debounceMs: 400 });
  
  // Combine both pre-fetch handlers
  const handleMouseEnter = useCallback(() => {
    handleCsrfMouseEnter();
    handleProductMouseEnter();
  }, [handleCsrfMouseEnter, handleProductMouseEnter]);
  
  const handleMouseLeave = useCallback(() => {
    handleCsrfMouseLeave();
    handleProductMouseLeave();
  }, [handleCsrfMouseLeave, handleProductMouseLeave]);

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(product.id);
      showToast('Đã chuyển vào thùng rác', 'success');
    } catch (error) {
      showToast('Không thể xóa sản phẩm', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!onRestore) return;

    setIsLoading(true);
    try {
      await onRestore(product.id);
      showToast('Đã khôi phục sản phẩm', 'success');
      setShowRestoreModal(false);
    } catch (error) {
      showToast('Không thể khôi phục sản phẩm', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceDelete = async () => {
    if (!onForceDelete) return;

    setIsLoading(true);
    try {
      await onForceDelete(product.id);
      showToast('Đã xóa vĩnh viễn sản phẩm', 'success');
      setShowForceDeleteModal(false);
    } catch (error) {
      showToast('Không thể xóa sản phẩm', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!onDuplicate) return;

    setIsLoading(true);
    try {
      await onDuplicate(product.id);
      showToast('Đã tạo bản sao sản phẩm', 'success');
    } catch (error) {
      showToast('Không thể tạo bản sao', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isLoading}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isTrashTab && (
          <>
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product.id}`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/products/${product.id}/edit`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowQuickEdit(true)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Sửa nhanh
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDuplicate}
              disabled={isLoading}
              className="cursor-pointer"
            >
              <Copy className="mr-2 h-4 w-4" />
              Nhân bản
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isLoading}
              className="cursor-pointer text-red-600"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Đang xóa...' : 'Xóa tạm'}
            </DropdownMenuItem>
          </>
        )}
        {isTrashTab && (
          <>
            <DropdownMenuItem
              onClick={() => setShowRestoreModal(true)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Đang xử lý...' : 'Khôi phục'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowForceDeleteModal(true)}
              disabled={isLoading}
              className="cursor-pointer text-red-600"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>

      {/* Modals */}
      <RestoreProductModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onConfirm={handleRestore}
        product={product}
      />
      <ForceDeleteModal
        isOpen={showForceDeleteModal}
        onClose={() => setShowForceDeleteModal(false)}
        onConfirm={handleForceDelete}
        product={product}
      />
      
      {/* Quick Edit Dialog - Only render when open to prevent duplicate dialogs */}
      {showQuickEdit && (
        <ProductQuickEditDialog
          key={`quick-edit-menu-${product.id}`}
          product={product}
          open={showQuickEdit}
          onClose={() => setShowQuickEdit(false)}
          onSuccess={(updatedProduct) => {
            onProductUpdate?.(updatedProduct);
          }}
        />
      )}
    </DropdownMenu>
  );
}

