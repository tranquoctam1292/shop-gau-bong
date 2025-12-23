'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttributeForm } from '@/components/admin/attributes/AttributeForm';
import { AttributeListTable } from '@/components/admin/attributes/AttributeListTable';
import { useToastContext } from '@/components/providers/ToastProvider';

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  type: 'text' | 'color' | 'image' | 'button';
  sortOrder: 'name' | 'number' | 'id';
  termsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminAttributesPage() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [search, setSearch] = useState('');

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      const response = await fetch(`/api/admin/attributes?${params.toString()}`);
      const data = await response.json();
      setAttributes(data.attributes || []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const handleCreate = async (attributeData: Omit<Attribute, 'id'>) => {
    try {
      const response = await fetch('/api/admin/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributeData),
      });

      if (response.ok) {
        const data = await response.json();
        setAttributes([...attributes, data.attribute]);
        showToast('Đã tạo thuộc tính thành công', 'success');
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to create attribute' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create attribute' };
    }
  };

  const handleUpdate = async (id: string, attributeData: Partial<Attribute>) => {
    try {
      const response = await fetch(`/api/admin/attributes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributeData),
      });

      if (response.ok) {
        const data = await response.json();
        setAttributes(attributes.map(attr => attr.id === id ? data.attribute : attr));
        setEditingAttribute(null);
        showToast('Đã cập nhật thuộc tính thành công', 'success');
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to update attribute' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update attribute' };
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa thuộc tính này? Tất cả các giá trị (terms) liên quan cũng sẽ bị xóa.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/attributes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAttributes(attributes.filter(attr => attr.id !== id));
        if (editingAttribute?.id === id) {
          setEditingAttribute(null);
        }
        showToast('Đã xóa thuộc tính thành công', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || 'Không thể xóa thuộc tính', 'error');
      }
    } catch (error) {
      console.error('Error deleting attribute:', error);
      showToast('Có lỗi xảy ra khi xóa thuộc tính', 'error');
    }
  };

  const handleEdit = (attribute: Attribute) => {
    setEditingAttribute(attribute);
  };

  const handleCancelEdit = () => {
    setEditingAttribute(null);
  };

  const handleConfigureTerms = (attributeId: string) => {
    router.push(`/admin/attributes/${attributeId}/terms`);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Các thuộc tính</h1>
        <p className="text-gray-600 mt-2">
          Quản lý các thuộc tính toàn cục (Màu sắc, Kích thước, Chất liệu) để sử dụng trong sản phẩm
        </p>
      </div>

      {/* 2 Column Layout - Giống WordPress Category Page */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cột Trái: Form thêm/sửa thuộc tính */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {editingAttribute ? 'Chỉnh sửa thuộc tính' : 'Thêm thuộc tính mới'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttributeForm
                initialData={editingAttribute}
                onSubmit={editingAttribute 
                  ? (data) => handleUpdate(editingAttribute.id, data)
                  : handleCreate
                }
                onCancel={editingAttribute ? handleCancelEdit : undefined}
              />
            </CardContent>
          </Card>
        </div>

        {/* Cột Phải: Bảng danh sách thuộc tính */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tất cả thuộc tính</CardTitle>
            </CardHeader>
            <CardContent>
              <AttributeListTable
                attributes={attributes}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onConfigureTerms={handleConfigureTerms}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
