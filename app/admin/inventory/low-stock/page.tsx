'use client';

/**
 * Low Stock Alerts Page
 * Trang canh bao ton kho thap
 */

import { useState } from 'react';
import { useLowStock } from '@/lib/hooks/useInventory';
import { AlertTriangle, Package, Bell, Mail, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import Link from 'next/link';
import type { AlertSeverity } from '@/types/inventory';

// ============================================
// Constants
// ============================================

const severityConfig: Record<AlertSeverity, { label: string; color: string; bgColor: string }> = {
  warning: {
    label: 'Thấp',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
  },
  critical: {
    label: 'Rất thấp',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
  },
  out_of_stock: {
    label: 'Hết hàng',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
  },
};

// ============================================
// Component
// ============================================

export default function LowStockPage() {
  // State
  const [threshold, setThreshold] = useState<number | undefined>(undefined);
  const [includeOutOfStock, setIncludeOutOfStock] = useState(true);
  const [inputThreshold, setInputThreshold] = useState('');
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [alertResult, setAlertResult] = useState<{ success: boolean; message: string } | null>(null);

  // Query
  const { data, isLoading, error, refetch } = useLowStock(threshold, includeOutOfStock);

  // Handlers
  const handleApplyThreshold = () => {
    const value = parseInt(inputThreshold, 10);
    if (!isNaN(value) && value > 0) {
      setThreshold(value);
    } else {
      setThreshold(undefined);
    }
  };

  const handleToggleOutOfStock = (checked: boolean) => {
    setIncludeOutOfStock(checked);
  };

  const handleSendAlert = async () => {
    setIsSendingAlert(true);
    setAlertResult(null);

    try {
      const response = await fetch('/api/admin/inventory/alerts', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threshold,
          includeOutOfStock,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setAlertResult({
          success: true,
          message: result.message || `Đã gửi email cảnh báo thành công`,
        });
      } else {
        setAlertResult({
          success: false,
          message: result.error || 'Lỗi khi gửi cảnh báo',
        });
      }
    } catch {
      setAlertResult({
        success: false,
        message: 'Lỗi kết nối khi gửi cảnh báo',
      });
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: AlertSeverity) => {
    const config = severityConfig[severity];
    return (
      <Badge variant="secondary" className={`${config.bgColor} ${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  // Stats
  const outOfStockCount = data?.items.filter((i) => i.severity === 'out_of_stock').length || 0;
  const criticalCount = data?.items.filter((i) => i.severity === 'critical').length || 0;
  const warningCount = data?.items.filter((i) => i.severity === 'warning').length || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          Cảnh báo tồn kho
        </h1>
        <p className="text-muted-foreground">
          Danh sách sản phẩm có số lượng tồn kho thấp hoặc hết hàng
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng cảnh báo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Hết hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              Rất thấp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{criticalCount}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Thấp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc</CardTitle>
          <CardDescription>Tùy chỉnh ngưỡng cảnh báo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <Label htmlFor="threshold">Ngưỡng cảnh báo</Label>
              <div className="flex gap-2">
                <Input
                  id="threshold"
                  type="number"
                  placeholder="Mặc định theo sản phẩm"
                  value={inputThreshold}
                  onChange={(e) => setInputThreshold(e.target.value)}
                  className="w-[200px]"
                  min="1"
                />
                <Button onClick={handleApplyThreshold} variant="secondary">
                  Áp dụng
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Để trống để sử dụng ngưỡng riêng của từng sản phẩm
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="include-out-of-stock"
                checked={includeOutOfStock}
                onCheckedChange={handleToggleOutOfStock}
              />
              <Label htmlFor="include-out-of-stock">Bao gồm hết hàng</Label>
            </div>
          </div>
        </CardContent>
      </Card>

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
      ) : data?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium">Không có cảnh báo</h3>
            <p className="text-muted-foreground text-center mt-1">
              Tất cả sản phẩm đều có đủ hàng trong kho
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Sản phẩm</TableHead>
                <TableHead className="text-center">SKU</TableHead>
                <TableHead className="text-center">Biến thể</TableHead>
                <TableHead className="text-center">Tồn kho</TableHead>
                <TableHead className="text-center">Ngưỡng</TableHead>
                <TableHead className="text-center">Mức độ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((item, index) => (
                <TableRow key={`${item.productId}-${item.variationId || index}`}>
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
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{item.sku || '-'}</TableCell>
                  <TableCell className="text-center">
                    {item.variationLabel || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`font-bold ${
                        item.currentStock <= 0
                          ? 'text-red-600'
                          : item.currentStock <= item.threshold / 2
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {item.currentStock}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {item.threshold}
                  </TableCell>
                  <TableCell className="text-center">
                    {getSeverityBadge(item.severity)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/products/${item.productId}`}>
                      <Button size="sm" variant="outline">
                        Xem
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Thông báo cảnh báo
          </CardTitle>
          <CardDescription>
            Gửi email thông báo về các sản phẩm tồn kho thấp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  Gửi email đến admin về sản phẩm tồn kho thấp
                </p>
              </div>
            </div>
            <Button
              onClick={handleSendAlert}
              disabled={isSendingAlert || !data?.items.length}
              className="min-w-[140px]"
            >
              {isSendingAlert ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi ngay
                </>
              )}
            </Button>
          </div>

          {/* Alert Result */}
          {alertResult && (
            <div
              className={`rounded-lg p-3 ${
                alertResult.success
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {alertResult.message}
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Cron Job:</strong> Để tự động gửi cảnh báo hàng ngày, cấu hình cron job gọi đến{' '}
              <code className="bg-muted px-1 rounded text-xs">/api/cron/low-stock-alerts</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
