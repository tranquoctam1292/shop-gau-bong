'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Video, File, ArrowUpDown } from 'lucide-react';
import Image from 'next/image';
import type { MediaGridItem } from './MediaGrid';

interface MediaListProps {
  items: MediaGridItem[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  onItemClick?: (item: MediaGridItem) => void;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  multiple?: boolean;
  className?: string;
}

/**
 * MediaList Component
 * 
 * List view with detailed information
 * Sortable columns
 */
export function MediaList({
  items,
  selectedIds,
  onSelect,
  onDeselect,
  onItemClick,
  onSort,
  sortField,
  sortDirection,
  loading = false,
  multiple = false,
  className,
}: MediaListProps) {
  const handleRowClick = (item: MediaGridItem) => {
    if (multiple) {
      if (selectedIds.includes(item._id)) {
        onDeselect(item._id);
      } else {
        onSelect(item._id);
      }
    } else {
      onSelect(item._id);
    }
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5 text-gray-400" />;
      case 'video':
        return <Video className="h-5 w-5 text-gray-400" />;
      case 'document':
        return <File className="h-5 w-5 text-gray-400" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Không có media nào</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {multiple && (
              <TableHead className="w-12">
                <Checkbox
                  checked={items.length > 0 && items.every((item) => selectedIds.includes(item._id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      items.forEach((item) => onSelect(item._id));
                    } else {
                      items.forEach((item) => onDeselect(item._id));
                    }
                  }}
                />
              </TableHead>
            )}
            <TableHead className="w-16">Ảnh</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleSort('name')}
              >
                Tên
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleSort('size')}
              >
                Kích thước
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleSort('createdAt')}
              >
                Ngày tạo
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isSelected = selectedIds.includes(item._id);
            const isImage = item.type === 'image';
            const thumbnailUrl = item.thumbnail_url || item.url;

            return (
              <TableRow
                key={item._id}
                className={isSelected ? 'bg-primary/5' : ''}
                onClick={() => handleRowClick(item)}
              >
                {multiple && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelect(item._id);
                        } else {
                          onDeselect(item._id);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="relative w-12 h-12 bg-gray-100 rounded overflow-hidden">
                    {isImage ? (
                      <Image
                        src={thumbnailUrl}
                        alt={item.altText || item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getFileIcon(item.type)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFileIcon(item.type)}
                    <span className="capitalize">{item.type}</span>
                  </div>
                </TableCell>
                <TableCell>{formatFileSize(item.size)}</TableCell>
                <TableCell>{formatDate(item.createdAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
