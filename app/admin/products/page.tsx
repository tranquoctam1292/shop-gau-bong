'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2, Copy, CheckSquare } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<MappedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();

      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/products/${id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra khi tạo bản sao');
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Có lỗi xảy ra khi tạo bản sao');
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

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa ${selectedProducts.length} sản phẩm?`)) {
      return;
    }

    try {
      const promises = selectedProducts.map((id) =>
        fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      alert('Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  const handleBulkStatusChange = async (status: 'draft' | 'publish') => {
    if (selectedProducts.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    try {
      const promises = selectedProducts.map((id) =>
        fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      );
      await Promise.all(promises);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Error bulk updating status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sản phẩm</h1>
          <p className="text-gray-600 mt-2">Quản lý tất cả sản phẩm trong cửa hàng</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products/bulk">
            <Button variant="outline">
              <CheckSquare className="w-4 h-4 mr-2" />
              Thao tác hàng loạt
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Bulk Actions Bar */}
        {selectedProducts.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              Đã chọn {selectedProducts.length} sản phẩm
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('publish')}
              >
                Xuất bản
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusChange('draft')}
              >
                Chuyển thành bản nháp
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProducts([])}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không có sản phẩm nào
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="w-4 h-4"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.databaseId}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(parseFloat(product.price))}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          product.stockStatus === 'instock'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.stockStatus === 'instock' ? 'Còn hàng' : 'Hết hàng'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/admin/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(product.id)}
                          title="Tạo bản sao"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <span className="px-4 py-2">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

