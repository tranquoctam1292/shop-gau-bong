'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';

export default function BulkOperationsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<MappedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkValue, setBulkValue] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        per_page: '100', // Get more products for bulk operations
      });
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const handleBulkAction = async () => {
    if (selectedProducts.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    if (!bulkAction) {
      alert('Vui lòng chọn thao tác');
      return;
    }

    try {
      switch (bulkAction) {
        case 'status':
          if (!bulkValue) {
            alert('Vui lòng chọn trạng thái');
            return;
          }
          await Promise.all(
            selectedProducts.map((id) =>
              fetch(`/api/admin/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: bulkValue }),
              })
            )
          );
          break;

        case 'delete':
          if (!confirm(`Bạn có chắc muốn xóa ${selectedProducts.length} sản phẩm?`)) {
            return;
          }
          await Promise.all(
            selectedProducts.map((id) =>
              fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
            )
          );
          break;

        case 'category':
          // TODO: Implement bulk category assignment
          alert('Tính năng này sẽ được triển khai sau');
          return;

        default:
          alert('Thao tác không hợp lệ');
          return;
      }

      alert('Thao tác thành công!');
      setSelectedProducts([]);
      setBulkAction('');
      setBulkValue('');
      fetchProducts();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Có lỗi xảy ra khi thực hiện thao tác');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thao tác hàng loạt</h1>
          <p className="text-gray-600 mt-2">Quản lý nhiều sản phẩm cùng lúc</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bulk Actions Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Thao tác hàng loạt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Chọn thao tác</Label>
                <select
                  value={bulkAction}
                  onChange={(e) => {
                    setBulkAction(e.target.value);
                    setBulkValue('');
                  }}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">-- Chọn thao tác --</option>
                  <option value="status">Đổi trạng thái</option>
                  <option value="delete">Xóa sản phẩm</option>
                  <option value="category">Gán danh mục</option>
                </select>
              </div>

              {bulkAction === 'status' && (
                <div>
                  <Label>Trạng thái mới</Label>
                  <select
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    <option value="draft">Bản nháp</option>
                    <option value="publish">Xuất bản</option>
                  </select>
                </div>
              )}

              {bulkAction === 'delete' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    ⚠️ Thao tác này sẽ xóa {selectedProducts.length} sản phẩm đã chọn
                  </p>
                </div>
              )}

              <div className="pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Đã chọn: <strong>{selectedProducts.length}</strong> sản phẩm
                </p>
                <Button
                  onClick={handleBulkAction}
                  disabled={selectedProducts.length === 0 || !bulkAction}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Thực hiện
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="text-center py-12">Đang tải...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Không có sản phẩm nào
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="flex items-center gap-2 p-2 border-b">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Chọn tất cả</span>
                  </div>
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {product.sku || 'No SKU'} • {product.price} VNĐ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

