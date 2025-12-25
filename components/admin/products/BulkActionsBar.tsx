'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, FileX, Loader2, DollarSign, Package, Edit } from 'lucide-react';
import { BulkUpdatePriceModal } from './BulkUpdatePriceModal';
import { BulkUpdateStockModal } from './BulkUpdateStockModal';
// PERFORMANCE OPTIMIZATION (3.2.1): Lazy load ProductQuickEditDialog for code splitting
import dynamic from 'next/dynamic';

const ProductQuickEditDialog = dynamic(
  () => import('./ProductQuickEditDialog').then((mod) => ({ default: mod.ProductQuickEditDialog })),
  {
    loading: () => null, // Don't show loading spinner, dialog will show its own loading state
    ssr: false, // Disable SSR for this component (client-only)
  }
);
import { useToastContext } from '@/components/providers/ToastProvider';

interface BulkActionsBarProps {
  selectedCount: number;
  selectedProductIds?: string[]; // PHASE 2: Bulk Quick Edit (4.2.5)
  isTrashTab?: boolean;
  onBulkDelete?: () => Promise<void>;
  onBulkRestore?: () => Promise<void>;
  onBulkForceDelete?: () => Promise<void>;
  onBulkStatusChange?: (status: 'draft' | 'publish') => Promise<void>;
  onBulkUpdatePrice?: (price: number) => Promise<void>;
  onBulkUpdateStock?: (value: number, operation: 'set' | 'add' | 'subtract') => Promise<void>;
  onClearSelection?: () => void;
  onBulkSuccess?: (updatedCount: number) => void; // PHASE 2: Bulk Quick Edit (4.2.5)
}

export function BulkActionsBar({
  selectedCount,
  selectedProductIds = [],
  isTrashTab = false,
  onBulkDelete,
  onBulkRestore,
  onBulkForceDelete,
  onBulkStatusChange,
  onBulkUpdatePrice,
  onBulkUpdateStock,
  onClearSelection,
  onBulkSuccess,
}: BulkActionsBarProps) {
  const { showToast } = useToastContext();
  const [loading, setLoading] = useState<string | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showQuickEditDialog, setShowQuickEditDialog] = useState(false); // PHASE 2: Bulk Quick Edit (4.2.5)

  const handleBulkUpdatePrice = async (price: number) => {
    if (!onBulkUpdatePrice) return;

    setLoading('price');
    try {
      await onBulkUpdatePrice(price);
      showToast(`Đã cập nhật giá cho ${selectedCount} sản phẩm`, 'success');
    } catch (error) {
      showToast('Không thể cập nhật giá', 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleBulkUpdateStock = async (value: number, operation: 'set' | 'add' | 'subtract') => {
    if (!onBulkUpdateStock) return;

    setLoading('stock');
    try {
      await onBulkUpdateStock(value, operation);
      showToast(`Đã cập nhật kho cho ${selectedCount} sản phẩm`, 'success');
    } catch (error) {
      showToast('Không thể cập nhật kho', 'error');
    } finally {
      setLoading(null);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
        <span className="text-sm font-medium text-blue-900">
          Đã chọn {selectedCount} sản phẩm
        </span>
        <div className="flex gap-2 flex-wrap">
          {!isTrashTab && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkStatusChange?.('publish')}
                disabled={!!loading}
              >
                {loading === 'status' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Xuất bản
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkStatusChange?.('draft')}
                disabled={!!loading}
              >
                {loading === 'status' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Chuyển thành bản nháp
              </Button>
              {onBulkUpdatePrice && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPriceModal(true)}
                  disabled={!!loading}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Cập nhật giá
                </Button>
              )}
              {onBulkUpdateStock && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStockModal(true)}
                  disabled={!!loading}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Cập nhật kho
                </Button>
              )}
              {/* PHASE 2: Bulk Quick Edit Button (4.2.5) */}
              {selectedProductIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickEditDialog(true)}
                  disabled={!!loading}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Sửa nhanh
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={!!loading}
              >
                {loading === 'delete' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Xóa tạm
              </Button>
            </>
          )}
          {isTrashTab && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onBulkRestore}
                disabled={!!loading}
              >
                {loading === 'restore' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Khôi phục
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkForceDelete}
                disabled={!!loading}
              >
                {loading === 'force-delete' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileX className="w-4 h-4 mr-2" />
                )}
                Xóa vĩnh viễn
              </Button>
            </>
          )}
          {onClearSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              disabled={!!loading}
            >
              Bỏ chọn
            </Button>
          )}
        </div>
      </div>

      {showPriceModal && (
        <BulkUpdatePriceModal
          isOpen={showPriceModal}
          onClose={() => setShowPriceModal(false)}
          onConfirm={handleBulkUpdatePrice}
          selectedCount={selectedCount}
        />
      )}

      {showStockModal && (
        <BulkUpdateStockModal
          isOpen={showStockModal}
          onClose={() => setShowStockModal(false)}
          onConfirm={handleBulkUpdateStock}
          selectedCount={selectedCount}
        />
      )}

      {/* PHASE 2: Bulk Quick Edit Dialog (4.2.5) - Only render when open */}
      {showQuickEditDialog && selectedProductIds.length > 0 && (
        <ProductQuickEditDialog
          key={`bulk-quick-edit-${selectedProductIds.join('-')}`}
          productIds={selectedProductIds}
          open={showQuickEditDialog}
          onClose={() => {
            setShowQuickEditDialog(false);
            onClearSelection?.();
          }}
          onBulkSuccess={(updatedCount) => {
            onBulkSuccess?.(updatedCount);
            setShowQuickEditDialog(false);
            onClearSelection?.();
          }}
        />
      )}
    </>
  );
}

