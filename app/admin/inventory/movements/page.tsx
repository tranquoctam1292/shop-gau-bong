'use client';

/**
 * Inventory Movements Page
 * Trang lich su thay doi ton kho
 */

import { useState } from 'react';
import { useInventoryMovements } from '@/lib/hooks/useInventory';
import { History, ArrowUpDown, Search, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { MovementFilters, MovementType, MovementReferenceType } from '@/types/inventory';

// ============================================
// Constants
// ============================================

const movementTypeLabels: Record<MovementType, string> = {
  in: 'Nhập kho',
  out: 'Xuất kho',
  adjustment: 'Điều chỉnh',
  reservation: 'Đặt trước',
  release: 'Giải phóng',
};

const referenceTypeLabels: Record<MovementReferenceType, string> = {
  order: 'Đơn hàng',
  return: 'Trả hàng',
  manual: 'Thủ công',
  import: 'Nhập hàng',
  damage: 'Hư hỏng',
  correction: 'Sửa lỗi',
};

// ============================================
// Component
// ============================================

export default function MovementsPage() {
  // Filters state
  const [filters, setFilters] = useState<MovementFilters>({
    page: 1,
    perPage: 20,
  });
  const [searchInput, setSearchInput] = useState('');

  // Query
  const { data, isLoading, error } = useInventoryMovements(filters);

  // Handlers
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, sku: searchInput || undefined, page: 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleTypeChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      type: value === 'all' ? undefined : (value as MovementType),
      page: 1,
    }));
  };

  const handleReferenceTypeChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      referenceType: value === 'all' ? undefined : (value as MovementReferenceType),
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get badge variant based on movement type
  const getMovementBadge = (type: MovementType, direction: 1 | -1) => {
    if (direction === 1) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <ArrowUp className="h-3 w-3 mr-1" />
          {movementTypeLabels[type]}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <ArrowDown className="h-3 w-3 mr-1" />
        {movementTypeLabels[type]}
      </Badge>
    );
  };

  const totalPages = data ? Math.ceil(data.total / (filters.perPage || 20)) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" />
          Lịch sử tồn kho
        </h1>
        <p className="text-muted-foreground">
          Theo dõi tất cả các thay đổi số lượng tồn kho
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            Tìm
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={filters.type || 'all'} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="in">Nhập kho</SelectItem>
              <SelectItem value="out">Xuất kho</SelectItem>
              <SelectItem value="adjustment">Điều chỉnh</SelectItem>
              <SelectItem value="reservation">Đặt trước</SelectItem>
              <SelectItem value="release">Giải phóng</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.referenceType || 'all'} onValueChange={handleReferenceTypeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Nguồn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="order">Đơn hàng</SelectItem>
              <SelectItem value="return">Trả hàng</SelectItem>
              <SelectItem value="manual">Thủ công</SelectItem>
              <SelectItem value="import">Nhập hàng</SelectItem>
              <SelectItem value="damage">Hư hỏng</SelectItem>
              <SelectItem value="correction">Sửa lỗi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Lỗi: {error.message}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-center">Loại</TableHead>
                  <TableHead className="text-center">Số lượng</TableHead>
                  <TableHead className="text-center">Trước</TableHead>
                  <TableHead className="text-center">Sau</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Người thực hiện</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Không có lịch sử nào
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.sku && (
                            <p className="text-xs text-muted-foreground">
                              SKU: {item.sku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getMovementBadge(item.type, item.direction)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`font-medium ${
                            item.direction === 1 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {item.direction === 1 ? '+' : '-'}
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {item.previousStock}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {item.newStock}
                      </TableCell>
                      <TableCell>
                        {item.referenceType && (
                          <div>
                            <Badge variant="outline">
                              {referenceTypeLabels[item.referenceType]}
                            </Badge>
                            {item.reason && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.reason}
                              </p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.createdByName || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Trang {filters.page} / {totalPages} ({data?.total} giao dịch)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page || 1) <= 1}
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page || 1) >= totalPages}
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
