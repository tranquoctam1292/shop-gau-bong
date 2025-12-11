'use client';

import { ProductForm } from '@/components/admin/ProductForm';
import { use } from 'react';

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
        <p className="text-gray-600 mt-2">Cập nhật thông tin sản phẩm</p>
      </div>
      <ProductForm productId={id} />
    </div>
  );
}

