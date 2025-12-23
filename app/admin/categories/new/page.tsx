'use client';

import { CategoryForm } from '@/components/admin/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Thêm danh mục mới</h1>
        <p className="text-gray-600 mt-2">Tạo danh mục sản phẩm mới</p>
      </div>
      <CategoryForm />
    </div>
  );
}

