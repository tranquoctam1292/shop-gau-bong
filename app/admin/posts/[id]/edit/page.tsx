'use client';

import { PostEditor } from '@/components/admin/PostEditor';

export default function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa bài viết</h1>
        <p className="text-gray-600 mt-2">Cập nhật nội dung bài viết</p>
      </div>
      <PostEditor postId={id} />
    </div>
  );
}

