'use client';

/**
 * Inventory Management Page
 * Trang quan ly ton kho trong admin
 */

import { useState } from 'react';
import { useInventory, useLowStock, useAdjustStock } from '@/lib/hooks/useInventory';
import { Package, AlertTriangle, ArrowUpDown, Search, Filter, Download, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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
import type { InventoryFilters, InventoryItem } from '@/types/inventory';
import { StockAdjustmentDialog } from '@/components/admin/inventory/StockAdjustmentDialog';
import { InventoryExportDialog } from '@/components/admin/inventory/InventoryExportDialog';
import { MobileInventoryCard } from '@/components/admin/inventory/MobileInventoryCard';

export default function InventoryPage() {
  // Filters state
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    perPage: 20,
    stockStatus: 'all',
    sortBy: 'stock',
    sortOrder: 'asc',
  });
  const [searchInput, setSearchInput] = useState('');

  // Dialog state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();

  // Queries
  const { data, isLoading, error, refetch } = useInventory(filters);
  const { data: lowStockData } = useLowStock();
  const adjustMutation = useAdjustStock();

  // Handlers
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleStockStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      stockStatus: value as InventoryFilters['stockStatus'],
      page: 1,
    }));
  };

  const handleSortChange = (sortBy: InventoryFilters['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleOpenAdjustDialog = (product: InventoryItem, variantId?: string) => {
    setSelectedProduct(product);
    setSelectedVariantId(variantId);
    setAdjustDialogOpen(true);
  };

  const handleAdjustStock = async (
    quantity: number,
    type: 'manual' | 'damage' | 'correction' | 'return' | 'import',
    reason: string
  ) => {
    if (!selectedProduct) return;

    await adjustMutation.mutateAsync({
      productId: selectedProduct.productId,
      variationId: selectedVariantId,
      quantity,
      type,
      reason,
    });

    setAdjustDialogOpen(false);
    refetch();
  };

  // Stats cards
  const stats = [
    {
      title: 'Tổng sản phẩm',
      value: data?.summary.totalProducts || 0,
      icon: Package,
      color: 'text-blue-500',
    },
    {
      title: 'Tồn kho thấp',
      value: lowStockData?.total || 0,
      icon: AlertTriangle,
      color: 'text-yellow-500',
    },
    {
      title: 'Hết hàng',
      value: data?.summary.outOfStockCount || 0,
      icon: AlertTriangle,
      color: 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý tồn kho</h1>
          <p className="text-muted-foreground">
            Theo dõi và điều chỉnh số lượng tồn kho sản phẩm
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Xuất
          </Button>
          <Link href="/admin/inventory/import">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Nhập
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, SKU..."
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
          <Select value={filters.stockStatus} onValueChange={handleStockStatusChange}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="in">Còn hàng</SelectItem>
              <SelectItem value="low">Tồn thấp</SelectItem>
              <SelectItem value="out">Hết hàng</SelectItem>
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
          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {data?.items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Không có sản phẩm nào
              </div>
            ) : (
              data?.items.map((item) => (
                <MobileInventoryCard
                  key={item.productId}
                  item={item}
                  onAdjust={handleOpenAdjustDialog}
                />
              ))
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Sản phẩm</TableHead>
                  <TableHead className="text-center">SKU</TableHead>
                  <TableHead
                    className="cursor-pointer text-center"
                    onClick={() => handleSortChange('stock')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Tồn kho
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Đã đặt</TableHead>
                  <TableHead className="text-center">Có thể bán</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Không có sản phẩm nào
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <InventoryRow
                      key={item.productId}
                      item={item}
                      onAdjust={handleOpenAdjustDialog}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Trang {data.pagination.page} / {data.pagination.totalPages} (
                {data.pagination.total} sản phẩm)
              </p>
              <div className="flex gap-2 justify-center sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={data.pagination.page <= 1}
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Adjust Dialog */}
      <StockAdjustmentDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        product={selectedProduct}
        variantId={selectedVariantId}
        onSubmit={handleAdjustStock}
        isLoading={adjustMutation.isPending}
      />

      {/* Export Dialog */}
      <InventoryExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </div>
  );
}

// ============================================
// Inventory Row Component
// ============================================

interface InventoryRowProps {
  item: InventoryItem;
  onAdjust: (product: InventoryItem, variantId?: string) => void;
}

function InventoryRow({ item, onAdjust }: InventoryRowProps) {
  const [expanded, setExpanded] = useState(false);

  const getStockBadge = () => {
    if (item.availableQuantity <= 0) {
      return <Badge variant="destructive">Hết hàng</Badge>;
    }
    if (item.isLowStock) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Tồn thấp</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-800">Còn hàng</Badge>;
  };

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => item.variants && setExpanded(!expanded)}>
        <TableCell>
          <div className="flex items-center gap-3">
            {item.thumbnail && (
              <Image
                src={item.thumbnail}
                alt={item.productName}
                width={40}
                height={40}
                className="h-10 w-10 rounded object-cover"
              />
            )}
            <div>
              <p className="font-medium">{item.productName}</p>
              {item.type === 'variable' && (
                <p className="text-xs text-muted-foreground">
                  {item.variants?.length || 0} biến thể
                  {expanded ? ' ▲' : ' ▼'}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center">{item.sku || '-'}</TableCell>
        <TableCell className="text-center font-medium">{item.stockQuantity}</TableCell>
        <TableCell className="text-center">{item.reservedQuantity}</TableCell>
        <TableCell className="text-center font-medium">{item.availableQuantity}</TableCell>
        <TableCell className="text-center">{getStockBadge()}</TableCell>
        <TableCell className="text-right">
          {item.type === 'simple' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onAdjust(item);
              }}
            >
              Điều chỉnh
            </Button>
          )}
        </TableCell>
      </TableRow>

      {/* Variant rows */}
      {expanded &&
        item.variants?.map((variant) => (
          <TableRow key={variant.variationId} className="bg-muted/30">
            <TableCell className="pl-16">
              <div>
                <p className="text-sm">
                  {variant.size && `Size: ${variant.size}`}
                  {variant.color && ` - Màu: ${variant.color}`}
                </p>
              </div>
            </TableCell>
            <TableCell className="text-center text-sm">{variant.sku || '-'}</TableCell>
            <TableCell className="text-center font-medium">{variant.stockQuantity}</TableCell>
            <TableCell className="text-center">{variant.reservedQuantity}</TableCell>
            <TableCell className="text-center font-medium">{variant.availableQuantity}</TableCell>
            <TableCell className="text-center">
              {variant.availableQuantity <= 0 ? (
                <Badge variant="destructive" className="text-xs">Hết</Badge>
              ) : variant.isLowStock ? (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Thấp</Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">OK</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdjust(item, variant.variationId);
                }}
              >
                Điều chỉnh
              </Button>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
}
