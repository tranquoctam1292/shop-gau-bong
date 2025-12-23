/**
 * Product Selector Modal
 * 
 * Modal để chọn product và variant để thêm vào order:
 * - Search products
 * - Select product và variant (nếu có)
 * - Select quantity
 * - Add to order
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Image as ImageIcon } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  regularPrice?: number;
  salePrice?: number;
  onSale?: boolean;
  images?: string[];
  type: 'simple' | 'variable';
  variants?: Array<{
    id: string;
    size?: string;
    color?: string;
    price: number;
    stock?: number;
    image?: string;
  }>;
  stockStatus?: string;
  stockQuantity?: number;
}

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product, variantId?: string, quantity?: number) => void;
}

export function ProductSelectorModal({
  isOpen,
  onClose,
  onSelect,
}: ProductSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Search products
  useEffect(() => {
    if (!searchQuery.trim() || !isOpen) {
      setProducts([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/products?search=${encodeURIComponent(searchQuery)}&per_page=20&status=publish`
        );

        if (response.ok) {
          const data = await response.json();
          const productsList = data.products || data.data || [];
          setProducts(productsList);
        }
      } catch (error) {
        console.error('Error searching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariantId('');
    setQuantity(1);

    // If simple product, auto-select it
    if (product.type === 'simple' && product.variants?.length === 0) {
      // No variants, ready to add
    } else if (product.variants && product.variants.length > 0) {
      // Has variants, need to select one
      setSelectedVariantId(product.variants[0].id);
    }
  };

  const handleAddToOrder = async () => {
    if (!selectedProduct) return;

    // For variable products, require variant selection
    if (selectedProduct.type === 'variable' && !selectedVariantId) {
      alert('Vui lòng chọn biến thể sản phẩm');
      return;
    }

    if (quantity < 1) {
      alert('Số lượng phải lớn hơn 0');
      return;
    }

    // Check stock availability before adding
    try {
      const stockResponse = await fetch(
        `/api/admin/products/${selectedProduct._id}/stock${selectedVariantId ? `?variationId=${selectedVariantId}&quantity=${quantity}` : `?quantity=${quantity}`}`
      );
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        if (!stockData.stock.canFulfill) {
          alert(
            `Không đủ hàng trong kho. Còn lại: ${stockData.stock.available}, Yêu cầu: ${quantity}`
          );
          return;
        }
      }
    } catch (stockError) {
      console.error('Error checking stock:', stockError);
      // Continue with add if stock check fails (might be non-stock product)
    }

    onSelect(selectedProduct, selectedVariantId || undefined, quantity);
    
    // Reset state
    setSelectedProduct(null);
    setSelectedVariantId('');
    setQuantity(1);
    setSearchQuery('');
    setProducts([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setSelectedVariantId('');
    setQuantity(1);
    setSearchQuery('');
    setProducts([]);
    onClose();
  };

  const getProductPrice = (product: Product, variantId?: string): number => {
    if (variantId && product.variants) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant) {
        return variant.price;
      }
    }
    return product.salePrice && product.onSale ? product.salePrice : product.price;
  };

  const getProductImage = (product: Product, variantId?: string): string | undefined => {
    if (variantId && product.variants) {
      const variant = product.variants.find((v) => v.id === variantId);
      if (variant?.image) {
        return variant.image;
      }
    }
    return product.images?.[0];
  };

  const selectedPrice = selectedProduct
    ? getProductPrice(selectedProduct, selectedVariantId || undefined)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chọn sản phẩm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="product-search">Tìm kiếm sản phẩm</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="product-search"
                placeholder="Nhập tên sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleProductSelect(product)}
                      className={`p-3 border rounded-lg text-left hover:bg-accent transition-colors ${
                        selectedProduct?._id === product._id
                          ? 'border-primary bg-accent'
                          : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {product.images?.[0] ? (
                          <div className="relative w-16 h-16 rounded overflow-hidden">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(product.price)}
                          </p>
                          {product.type === 'variable' && (
                            <p className="text-xs text-muted-foreground">
                              {product.variants?.length || 0} biến thể
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Không tìm thấy sản phẩm
                </div>
              )}
            </div>
          )}

          {/* Selected Product Details */}
          {selectedProduct && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex gap-4">
                {getProductImage(selectedProduct, selectedVariantId || undefined) ? (
                  <div className="relative w-24 h-24 rounded overflow-hidden">
                    <Image
                      src={getProductImage(selectedProduct, selectedVariantId || undefined)!}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold">{selectedProduct.name}</h4>
                  <p className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(selectedPrice)}
                  </p>
                </div>
              </div>

              {/* Variant Selection */}
              {selectedProduct.type === 'variable' &&
                selectedProduct.variants &&
                selectedProduct.variants.length > 0 && (
                  <div className="space-y-2">
                    <Label>Chọn biến thể</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedProduct.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`p-2 border rounded text-left hover:bg-accent transition-colors ${
                            selectedVariantId === variant.id
                              ? 'border-primary bg-accent'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {variant.size && (
                              <span className="text-sm font-medium">Size: {variant.size}</span>
                            )}
                            {variant.color && (
                              <span className="text-sm">Màu: {variant.color}</span>
                            )}
                            <span className="text-sm text-muted-foreground ml-auto">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(variant.price)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Số lượng</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-32"
                />
              </div>

              {/* Total */}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Tổng tiền:</span>
                  <span className="text-lg font-bold">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(selectedPrice * quantity)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            onClick={handleAddToOrder}
            disabled={!selectedProduct || quantity < 1}
            className="min-h-[44px]"
          >
            Thêm vào đơn hàng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

