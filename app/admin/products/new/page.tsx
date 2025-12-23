'use client';

import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
        <p className="text-gray-600 mt-2">Tạo sản phẩm mới cho cửa hàng</p>
      </div>
      <ProductForm />
    </div>
  );
}

