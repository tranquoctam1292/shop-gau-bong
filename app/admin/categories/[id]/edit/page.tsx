'use client';

import { CategoryForm } from '@/components/admin/CategoryForm';
import { use } from 'react';

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa danh mục</h1>
        <p className="text-gray-600 mt-2">Cập nhật thông tin danh mục</p>
      </div>
      <CategoryForm categoryId={id} />
    </div>
  );
}

