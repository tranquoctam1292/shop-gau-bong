'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { OrderFilters, type OrderFilters as OrderFiltersType } from '@/components/admin/orders/OrderFilters';
import { BulkActionsBar } from '@/components/admin/orders/BulkActionsBar';
import { OrderQuickViewDialog } from '@/components/admin/orders/OrderQuickViewDialog';
import { getStatusLabel, getStatusColor, type OrderStatus } from '@/lib/utils/orderStateMachine';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  grandTotal?: number;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  channel?: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [quickViewOrderId, setQuickViewOrderId] = useState<string | null>(null);

  // Initialize filters from URL params
  const getFiltersFromURL = (): OrderFiltersType => {
    return {
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      statuses: searchParams.get('status')?.split(',').filter(Boolean) || undefined,
      channel: searchParams.get('channel') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      paymentStatus: searchParams.get('paymentStatus') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'total' | 'status') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };
  };

  const [filters, setFilters] = useState<OrderFiltersType>(getFiltersFromURL());

  // Update page from URL
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      setPage(parseInt(pageParam, 10));
    }
  }, [searchParams]);

  // Sync filters with URL params
  const updateURLParams = useCallback((newFilters: OrderFiltersType, newPage: number = 1) => {
    const params = new URLSearchParams();
    
    if (newPage > 1) {
      params.set('page', newPage.toString());
    }
    
    if (newFilters.fromDate) {
      params.set('fromDate', newFilters.fromDate);
    }
    if (newFilters.toDate) {
      params.set('toDate', newFilters.toDate);
    }
    if (newFilters.statuses && newFilters.statuses.length > 0) {
      params.set('status', newFilters.statuses.join(','));
    }
    if (newFilters.channel) {
      params.set('channel', newFilters.channel);
    }
    if (newFilters.paymentMethod) {
      params.set('paymentMethod', newFilters.paymentMethod);
    }
    if (newFilters.paymentStatus) {
      params.set('paymentStatus', newFilters.paymentStatus);
    }
    if (newFilters.search) {
      params.set('search', newFilters.search);
    }
    if (newFilters.sortBy && newFilters.sortBy !== 'createdAt') {
      params.set('sortBy', newFilters.sortBy);
    }
    if (newFilters.sortOrder && newFilters.sortOrder !== 'desc') {
      params.set('sortOrder', newFilters.sortOrder);
    }

    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [router, pathname]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });

      // Add filters to params
      if (filters.fromDate) {
        params.append('fromDate', filters.fromDate);
      }
      if (filters.toDate) {
        params.append('toDate', filters.toDate);
      }
      if (filters.statuses && filters.statuses.length > 0) {
        params.append('status', filters.statuses.join(','));
      }
      if (filters.channel) {
        params.append('channel', filters.channel);
      }
      if (filters.paymentMethod) {
        params.append('paymentMethod', filters.paymentMethod);
      }
      if (filters.paymentStatus) {
        params.append('paymentStatus', filters.paymentStatus);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }

      const response = await fetch(`/api/admin/orders?${params}`);
      const data = await response.json();

      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFiltersChange = (newFilters: OrderFiltersType) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
    updateURLParams(newFilters, 1);
  };

  const handleClearFilters = () => {
    const emptyFilters: OrderFiltersType = {};
    setFilters(emptyFilters);
    setPage(1);
    updateURLParams(emptyFilters, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURLParams(filters, newPage);
    setSelectedOrders([]); // Clear selection when page changes
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((o) => o._id));
    }
  };

  const handleBulkActionComplete = () => {
    setSelectedOrders([]);
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-gray-600 mt-2">Xem và quản lý tất cả đơn hàng</p>
        {total > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Tổng cộng: {total} đơn hàng
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <OrderFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedOrders={selectedOrders}
        onActionComplete={handleBulkActionComplete}
      />

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow p-6">

        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không có đơn hàng nào
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.includes(order._id)}
                        onCheckedChange={() => toggleSelectOrder(order._id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.customerEmail}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(order.grandTotal || 0)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(
                          order.status as OrderStatus
                        )}`}
                      >
                        {getStatusLabel(order.status as OrderStatus)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/orders/${order._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Xem
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuickViewOrderId(order._id)}
                          title="Xem nhanh"
                          className="min-h-[44px] min-w-[44px] p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="min-h-[44px]"
                >
                  Trước
                </Button>
                <span className="px-4 py-2 text-sm">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="min-h-[44px]"
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Quick View Dialog */}
      {quickViewOrderId && (
        <OrderQuickViewDialog
          orderId={quickViewOrderId}
          open={!!quickViewOrderId}
          onOpenChange={(open) => !open && setQuickViewOrderId(null)}
        />
      )}
    </div>
  );
}

