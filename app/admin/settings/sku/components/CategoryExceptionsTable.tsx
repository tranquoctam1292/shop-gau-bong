/**
 * Category Exceptions Table
 * 
 * Allows admin to override global pattern for specific categories
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
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { TOKENS } from '@/lib/utils/skuTokens';

interface SkuSetting {
  _id?: string;
  categoryId?: string | null;
  pattern: string;
  separator: string;
  caseType: 'UPPER' | 'LOWER';
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryException {
  _id: string;
  categoryId: string;
  categoryName?: string;
  pattern: string;
  separator: string;
  caseType: 'UPPER' | 'LOWER';
}

export function CategoryExceptionsTable() {
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [pattern, setPattern] = useState('');
  const [separator, setSeparator] = useState('-');
  const [caseType, setCaseType] = useState<'UPPER' | 'LOWER'>('UPPER');

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['sku-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/sku/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
  });

  // Fetch categories
  const { categories: categoriesList } = useCategories({ type: 'flat' });

  // Get category exceptions (non-global settings)
  const categorySettings = (settingsData?.success && settingsData?.data?.categories) || [];

  // Create category map for lookup
  const categoryMap = new Map(
    (categoriesList || []).map((cat: any) => [cat.id, cat.name])
  );

  // Add category names to settings
  const categoryExceptions: CategoryException[] = categorySettings.map((setting: SkuSetting) => ({
    _id: setting._id || '',
    categoryId: setting.categoryId?.toString() || '',
    categoryName: categoryMap.get(setting.categoryId?.toString() || '') || 'Unknown',
    pattern: setting.pattern,
    separator: setting.separator,
    caseType: setting.caseType,
  }));

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      categoryId: string;
      pattern: string;
      separator: string;
      caseType: 'UPPER' | 'LOWER';
    }) => {
      const res = await fetch('/api/admin/sku/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save setting');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku-settings'] });
      showToast('Đã lưu cài đặt cho danh mục', 'success');
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.message || 'Đã xảy ra lỗi khi lưu', 'error');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await fetch(`/api/admin/sku/settings?categoryId=${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete setting');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sku-settings'] });
      showToast('Đã xóa cài đặt cho danh mục', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Đã xảy ra lỗi khi xóa', 'error');
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setSelectedCategoryId('');
    setPattern('');
    setSeparator('-');
    setCaseType('UPPER');
  };

  const handleAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (exception: CategoryException) => {
    setEditingId(exception._id);
    setSelectedCategoryId(exception.categoryId);
    setPattern(exception.pattern);
    setSeparator(exception.separator);
    setCaseType(exception.caseType);
    setIsDialogOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    if (!confirm('Bạn có chắc muốn xóa cài đặt cho danh mục này?')) {
      return;
    }
    deleteMutation.mutate(categoryId);
  };

  const handleSave = () => {
    if (!selectedCategoryId) {
      showToast('Vui lòng chọn danh mục', 'error');
      return;
    }
    if (!pattern.trim()) {
      showToast('Pattern không được để trống', 'error');
      return;
    }
    saveMutation.mutate({ categoryId: selectedCategoryId, pattern, separator, caseType });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ngoại Lệ Theo Danh Mục</CardTitle>
          <CardDescription>Ghi đè pattern cho từng danh mục cụ thể</CardDescription>
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
              <CardTitle>Ngoại Lệ Theo Danh Mục</CardTitle>
              <CardDescription>Ghi đè pattern cho từng danh mục cụ thể</CardDescription>
            </div>
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Thêm
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categoryExceptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có ngoại lệ nào. Tất cả danh mục sẽ sử dụng pattern toàn cục.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Pattern</TableHead>
                  <TableHead>Ngăn cách</TableHead>
                  <TableHead>Kiểu chữ</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryExceptions.map((exception) => (
                  <TableRow key={exception._id}>
                    <TableCell className="font-medium">{exception.categoryName}</TableCell>
                    <TableCell className="font-mono text-sm">{exception.pattern}</TableCell>
                    <TableCell>{exception.separator}</TableCell>
                    <TableCell>{exception.caseType}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(exception)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(exception.categoryId)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Sửa Cài Đặt Danh Mục' : 'Thêm Cài Đặt Danh Mục'}
            </DialogTitle>
            <DialogDescription>
              Cấu hình pattern riêng cho danh mục này. Pattern này sẽ ghi đè pattern toàn cục.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Category Select */}
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục *</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={setSelectedCategoryId}
                disabled={!!editingId}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesList || []).map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pattern Input */}
            <div className="space-y-2">
              <Label htmlFor="pattern">Pattern *</Label>
              <Input
                id="pattern"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="{CATEGORY_CODE}-{PRODUCT_NAME}-{INCREMENT}"
                className="font-mono"
              />
              <p className="text-sm text-gray-500">
                Sử dụng các token: {Object.values(TOKENS).join(', ')}
              </p>
            </div>

            {/* Separator */}
            <div className="space-y-2">
              <Label>Ký tự ngăn cách</Label>
              <div className="flex gap-4">
                {['-', '_', '.'].map((sep) => (
                  <label
                    key={sep}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="separator"
                      value={sep}
                      checked={separator === sep}
                      onChange={(e) => setSeparator(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="font-mono text-lg">{sep}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Case Type */}
            <div className="space-y-2">
              <Label>Kiểu chữ</Label>
              <div className="flex gap-4">
                {(['UPPER', 'LOWER'] as const).map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded border hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="caseType"
                      value={type}
                      checked={caseType === type}
                      onChange={(e) => setCaseType(e.target.value as 'UPPER' | 'LOWER')}
                      className="w-4 h-4"
                    />
                    <span>{type === 'UPPER' ? 'CHỮ HOA' : 'chữ thường'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !selectedCategoryId || !pattern.trim()}
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

