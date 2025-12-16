'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TermForm } from '@/components/admin/attributes/TermForm';
import { TermListTable } from '@/components/admin/attributes/TermListTable';
import type { Attribute } from '@/app/admin/attributes/page';
import { useToastContext } from '@/components/providers/ToastProvider';

export interface Term {
  id: string;
  attributeId: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
  // Type-specific fields
  colorHex?: string;
  colorHex2?: string; // For gradient
  imageUrl?: string;
  imageId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminAttributeTermsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToastContext();
  const attributeId = params.id as string;
  
  const [attribute, setAttribute] = useState<Attribute | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAttribute();
    fetchTerms();
  }, [attributeId, search]);

  const fetchAttribute = async () => {
    try {
      const response = await fetch(`/api/admin/attributes/${attributeId}`);
      if (response.ok) {
        const data = await response.json();
        setAttribute(data.attribute);
      } else {
        router.push('/admin/attributes');
      }
    } catch (error) {
      console.error('Error fetching attribute:', error);
      router.push('/admin/attributes');
    }
  };

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      const response = await fetch(`/api/admin/attributes/${attributeId}/terms?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTerms(data.terms || []);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (termData: Omit<Term, 'id' | 'attributeId'>) => {
    try {
      const response = await fetch(`/api/admin/attributes/${attributeId}/terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termData),
      });

      if (response.ok) {
        const data = await response.json();
        setTerms([...terms, data.term]);
        showToast('Đã tạo giá trị thành công', 'success');
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to create term' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create term' };
    }
  };

  const handleUpdate = async (termId: string, termData: Partial<Term>) => {
    try {
      const response = await fetch(`/api/admin/attributes/${attributeId}/terms/${termId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termData),
      });

      if (response.ok) {
        const data = await response.json();
        setTerms(terms.map(term => term.id === termId ? data.term : term));
        setEditingTerm(null);
        showToast('Đã cập nhật giá trị thành công', 'success');
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to update term' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update term' };
    }
  };

  const handleDelete = async (termId: string) => {
    if (!confirm('Bạn có chắc muốn xóa giá trị này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/attributes/${attributeId}/terms/${termId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTerms(terms.filter(term => term.id !== termId));
        if (editingTerm?.id === termId) {
          setEditingTerm(null);
        }
        showToast('Đã xóa giá trị thành công', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Không thể xóa giá trị', 'error');
      }
    } catch (error) {
      console.error('Error deleting term:', error);
      showToast('Có lỗi xảy ra khi xóa giá trị', 'error');
    }
  };

  const handleEdit = (term: Term) => {
    setEditingTerm(term);
  };

  const handleCancelEdit = () => {
    setEditingTerm(null);
  };

  if (!attribute) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  const typeLabels: Record<Attribute['type'], string> = {
    text: 'Văn bản',
    color: 'Màu sắc',
    image: 'Hình ảnh',
    button: 'Nút bấm',
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/attributes">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách thuộc tính
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Cấu hình chủng loại: {attribute.name}
          </h1>
          <p className="text-gray-600 mt-2">
            Loại hiển thị: <span className="font-semibold">{typeLabels[attribute.type]}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý các giá trị cụ thể cho thuộc tính này (Ví dụ: Đỏ, Xanh cho &quot;Màu sắc&quot;)
          </p>
        </div>
      </div>

      {/* 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột Trái: Form thêm/sửa term */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {editingTerm ? 'Chỉnh sửa giá trị' : 'Thêm giá trị mới'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TermForm
                attributeType={attribute.type}
                initialData={editingTerm}
                onSubmit={editingTerm
                  ? (data) => handleUpdate(editingTerm.id, data)
                  : handleCreate
                }
                onCancel={editingTerm ? handleCancelEdit : undefined}
              />
            </CardContent>
          </Card>
        </div>

        {/* Cột Phải: Bảng danh sách terms */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tất cả giá trị ({terms.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <TermListTable
                terms={terms}
                attributeType={attribute.type}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
