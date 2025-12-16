'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Search, X } from 'lucide-react';
import { useToastContext } from '@/components/providers/ToastProvider';

interface BundleProduct {
  productId: string;
  productName?: string;
  quantity: number;
  discount?: number; // Percentage discount
}

interface ComboProductsBuilderProps {
  bundleProducts: BundleProduct[];
  onChange: (products: BundleProduct[]) => void;
}

export function ComboProductsBuilder({ bundleProducts, onChange }: ComboProductsBuilderProps) {
  const { showToast } = useToastContext();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Search products
  const handleSearch = async () => {
    if (!search.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products?search=${encodeURIComponent(search)}&per_page=20`);
      const data = await response.json();
      setSearchResults(data.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add product to bundle
  const addProduct = (product: any) => {
    if (!bundleProducts.find((p) => p.productId === product._id)) {
      onChange([
        ...bundleProducts,
        {
          productId: product._id,
          productName: product.name,
          quantity: 1,
          discount: 0,
        },
      ]);
      setSearch('');
      setSearchResults([]);
      setSelectedProductId('');
      showToast(`Đã thêm "${product.name}" vào combo`, 'success');
    } else {
      showToast('Sản phẩm đã có trong combo', 'info');
    }
  };

  // Remove product from bundle
  const removeProduct = (productId: string) => {
    const product = bundleProducts.find((p) => p.productId === productId);
    onChange(bundleProducts.filter((p) => p.productId !== productId));
    if (product?.productName) {
      showToast(`Đã xóa "${product.productName}" khỏi combo`, 'success');
    }
  };

  // Update product in bundle
  const updateProduct = (productId: string, field: keyof BundleProduct, value: any) => {
    onChange(
      bundleProducts.map((p) =>
        p.productId === productId ? { ...p, [field]: value } : p
      )
    );
  };

  // Fetch product names for display
  useEffect(() => {
    async function fetchProductNames() {
      const promises = bundleProducts.map(async (bundle) => {
        if (bundle.productName) return bundle;
        try {
          const response = await fetch(`/api/admin/products/${bundle.productId}`);
          const data = await response.json();
          return {
            ...bundle,
            productName: data.product?.name || 'Unknown Product',
          };
        } catch {
          return bundle;
        }
      });
      const updated = await Promise.all(promises);
      if (JSON.stringify(updated) !== JSON.stringify(bundleProducts)) {
        onChange(updated);
      }
    }
    if (bundleProducts.length > 0) {
      fetchProductNames();
    }
  }, [bundleProducts.length]); // Only run when count changes

  return (
    <div className="space-y-4">
      <Label className="font-medium">Sản phẩm Combo/Bundle</Label>

      {/* Search and Add */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            placeholder="Tìm kiếm sản phẩm để thêm vào combo..."
            className="pl-10"
          />
        </div>
        <Button type="button" onClick={handleSearch} variant="outline" disabled={loading}>
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </Button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
          {searchResults
            .filter((p) => !bundleProducts.find((bp) => bp.productId === p._id))
            .map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => addProduct(product)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {product.image?.sourceUrl && (
                    <div className="relative w-12 h-12 rounded overflow-hidden">
                      <Image
                        src={product.image.sourceUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    {product.price && (
                      <p className="text-xs text-gray-500">{product.price} VNĐ</p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    addProduct(product);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
        </div>
      )}

      {/* Bundle Products List */}
      {bundleProducts.length > 0 && (
        <div className="space-y-3">
          {bundleProducts.map((bundle) => (
            <div key={bundle.productId} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{bundle.productName || 'Loading...'}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeProduct(bundle.productId)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Số lượng</Label>
                  <Input
                    type="number"
                    min="1"
                    value={bundle.quantity}
                    onChange={(e) =>
                      updateProduct(bundle.productId, 'quantity', parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div>
                  <Label>Giảm giá (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={bundle.discount || 0}
                    onChange={(e) =>
                      updateProduct(bundle.productId, 'discount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {bundleProducts.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Chưa có sản phẩm nào trong combo. Tìm kiếm và thêm sản phẩm để bắt đầu.
        </p>
      )}
    </div>
  );
}

