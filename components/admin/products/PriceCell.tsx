'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { InlinePriceEditor } from './InlinePriceEditor';

interface PriceCellProps {
  product: MappedProduct;
  onUpdate?: (updatedProduct: MappedProduct) => void;
}

export function PriceCell({ product, onUpdate }: PriceCellProps) {
  const [isEditing, setIsEditing] = useState(false);

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice <= 0) {
      return 'Liên hệ';
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numPrice);
  };

  // For variable products, show price range
  const isVariable = product.type === 'variable' || (product.variations && product.variations.length > 0);
  
  let priceDisplay: string;
  if (isVariable) {
    // Get minPrice/maxPrice from product (may be in productDataMetaBox or direct fields)
    const productAny = product as any;
    const minPrice = productAny.minPrice 
      ? parseFloat(String(productAny.minPrice)) 
      : parseFloat(product.price);
    const maxPrice = productAny.maxPrice 
      ? parseFloat(String(productAny.maxPrice)) 
      : parseFloat(product.price);
    
    if (minPrice === maxPrice || isNaN(minPrice) || isNaN(maxPrice)) {
      priceDisplay = formatPrice(product.price);
    } else {
      priceDisplay = `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    }
  } else {
    priceDisplay = formatPrice(product.price);
  }

  const handleSave = (newPrice: number) => {
    // Update product locally (optimistic update)
    const updatedProduct: MappedProduct = {
      ...product,
      price: newPrice.toString(),
      regularPrice: newPrice.toString(),
    };
    onUpdate?.(updatedProduct);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <InlinePriceEditor
        productId={product.id}
        currentPrice={product.price}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-900">{priceDisplay}</span>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Sửa giá"
      >
        <Pencil className="w-3 h-3 text-gray-400 hover:text-gray-600" />
      </button>
    </div>
  );
}

