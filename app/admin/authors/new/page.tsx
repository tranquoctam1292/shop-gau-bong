'use client';

import { AuthorForm } from '@/components/admin/AuthorForm';

export default function NewAuthorPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Thêm tác giả mới</h1>
        <p className="text-gray-600 mt-2">Tạo tác giả mới cho blog</p>
      </div>
      <AuthorForm />
    </div>
  );
}

