'use client';

import { useState, useCallback } from 'react';
import { ProductsSEOTable } from '@/components/admin/seo';
import Link from 'next/link';
import { ChevronRight, Home, X } from 'lucide-react';
import { useProductSEO, useUpdateProductSEO } from '@/lib/hooks/useSEO';

// Quick edit modal for individual product SEO
function ProductSEOEditModal({
  productId,
  onClose,
}: {
  productId: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useProductSEO(productId);
  const { mutate: updateSEO, isPending } = useUpdateProductSEO();

  const [formData, setFormData] = useState({
    focusKeyword: '',
    seoTitle: '',
    seoDescription: '',
    slug: '',
  });

  const [initialized, setInitialized] = useState(false);

  // Initialize form when data loads
  if (data && !initialized) {
    setFormData({
      focusKeyword: data.seo?.focusKeyword || '',
      seoTitle: data.seo?.seoTitle || '',
      seoDescription: data.seo?.seoDescription || '',
      slug: data.seo?.slug || data.slug || '',
    });
    setInitialized(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSEO(
      { productId, seo: formData },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Chỉnh sửa SEO</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Từ khóa trọng tâm
              </label>
              <input
                type="text"
                value={formData.focusKeyword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    focusKeyword: e.target.value,
                  }))
                }
                placeholder="VD: gấu bông teddy"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề SEO ({formData.seoTitle.length}/60)
              </label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))
                }
                placeholder="Tiêu đề hiển thị trên Google"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {formData.seoTitle.length > 60 && (
                <p className="text-xs text-red-500 mt-1">Tiêu đề quá dài</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả SEO ({formData.seoDescription.length}/160)
              </label>
              <textarea
                value={formData.seoDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    seoDescription: e.target.value,
                  }))
                }
                placeholder="Mô tả hiển thị trên Google"
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {formData.seoDescription.length > 160 && (
                <p className="text-xs text-red-500 mt-1">Mô tả quá dài</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">/san-pham/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Google Preview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Xem trước trên Google
              </label>
              <div className="max-w-lg">
                <p className="text-blue-800 text-lg hover:underline truncate">
                  {formData.seoTitle || data?.name || 'Tiêu đề sản phẩm'}
                </p>
                <p className="text-green-700 text-sm truncate">
                  {process.env.NEXT_PUBLIC_SITE_URL || 'https://shop-gaubong.com'}
                  /san-pham/{formData.slug || 'slug'}
                </p>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {formData.seoDescription || 'Mô tả sản phẩm...'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SEOProductsPage() {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const handleEditProduct = useCallback((productId: string) => {
    setEditingProductId(productId);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingProductId(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/admin" className="hover:text-gray-900 flex items-center gap-1">
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/seo" className="hover:text-gray-900">
          SEO
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">Sản phẩm</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Sản phẩm</h1>
          <p className="text-gray-500 mt-1">
            Xem và chỉnh sửa SEO cho tất cả sản phẩm
          </p>
        </div>
      </div>

      {/* Products Table */}
      <ProductsSEOTable onEditProduct={handleEditProduct} />

      {/* Edit Modal */}
      {editingProductId && (
        <ProductSEOEditModal
          productId={editingProductId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
