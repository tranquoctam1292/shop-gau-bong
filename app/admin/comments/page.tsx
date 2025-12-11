'use client';

import { useState, useEffect } from 'react';
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
import { Search, Check, X, AlertTriangle } from 'lucide-react';

interface Comment {
  _id: string;
  postId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  createdAt: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchComments();
  }, [page, statusFilter]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
      });
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/comments?${params}`);
      const data = await response.json();

      let filtered = data.comments || [];
      if (search) {
        filtered = filtered.filter((comment: Comment) =>
          comment.content.toLowerCase().includes(search.toLowerCase()) ||
          comment.authorName.toLowerCase().includes(search.toLowerCase()) ||
          comment.authorEmail.toLowerCase().includes(search.toLowerCase())
        );
      }

      setComments(filtered);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCommentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/comments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      spam: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Đã từ chối',
      spam: 'Spam',
    };
    return texts[status] || status;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý bình luận</h1>
        <p className="text-gray-600 mt-2">Duyệt và quản lý bình luận bài viết</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Tìm kiếm bình luận..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-48 border rounded px-3 py-2"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
            <option value="spam">Spam</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">Đang tải...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không có bình luận nào
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((comment) => (
                  <TableRow key={comment._id}>
                    <TableCell className="font-medium">
                      {comment.authorName}
                    </TableCell>
                    <TableCell>{comment.authorEmail}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {comment.content}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${getStatusColor(
                          comment.status
                        )}`}
                      >
                        {getStatusText(comment.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {comment.status !== 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCommentStatus(comment._id, 'approved')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        {comment.status !== 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCommentStatus(comment._id, 'rejected')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                        {comment.status !== 'spam' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCommentStatus(comment._id, 'spam')}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <span className="px-4 py-2">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

