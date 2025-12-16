'use client';

import { useState } from 'react';
import Image from 'next/image';
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
import { Search, Edit, Trash2, Loader2 } from 'lucide-react';
import type { Term } from '@/app/admin/attributes/[id]/terms/page';
import type { Attribute } from '@/app/admin/attributes/page';

interface TermListTableProps {
  terms: Term[];
  attributeType: Attribute['type'];
  loading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  onEdit: (term: Term) => void;
  onDelete: (id: string) => void;
}

export function TermListTable({
  terms,
  attributeType,
  loading,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: TermListTableProps) {
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
          placeholder="Tìm kiếm giá trị..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {terms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {search ? 'Không tìm thấy giá trị nào' : 'Chưa có giá trị nào. Hãy thêm giá trị mới ở cột bên trái.'}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Tên</TableHead>
                {attributeType === 'text' || attributeType === 'color' ? (
                  <TableHead>Slug</TableHead>
                ) : null}
                {attributeType === 'button' || attributeType === 'text' || attributeType === 'color' ? (
                  <TableHead>Mô tả</TableHead>
                ) : null}
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => (
                <TableRow key={term.id}>
                  {/* Preview Column */}
                  <TableCell>
                    {attributeType === 'color' && term.colorHex && (
                      <div
                        className="w-12 h-12 rounded-full border-2 border-gray-300"
                        style={{
                          background: term.colorHex2
                            ? `linear-gradient(135deg, ${term.colorHex} 0%, ${term.colorHex2} 100%)`
                            : term.colorHex,
                        }}
                        title={term.name}
                      />
                    )}
                    {(attributeType === 'image' || attributeType === 'button') && term.imageUrl && (
                      <div className="relative w-12 h-12 border rounded overflow-hidden">
                        <Image
                          src={term.imageUrl}
                          alt={term.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                    {attributeType === 'text' && (
                      <div className="w-12 h-12 rounded border-2 border-gray-200 flex items-center justify-center text-xs text-muted-foreground">
                        Text
                      </div>
                    )}
                  </TableCell>

                  {/* Name */}
                  <TableCell className="font-medium">{term.name}</TableCell>

                  {/* Slug */}
                  {(attributeType === 'text' || attributeType === 'color') && (
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {term.slug}
                    </TableCell>
                  )}

                  {/* Description */}
                  {(attributeType === 'button' || attributeType === 'text' || attributeType === 'color') && (
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {term.description || '-'}
                    </TableCell>
                  )}

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(term)}
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(term.id)}
                        disabled={deletingId === term.id}
                        title="Xóa"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingId === term.id ? (
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
