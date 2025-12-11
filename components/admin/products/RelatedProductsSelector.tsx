'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X, Plus } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price?: string;
  image?: { sourceUrl?: string };
}

interface RelatedProductsSelectorProps {
  title: string;
  selectedProductIds: string[];
  onChange: (productIds: string[]) => void;
  placeholder?: string;
}

export function RelatedProductsSelector({
  title,
  selectedProductIds,
  onChange,
  placeholder = 'Tìm kiếm sản phẩm...',
}: RelatedProductsSelectorProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch selected products
  useEffect(() => {
    if (selectedProductIds.length > 0) {
      async function fetchSelectedProducts() {
        try {
          const promises = selectedProductIds.map((id) =>
            fetch(`/api/admin/products/${id}`)
              .then((res) => res.json())
              .then((data) => data.product)
              .catch(() => null)
          );
          const results = await Promise.all(promises);
          setSelectedProducts(results.filter(Boolean));
        } catch (error) {
          console.error('Error fetching selected products:', error);
        }
      }
      fetchSelectedProducts();
    } else {
      setSelectedProducts([]);
    }
  }, [selectedProductIds]);

  // Search products
  const handleSearch = async () => {
    if (!search.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/products?search=${encodeURIComponent(search)}&per_page=20`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product: Product) => {
    if (!selectedProductIds.includes(product._id)) {
      onChange([...selectedProductIds, product._id]);
      setSearch('');
      setProducts([]);
    }
  };

  const removeProduct = (productId: string) => {
    onChange(selectedProductIds.filter((id) => id !== productId));
  };

  return (
    <div className="space-y-3">
      <Label className="font-medium">{title}</Label>
      
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
        <Button type="button" onClick={handleSearch} variant="outline" disabled={loading}>
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </Button>
      </div>

      {/* Search Results */}
      {products.length > 0 && (
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
          {products
            .filter((p) => !selectedProductIds.includes(p._id))
            .map((product) => (
              <div
                key={product._id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => addProduct(product)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {product.image?.sourceUrl && (
                    <img
                      src={product.image.sourceUrl}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    {product.price && (
                      <p className="text-xs text-gray-500">{product.price} VNĐ</p>
                    )}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  addProduct(product);
                }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
        </div>
      )}

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="space-y-2">
          {selectedProducts.map((product) => (
            <div
              key={product._id}
              className="flex items-center justify-between p-2 border rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                {product.image?.sourceUrl && (
                  <img
                    src={product.image.sourceUrl}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
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
                onClick={() => removeProduct(product._id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {selectedProducts.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Chưa có sản phẩm nào được chọn
        </p>
      )}
    </div>
  );
}

