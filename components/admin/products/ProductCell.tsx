'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { stripHtmlTags } from '@/lib/utils/sanitizeHtml';
import { Eye, Edit, Copy, Trash2, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';
import { RestoreProductModal } from './RestoreProductModal';
import { ForceDeleteModal } from './ForceDeleteModal';
import { ProductQuickEditDialog } from './ProductQuickEditDialog';

interface ProductCellProps {
  product: MappedProduct;
  isTrashTab?: boolean;
  onDelete?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onForceDelete?: (id: string) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
  onProductUpdate?: (updatedProduct: MappedProduct) => void;
}

export function ProductCell({ 
  product,
  isTrashTab = false,
  onDelete,
  onRestore,
  onForceDelete,
  onDuplicate,
  onProductUpdate,
}: ProductCellProps) {
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showForceDeleteModal, setShowForceDeleteModal] = useState(false);
  const [showQuickEdit, setShowQuickEdit] = useState(false);

  const imageUrl = product.image?.sourceUrl || '/images/teddy-placeholder.png';
  
  // Strip HTML tags from product name (in case it contains HTML)
  const productName = stripHtmlTags(product.name || '');
  const imageAlt = product.image?.altText || productName;
  
  // Truncate description to 3 lines and strip HTML tags
  const rawDescription = product.shortDescription || product.description || '';
  const plainTextDescription = stripHtmlTags(rawDescription);
  const truncatedDescription = plainTextDescription.length > 150
    ? plainTextDescription.substring(0, 150) + '...'
    : plainTextDescription;

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
    <>
      <div className="flex items-start gap-3 min-w-[300px]">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-1"
          >
            {productName}
          </Link>
          
          {/* Action Buttons - Hiển thị khi hover vào row (giống WordPress) */}
          <div className="flex items-center gap-1 mt-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {!isTrashTab && (
              <>
                <Link
                  href={`/admin/products/${product.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="inline w-3 h-3 mr-1" />
                  Xem chi tiết
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit className="inline w-3 h-3 mr-1" />
                  Chỉnh sửa
                </Link>
                <span className="text-gray-300">|</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowQuickEdit(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={isLoading}
                >
                  <Edit className="inline w-3 h-3 mr-1" />
                  Sửa nhanh
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDuplicate();
                  }}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={isLoading}
                >
                  <Copy className="inline w-3 h-3 mr-1" />
                  Nhân bản
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="text-red-600 hover:text-red-800 hover:underline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="inline w-3 h-3 mr-1" />
                  )}
                  Xóa tạm
                </button>
              </>
            )}
            {isTrashTab && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowRestoreModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RotateCcw className="inline w-3 h-3 mr-1" />
                  )}
                  Khôi phục
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowForceDeleteModal(true);
                  }}
                  className="text-red-600 hover:text-red-800 hover:underline"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="inline w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <AlertTriangle className="inline w-3 h-3 mr-1" />
                  )}
                  Xóa vĩnh viễn
                </button>
              </>
            )}
          </div>

          {truncatedDescription && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-3">
              {truncatedDescription}
            </p>
          )}
        </div>
      </div>

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
      
      {/* Quick Edit Dialog */}
      <ProductQuickEditDialog
        product={product}
        open={showQuickEdit}
        onClose={() => setShowQuickEdit(false)}
        onSuccess={(updatedProduct) => {
          onProductUpdate?.(updatedProduct);
        }}
      />
    </>
  );
}

