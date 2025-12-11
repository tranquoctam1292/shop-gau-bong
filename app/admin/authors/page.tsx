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

interface Author {
  _id: string;
  name: string;
  slug: string;
  email?: string;
  bio?: string;
  avatar?: string;
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/authors');
      const data = await response.json();

      let filtered = data.authors || [];
      if (search) {
        filtered = filtered.filter((author: Author) =>
          author.name.toLowerCase().includes(search.toLowerCase()) ||
          author.email?.toLowerCase().includes(search.toLowerCase())
        );
      }

      setAuthors(filtered);
    } catch (error) {
      console.error('Error fetching authors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tác giả này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/authors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAuthors();
      } else {
        const error = await response.json();
        alert(error.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error deleting author:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý tác giả</h1>
          <p className="text-gray-600 mt-2">Quản lý tất cả tác giả bài viết</p>
        </div>
        <Link href="/admin/authors/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Thêm tác giả
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : authors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không có tác giả nào
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authors.map((author) => (
                <TableRow key={author._id}>
                  <TableCell className="font-medium">
                    {author.name}
                  </TableCell>
                  <TableCell>{author.email || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {author.slug}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/admin/authors/${author._id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(author._id)}
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

