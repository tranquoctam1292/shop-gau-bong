'use client';

import { AuthorForm } from '@/components/admin/AuthorForm';
import { use } from 'react';

export default function EditAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa tác giả</h1>
        <p className="text-gray-600 mt-2">Cập nhật thông tin tác giả</p>
      </div>
      <AuthorForm authorId={id} />
    </div>
  );
}

