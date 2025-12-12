'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Settings, Loader2 } from 'lucide-react';
import type { Attribute } from '@/app/admin/attributes/page';

interface AttributeListTableProps {
  attributes: Attribute[];
  loading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  onEdit: (attribute: Attribute) => void;
  onDelete: (id: string) => void;
  onConfigureTerms: (id: string) => void;
}

const typeLabels: Record<Attribute['type'], string> = {
  text: 'Văn bản',
  color: 'Màu sắc',
  image: 'Hình ảnh',
  button: 'Nút bấm',
};

const typeColors: Record<Attribute['type'], string> = {
  text: 'bg-gray-100 text-gray-800',
  color: 'bg-pink-100 text-pink-800',
  image: 'bg-blue-100 text-blue-800',
  button: 'bg-green-100 text-green-800',
};

export function AttributeListTable({
  attributes,
  loading,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onConfigureTerms,
}: AttributeListTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm thuộc tính..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {attributes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {search ? 'Không tìm thấy thuộc tính nào' : 'Chưa có thuộc tính nào. Hãy thêm thuộc tính mới ở cột bên trái.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Loại hiển thị</TableHead>
                <TableHead>Các giá trị</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attribute) => (
                <TableRow key={attribute.id}>
                  <TableCell className="font-medium">{attribute.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {attribute.slug}
                  </TableCell>
                  <TableCell>
                    <Badge className={typeColors[attribute.type]}>
                      {typeLabels[attribute.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {attribute.termsCount || 0} giá trị
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onConfigureTerms(attribute.id)}
                        title="Cấu hình chủng loại"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(attribute)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(attribute.id)}
                        disabled={deletingId === attribute.id}
                        title="Xóa"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingId === attribute.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
