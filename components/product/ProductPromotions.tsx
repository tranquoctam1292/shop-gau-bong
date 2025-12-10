'use client';

import { Gift, Package, Truck, Shield, Star } from 'lucide-react';

interface ProductPromotionsProps {
  promotions?: {
    freeGift?: boolean;
    freeCard?: boolean;
    freeShip?: boolean;
    warranty?: boolean;
    rewardPoints?: boolean;
  };
}

export function ProductPromotions({ promotions }: ProductPromotionsProps) {
  // Default promotions (hardcoded - có thể lấy từ ACF fields sau)
  const defaultPromotions = {
    freeGift: true,
    freeCard: true,
    freeShip: true,
    warranty: true,
    rewardPoints: true,
  };

  const activePromotions = promotions || defaultPromotions;

  // Check if any promotion is active
  const hasActivePromotions =
    activePromotions.freeGift ||
    activePromotions.freeCard ||
    activePromotions.freeShip ||
    activePromotions.warranty ||
    activePromotions.rewardPoints;

  if (!hasActivePromotions) return null;

  return (
    <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
      <h3 className="font-heading text-lg font-semibold mb-3">
        Ưu đãi đặc biệt
      </h3>
      <ul className="space-y-2">
        {activePromotions.freeGift && (
          <li className="flex items-center gap-2 text-sm text-text-main">
            <Gift className="w-4 h-4 text-primary" />
            <span>Miễn phí Gói Quà (Túi trong suốt + Nơ)</span>
          </li>
        )}
        {activePromotions.freeCard && (
          <li className="flex items-center gap-2 text-sm text-text-main">
            <Package className="w-4 h-4 text-primary" />
            <span>Miễn phí Tặng kèm thiệp ý nghĩa (Sinh nhật, Tình yêu, Cảm ơn, Lễ tết)</span>
          </li>
        )}
        {activePromotions.freeShip && (
          <li className="flex items-center gap-2 text-sm text-text-main">
            <Truck className="w-4 h-4 text-primary" />
            <span>Hỏa Tốc: Giao hàng trong 45-60 phút tại HCM</span>
          </li>
        )}
        {activePromotions.warranty && (
          <li className="flex items-center gap-2 text-sm text-text-main">
            <Shield className="w-4 h-4 text-primary" />
            <span>Bảo Hành: Bảo hành trọn đời đường may tại cửa hàng</span>
          </li>
        )}
        {activePromotions.rewardPoints && (
          <li className="flex items-center gap-2 text-sm text-text-main">
            <Star className="w-4 h-4 text-primary" />
            <span>Tích Điểm: Tích 3% giá trị đơn hàng</span>
          </li>
        )}
      </ul>
    </div>
  );
}

