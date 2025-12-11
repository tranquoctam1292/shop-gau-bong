'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X, Trash2, ThumbsUp } from 'lucide-react';

interface Review {
  _id: string;
  rating: number;
  title?: string;
  content: string;
  authorName: string;
  authorEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  photos?: string[];
  helpfulCount: number;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [productId, statusFilter, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/products/${productId}/reviews?${params}`);
      const data = await response.json();
      setReviews(data.reviews || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchReviews();
      } else {
        alert('Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating review status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchReviews();
      } else {
        alert('Có lỗi xảy ra khi xóa đánh giá');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Có lỗi xảy ra khi xóa đánh giá');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Đã từ chối', className: 'bg-red-100 text-red-800' },
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge className={variant.className}>{variant.label}</Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Đánh giá sản phẩm</CardTitle>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có đánh giá nào
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {renderStars(review.rating)}
                      {review.title && (
                        <span className="font-medium">{review.title}</span>
                      )}
                      {getStatusBadge(review.status)}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{review.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{review.authorName}</span>
                      <span>{review.authorEmail}</span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                      {review.helpfulCount > 0 && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {review.helpfulCount} hữu ích
                        </span>
                      )}
                    </div>
                    {review.photos && review.photos.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Review photo ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {review.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(review._id, 'approved')}
                          className="text-green-600"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(review._id, 'rejected')}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(review._id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <span className="px-4 py-2 text-sm">
                  Trang {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

