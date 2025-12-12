'use client';

import { OrderDetail } from '@/components/admin/OrderDetail';

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
        <p className="text-gray-600 mt-2">Xem và quản lý đơn hàng</p>
      </div>
      <OrderDetail orderId={id} />
    </div>
  );
}

