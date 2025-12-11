'use client';

import { PostEditor } from '@/components/admin/PostEditor';

export default function NewPostPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Thêm bài viết mới</h1>
        <p className="text-gray-600 mt-2">Tạo bài viết blog mới</p>
      </div>
      <PostEditor />
    </div>
  );
}

