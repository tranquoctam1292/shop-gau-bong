'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { MappedProduct } from '@/lib/utils/productMapper';

interface StatusCellProps {
  product: MappedProduct;
  onStatusChange?: (status: 'draft' | 'publish') => Promise<void>;
}

export function StatusCell({ product, onStatusChange }: StatusCellProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Determine status from product
  // Priority: status field > stockStatus > isActive
  const status = (product as any).status || 
                 (product.stockStatus === 'instock' ? 'publish' : 'draft') ||
                 (product.isActive ? 'publish' : 'draft');
  
  const isPublished = status === 'publish';
  const isDraft = status === 'draft';
  const isTrash = status === 'trash';

  const handleToggle = async () => {
    if (!onStatusChange || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const newStatus = isPublished ? 'draft' : 'publish';
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Status badge colors
  const getStatusBadge = () => {
    if (isTrash) {
      return 'bg-gray-100 text-gray-800';
    }
    if (isPublished) {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusLabel = () => {
    if (isTrash) return 'Thùng rác';
    if (isPublished) return 'Đang bán';
    return 'Bản nháp';
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge()}`}>
        {getStatusLabel()}
      </span>
      {!isTrash && onStatusChange && (
        <div className="flex items-center gap-2">
          <Switch
            id={`status-${product.id}`}
            checked={isPublished}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
          <Label htmlFor={`status-${product.id}`} className="text-xs text-gray-500">
            {isPublished ? 'Bật' : 'Tắt'}
          </Label>
        </div>
      )}
    </div>
  );
}

