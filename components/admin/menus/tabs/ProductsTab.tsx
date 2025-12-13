'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  image?: string;
}

interface SelectedItem {
  id: string;
  type: 'page' | 'category' | 'product' | 'post' | 'custom';
  title: string;
  url?: string;
  referenceId?: string;
}

interface ProductsTabProps {
  selectedItems: SelectedItem[];
  onItemSelect: (item: SelectedItem) => void;
  onItemDeselect: (itemId: string, type: SelectedItem['type']) => void;
}

export function ProductsTab({
  selectedItems,
  onItemSelect,
  onItemDeselect,
}: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        status: 'publish',
      });
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      const newProducts = (data.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price || '0',
        image: p.images?.[0] || null,
      }));

      if (page === 1) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }

      setHasMore(data.pagination?.hasNextPage || false);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const isSelected = (productId: string) => {
    return selectedItems.some((item) => item.id === productId && item.type === 'product');
  };

  const handleToggle = (product: Product) => {
    if (isSelected(product.id)) {
      onItemDeselect(product.id, 'product');
    } else {
      onItemSelect({
        id: product.id,
        type: 'product',
        title: product.name,
        referenceId: product.id,
      });
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Products List */}
      {loading && products.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="Không tìm thấy sản phẩm nào"
          description={search ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có sản phẩm nào'}
          icon="🛍️"
        />
      ) : (
        <>
          <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
            {filteredProducts.map((product) => {
              const checked = isSelected(product.id);
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors min-h-[44px]"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => handleToggle(product)}
                  />
                  {product.image && (
                    <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      /{product.slug}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  'Tải thêm'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

