'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ProductSearchResult {
  id: string;
  name: string;
  price?: number;
  image?: string;
  sku?: string;
}

interface ProductSearchInputProps {
  value: string[];
  onChange: (productIds: string[]) => void;
  placeholder?: string;
  excludeIds?: string[]; // Exclude current product and already selected products
}

/**
 * Product Search Input - Reusable component
 * Features:
 * - Debounced search
 * - Loading state
 * - Product suggestion list với image, name, price
 * - Add to selection on click
 * - Remove selected products
 */
export function ProductSearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm sản phẩm...',
  excludeIds = [],
}: ProductSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductSearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch selected products details
  useEffect(() => {
    const fetchSelectedProducts = async () => {
      if (value.length === 0) {
        setSelectedProducts([]);
        return;
      }

      try {
        const productPromises = value.map(async (id) => {
          try {
            const response = await fetch(`/api/admin/products/${id}`);
            if (response.ok) {
              const data = await response.json();
              const product = data.product || data;
              return {
                id: product.id || product._id?.toString(),
                name: product.name,
                price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
                image: product.image?.sourceUrl || product.images?.[0]?.sourceUrl || product.images?.[0],
                sku: product.sku,
              };
            }
          } catch (err) {
            console.error(`Error fetching product ${id}:`, err);
          }
          return null;
        });

        const products = (await Promise.all(productPromises)).filter(Boolean) as ProductSearchResult[];
        setSelectedProducts(products);
      } catch (error) {
        console.error('Error fetching selected products:', error);
      }
    };

    fetchSelectedProducts();
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/products?search=${encodeURIComponent(searchQuery)}&per_page=10&status=publish`
        );
        
        if (response.ok) {
          const data = await response.json();
          const allExcludeIds = [...excludeIds, ...value];
          
          // Handle different response formats
          type ProductResponse = { id?: string; _id?: { toString: () => string } | string; name?: string; image?: { sourceUrl?: string } | string; sku?: string; price?: string | number };
          let productsList: ProductResponse[] = [];
          if (Array.isArray(data)) {
            productsList = data;
          } else if (data.products && Array.isArray(data.products)) {
            productsList = data.products;
          } else if (data.data && Array.isArray(data.data)) {
            productsList = data.data;
          }
          
          const products: ProductSearchResult[] = productsList
            .map((product: ProductResponse) => {
              const productId = product.id || product._id?.toString();
              if (!productId) return null;
              
              // Handle image: can be string or object with sourceUrl
              let imageUrl: string | undefined;
              if (typeof product.image === 'string') {
                imageUrl = product.image;
              } else if (product.image && typeof product.image === 'object' && 'sourceUrl' in product.image) {
                imageUrl = product.image.sourceUrl;
              }
              
              return {
                id: productId,
                name: product.name || '',
                price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
                image: imageUrl,
                sku: product.sku || '',
              };
            })
            .filter((p) => 
              p !== null && !allExcludeIds.includes(p.id)
            ) as ProductSearchResult[];
          
          setResults(products);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error searching products:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, excludeIds, value]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (product: ProductSearchResult) => {
    if (!value.includes(product.id)) {
      onChange([...value, product.id]);
    }
    setSearchQuery('');
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleRemoveProduct = (productId: string) => {
    onChange(value.filter((id) => id !== productId));
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          className="pl-9 pr-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectProduct(product)}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border-b border-input last:border-b-0"
            >
              {product.image ? (
                <div className="relative w-12 h-12 rounded overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {product.sku && <span>SKU: {product.sku}</span>}
                  {product.price && <span>• {formatPrice(product.price)}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Products (Chips) */}
      {selectedProducts.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm"
            >
              {product.image ? (
                <div className="relative w-5 h-5 rounded overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="20px"
                  />
                </div>
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="max-w-[200px] truncate">{product.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveProduct(product.id)}
                className="ml-1 hover:text-destructive transition-colors"
                aria-label="Xóa"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {searchQuery && !loading && results.length === 0 && showResults && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          Không tìm thấy sản phẩm nào
        </div>
      )}
    </div>
  );
}
