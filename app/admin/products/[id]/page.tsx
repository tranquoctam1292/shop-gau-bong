'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Copy, ArrowLeft, MessageSquare, BarChart3 } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { use } from 'react';
import { ProductReviews } from '@/components/admin/products/ProductReviews';
import { ProductAnalytics } from '@/components/admin/products/ProductAnalytics';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<MappedProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/admin/products/${id}`);
        const data = await response.json();
        if (data.product) {
          setProduct(data.product);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/products');
      } else {
        alert('Có lỗi xảy ra khi xóa sản phẩm');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Có lỗi xảy ra khi xóa sản phẩm');
    }
  };

  const handleDuplicate = async () => {
    if (!confirm('Bạn có muốn tạo bản sao của sản phẩm này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.product) {
          router.push(`/admin/products/${data.product._id}/edit`);
          router.refresh();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra khi tạo bản sao');
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Có lỗi xảy ra khi tạo bản sao');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Đang tải...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy sản phẩm</p>
        <Link href="/admin/products">
          <Button variant="outline" className="mt-4">
            Quay lại
          </Button>
        </Link>
      </div>
    );
  }

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
        <div className="flex gap-2">
          <Link href={`/admin/products/${id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Chỉnh sửa
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Tạo bản sao
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2 px-1 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Chi tiết
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Đánh giá
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-2 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Phân tích
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tên sản phẩm</label>
                <p className="text-lg font-semibold">{product.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Slug</label>
                <p className="text-sm font-mono">{product.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">SKU</label>
                <p className="text-sm">{product.sku || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Mô tả ngắn</label>
                <p className="text-sm">{product.shortDescription || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Mô tả chi tiết</label>
                <div
                  className="text-sm prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description || '' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          {product.attributes && product.attributes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Biến thể sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.attributes.map((attr) => (
                    <div key={attr.id}>
                      <label className="text-sm font-medium text-gray-500">{attr.name}</label>
                      <p className="text-sm">{attr.options.join(', ')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {(product.image || product.galleryImages.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {product.image && (
                    <img
                      src={product.image.sourceUrl}
                      alt={product.image.altText}
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  {product.galleryImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.sourceUrl}
                      alt={img.altText}
                      className="w-full h-32 object-cover rounded"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Trạng thái</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Trạng thái kho</label>
                <p className="text-sm">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      product.stockStatus === 'instock'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.stockStatus === 'instock' ? 'Còn hàng' : 'Hết hàng'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Số lượng</label>
                <p className="text-sm">{product.stockQuantity || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Giá</label>
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(parseFloat(product.price))}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dimensions */}
          {(product.length || product.width || product.height || product.weight) && (
            <Card>
              <CardHeader>
                <CardTitle>Kích thước & Trọng lượng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {product.length && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chiều dài</label>
                    <p className="text-sm">{product.length} cm</p>
                  </div>
                )}
                {product.width && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chiều rộng</label>
                    <p className="text-sm">{product.width} cm</p>
                  </div>
                )}
                {product.height && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Chiều cao</label>
                    <p className="text-sm">{product.height} cm</p>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trọng lượng</label>
                    <p className="text-sm">{product.weight} kg</p>
                  </div>
                )}
                {product.volumetricWeight && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trọng lượng thể tích</label>
                    <p className="text-sm">{product.volumetricWeight.toFixed(2)} kg</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Categories & Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Phân loại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.categories.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Danh mục</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {activeTab === 'reviews' && (
        <ProductReviews productId={id} />
      )}

      {activeTab === 'analytics' && (
        <ProductAnalytics productId={id} />
      )}
    </div>
  );
}

