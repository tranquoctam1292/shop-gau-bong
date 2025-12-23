/**
 * Abbreviation Dictionary Table
 * 
 * Allows admin to manage abbreviation mappings for attributes
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToastContext } from '@/components/providers/ToastProvider';
import { useCategories } from '@/lib/hooks/useCategories';
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react';

interface SkuAbbreviation {
  _id: string;
  type: 'ATTRIBUTE';
  originalValue: string;
  shortCode: string;
  categoryId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export function AbbreviationDictionaryTable() {
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalValue, setOriginalValue] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch abbreviations
  const { data: abbreviationsData, isLoading } = useQuery({
    queryKey: ['sku-abbreviations', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('type', 'ATTRIBUTE');
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const res = await fetch(`/api/admin/sku/abbreviations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch abbreviations');
      return res.json();
    },
  });

  // Fetch categories
  const { categories: categoriesList } = useCategories({ type: 'flat' });

  const abbreviations: SkuAbbreviation[] = (abbreviationsData?.success && abbreviationsData?.data) || [];

  // Create category map for lookup
  const categoryMap = new Map(
    (categoriesList || []).map((cat: any) => [cat.id, cat.name])
  );

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      id?: string;
      originalValue: string;
      shortCode: string;
      categoryId?: string | null;
    }) => {
      const url = data.id
        ? `/api/admin/sku/abbreviations/${data.id}`
        : '/api/admin/sku/abbreviations';
      const method = data.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'ATTRIBUTE',
          originalValue: data.originalValue,
          shortCode: data.shortCode,
          categoryId: data.categoryId || null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save abbreviation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku-abbreviations'] });
      showToast(
        editingId ? 'Đã cập nhật viết tắt' : 'Đã thêm viết tắt',
        'success'
      );
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.message || 'Đã xảy ra lỗi khi lưu', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/sku/abbreviations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete abbreviation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku-abbreviations'] });
      showToast('Đã xóa viết tắt', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Đã xảy ra lỗi khi xóa', 'error');
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setOriginalValue('');
    setShortCode('');
    setCategoryId(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (abbreviation: SkuAbbreviation) => {
    setEditingId(abbreviation._id);
    setOriginalValue(abbreviation.originalValue);
    setShortCode(abbreviation.shortCode);
    setCategoryId(abbreviation.categoryId?.toString() || null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa viết tắt này?')) {
      return;
    }
    deleteMutation.mutate(id);
  };

  const handleSave = () => {
    if (!originalValue.trim()) {
      showToast('Giá trị gốc không được để trống', 'error');
      return;
    }
    if (!shortCode.trim()) {
      showToast('Mã viết tắt không được để trống', 'error');
      return;
    }
    saveMutation.mutate({
      id: editingId || undefined,
      originalValue: originalValue.trim(),
      shortCode: shortCode.trim().toUpperCase(),
      categoryId: categoryId || null,
    });
  };

  // Auto-uppercase shortCode
  const handleShortCodeChange = (value: string) => {
    setShortCode(value.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Từ Điển Viết Tắt</CardTitle>
          <CardDescription>Quản lý viết tắt cho các giá trị thuộc tính</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Từ Điển Viết Tắt</CardTitle>
              <CardDescription>Quản lý viết tắt cho các giá trị thuộc tính</CardDescription>
            </div>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Thêm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo giá trị gốc hoặc mã viết tắt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {abbreviations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>
                {searchQuery
                  ? 'Không tìm thấy viết tắt nào.'
                  : 'Chưa có viết tắt nào. Thêm viết tắt để SKU ngắn gọn hơn.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giá trị gốc</TableHead>
                  <TableHead>Mã viết tắt</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abbreviations.map((abbreviation) => (
                  <TableRow key={abbreviation._id}>
                    <TableCell className="font-medium">
                      {abbreviation.originalValue}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold">{abbreviation.shortCode}</span>
                    </TableCell>
                    <TableCell>
                      {abbreviation.categoryId
                        ? categoryMap.get(abbreviation.categoryId) || 'Unknown'
                        : 'Toàn cục'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(abbreviation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(abbreviation._id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Sửa Viết Tắt' : 'Thêm Viết Tắt'}
            </DialogTitle>
            <DialogDescription>
              Tạo mapping giữa giá trị gốc và mã viết tắt để SKU ngắn gọn hơn.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Original Value */}
            <div className="space-y-2">
              <Label htmlFor="originalValue">Giá trị gốc *</Label>
              <Input
                id="originalValue"
                value={originalValue}
                onChange={(e) => setOriginalValue(e.target.value)}
                placeholder="Ví dụ: Màu Đỏ, Size L, Material Cotton"
              />
            </div>

            {/* Short Code */}
            <div className="space-y-2">
              <Label htmlFor="shortCode">Mã viết tắt *</Label>
              <Input
                id="shortCode"
                value={shortCode}
                onChange={(e) => handleShortCodeChange(e.target.value)}
                placeholder="Ví dụ: DO, L, COT"
                maxLength={10}
                className="font-mono uppercase"
              />
              <p className="text-sm text-gray-500">
                Tối đa 10 ký tự. Tự động chuyển thành chữ hoa.
              </p>
            </div>

            {/* Category (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục (tùy chọn)</Label>
              <Select
                value={categoryId || '__none__'}
                onValueChange={(value) => setCategoryId(value === '__none__' ? null : value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Chọn danh mục (để trống = toàn cục)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Toàn cục (áp dụng cho tất cả)</SelectItem>
                  {(categoriesList || []).map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Nếu chọn danh mục, viết tắt này chỉ áp dụng cho danh mục đó.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !originalValue.trim() || !shortCode.trim()}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

