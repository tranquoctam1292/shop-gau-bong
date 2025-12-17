'use client';

import { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { ProductCell } from './ProductCell';
import { CategoryBrandCell } from './CategoryBrandCell';
import { SKUCell } from './SKUCell';
import { PriceCell } from './PriceCell';
import { StockCell } from './StockCell';
import { StatusCell } from './StatusCell';
import { Filter } from 'lucide-react';
import { memo } from 'react';

interface ProductDataGridProps {
  products: MappedProduct[];
  loading?: boolean;
  error?: Error | null;
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onSelectAll: () => void;
  isTrashTab?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onDelete?: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onForceDelete?: (id: string) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
  onStatusChange?: (id: string, status: 'draft' | 'publish') => Promise<void>;
  onProductUpdate?: (updatedProduct: MappedProduct) => void;
  onRetry?: () => void;
}

// CRITICAL: Memoize StatusCell wrapper để tránh re-render loop
// Component này nhận productId và onStatusChange, tạo callback ổn định
const StatusCellWrapper = memo(({ 
  productId, 
  product, 
  onStatusChange 
}: { 
  productId: string; 
  product: MappedProduct;
  onStatusChange?: (id: string, status: 'draft' | 'publish') => Promise<void>;
}) => {
  // CRITICAL: Sử dụng useRef để lưu onStatusChange và productId mới nhất
  // Tránh tạo callback mới mỗi lần render
  const onStatusChangeRef = useRef(onStatusChange);
  const productIdRef = useRef(productId);
  
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    productIdRef.current = productId;
  }, [onStatusChange, productId]);

  // CRITICAL: Tạo stable callback không phụ thuộc vào onStatusChange reference
  const handleStatusChange = useCallback(
    async (status: 'draft' | 'publish') => {
      const handler = onStatusChangeRef.current;
      const id = productIdRef.current;
      if (handler) {
        await handler(id, status);
      }
    },
    [] // Empty deps - onStatusChange và productId được lấy từ ref
  );

  return (
    <StatusCell
      product={product}
      onStatusChange={onStatusChange ? handleStatusChange : undefined}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison: chỉ re-render nếu product hoặc onStatusChange thay đổi
  // So sánh các trường quan trọng của product thay vì JSON.stringify (hiệu suất tốt hơn)
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.product.status === nextProps.product.status &&
    prevProps.product.stockStatus === nextProps.product.stockStatus &&
    prevProps.product.isActive === nextProps.product.isActive &&
    prevProps.onStatusChange === nextProps.onStatusChange
  );
});
StatusCellWrapper.displayName = 'StatusCellWrapper';

export function ProductDataGrid({
  products,
  loading = false,
  error = null,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  isTrashTab = false,
  hasActiveFilters = false,
  onClearFilters,
  onDelete,
  onRestore,
  onForceDelete,
  onDuplicate,
  onStatusChange,
  onProductUpdate,
  onRetry,
}: ProductDataGridProps) {
  const allSelected = products.length > 0 && selectedProducts.length === products.length;
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < products.length;

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Không thể tải danh sách sản phẩm"
        message={error.message || 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'}
        action={
          onRetry
            ? {
                label: 'Thử lại',
                onClick: onRetry,
              }
            : undefined
        }
        variant="destructive"
      />
    );
  }

  // Loading state with improved skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-4 mt-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state with improved UI
  if (products.length === 0) {
    if (isTrashTab) {
      return (
        <EmptyState
          title="Thùng rác sạch sẽ"
          description="Không có sản phẩm nào trong thùng rác. Sản phẩm đã xóa sẽ tự động bị xóa vĩnh viễn sau 30 ngày."
          icon="🗑️"
        />
      );
    }

    if (hasActiveFilters) {
      return (
        <div className="text-center py-12">
          <div className="space-y-4">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900">Không tìm thấy sản phẩm</h3>
            <p className="text-sm text-gray-500">
              Không có sản phẩm nào phù hợp với bộ lọc hiện tại. Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác.
            </p>
            {onClearFilters && (
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="mt-4"
              >
                <Filter className="w-4 h-4 mr-2" />
                Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <EmptyState
        title="Chưa có sản phẩm nào"
        description="Bắt đầu bằng cách thêm sản phẩm đầu tiên vào cửa hàng của bạn."
        icon="📦"
        action={{
          label: 'Thêm sản phẩm',
          href: '/admin/products/new',
        }}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={onSelectAll}
                className="w-4 h-4"
              />
            </TableHead>
            <TableHead className="min-w-[300px]">Sản phẩm</TableHead>
            <TableHead className="hidden md:table-cell">Phân loại</TableHead>
            <TableHead className="hidden lg:table-cell">SKU</TableHead>
            <TableHead>Giá bán</TableHead>
            <TableHead className="hidden md:table-cell">Tồn kho</TableHead>
            <TableHead className="hidden lg:table-cell">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id} className="group">
            <TableCell>
              <input
                type="checkbox"
                checked={selectedProducts.includes(product.id)}
                onChange={() => onSelectProduct(product.id)}
                className="w-4 h-4"
              />
            </TableCell>
            <TableCell>
              <ProductCell 
                product={product}
                isTrashTab={isTrashTab}
                onDelete={onDelete}
                onRestore={onRestore}
                onForceDelete={onForceDelete}
                onDuplicate={onDuplicate}
                onProductUpdate={onProductUpdate}
              />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <CategoryBrandCell product={product} />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <SKUCell sku={product.sku} />
            </TableCell>
            <TableCell>
              <PriceCell
                product={product}
                onUpdate={onProductUpdate}
              />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <StockCell
                product={product}
                onUpdate={onProductUpdate}
              />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <StatusCellWrapper
                productId={product.id}
                product={product}
                onStatusChange={onStatusChange}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );
}

