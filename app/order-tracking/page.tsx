import { OrderTrackingForm } from '@/components/order/OrderTrackingForm';

export const metadata = {
  title: 'Theo dõi đơn hàng | Gấu Bông Shop',
  description: 'Theo dõi trạng thái đơn hàng của bạn',
};

export default function OrderTrackingPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Theo dõi đơn hàng
        </h1>
        <OrderTrackingForm />
      </div>
    </div>
  );
}

