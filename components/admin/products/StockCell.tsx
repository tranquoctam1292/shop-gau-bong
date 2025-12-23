'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { MappedProduct } from '@/lib/utils/productMapper';
import { InlineStockEditor } from './InlineStockEditor';

interface StockCellProps {
  product: MappedProduct;
  onUpdate?: (updatedProduct: MappedProduct) => void;
}

export function StockCell({ product, onUpdate }: StockCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Calculate total stock for variable products
  const stockQuantity = product.stockQuantity ?? 0;
  
  // Color labels: Xanh (>10), Vàng (<10), Đỏ (0)
  const getStockColor = (stock: number): string => {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const stockColor = getStockColor(stockQuantity);

  const handleSave = (newStock: number) => {
    // Update product locally (optimistic update)
    const updatedProduct: MappedProduct = {
      ...product,
      stockQuantity: newStock,
      stockStatus: newStock > 0 ? 'instock' : 'outofstock',
    };
    onUpdate?.(updatedProduct);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <InlineStockEditor
        productId={product.id}
        currentStock={product.stockQuantity}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded text-xs font-medium ${stockColor}`}>
        {stockQuantity}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Sửa kho"
      >
        <Pencil className="w-3 h-3 text-gray-400 hover:text-gray-600" />
      </button>
    </div>
  );
}

