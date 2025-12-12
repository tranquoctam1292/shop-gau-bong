'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Edit,
  Trash2,
  Power,
  PowerOff,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Pencil,
} from 'lucide-react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { MappedCategory } from '@/lib/utils/productMapper';

interface CategoryTreeNode extends MappedCategory {
  children?: CategoryTreeNode[];
  level?: number;
}

interface SortableCategoryRowProps {
  category: CategoryTreeNode;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onEdit: () => void;
  onQuickEdit?: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onAddSubCategory?: () => void;
}

export function SortableCategoryRow({
  category,
  isSelected,
  isExpanded,
  onToggleSelect,
  onToggleExpand,
  onEdit,
  onQuickEdit,
  onToggleStatus,
  onDelete,
  onAddSubCategory,
}: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = category.children && category.children.length > 0;
  const level = category.level || 0;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'bg-blue-50' : ''}
    >
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
        />
      </TableCell>
      <TableCell className="w-16">
        {category.image?.sourceUrl ? (
          <div className="relative w-12 h-12 rounded overflow-hidden">
            <Image
              src={category.image.sourceUrl}
              alt={category.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">No img</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            title="Kéo để sắp xếp"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}
          
          <div className="flex items-center gap-2">
            <span className="font-medium">{category.name}</span>
            {onQuickEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickEdit();
                }}
                className="h-6 w-6 p-0"
                title="Sửa nhanh"
              >
                <Pencil className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">{category.slug}</TableCell>
      <TableCell>
        <Badge
          variant={category.status === 'active' ? 'default' : 'outline'}
          className={category.status === 'active' ? 'bg-green-500' : ''}
        >
          {category.status === 'active' ? 'Hoạt động' : 'Tắt'}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <Link
          href={`/admin/products?category=${category.id}`}
          className="text-primary hover:underline"
        >
          {category.count || 0}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            title="Chỉnh sửa"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleStatus}
            title={category.status === 'active' ? 'Tắt' : 'Bật'}
          >
            {category.status === 'active' ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </Button>
          {onAddSubCategory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddSubCategory}
              title="Thêm danh mục con"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

