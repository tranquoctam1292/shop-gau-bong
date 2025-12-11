'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import type { MappedCategory } from '@/lib/utils/productMapper';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<MappedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();

      let filtered = data.categories || [];
      if (search) {
        filtered = filtered.filter((cat: MappedCategory) =>
          cat.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      setCategories(filtered);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục</h1>
          <p className="text-gray-600 mt-2">Quản lý tất cả danh mục sản phẩm</p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm danh mục
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không có danh mục nào
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Số sản phẩm</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-sm">
                    {category.databaseId}
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.name}
                  </TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.count || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/admin/categories/${category.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

