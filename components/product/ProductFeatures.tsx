'use client';

/**
 * Product Features Component
 * 
 * Displays outstanding features/highlights of products
 * Used in product detail page below QuickOrderBox
 */

export function ProductFeatures() {
  const features = [
    'Chất liệu mềm mại, đảm bảo an toàn',
    'Bông polyester 3D trắng cao cấp, đàn hồi cao',
    'Đường may tỉ mỉ, chắc chắn',
    'Đa dạng kích thước',
    'Màu sắc tươi tắn',
  ];

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-purple-600 text-base mb-3">
        ĐẶC ĐIỂM NỔI BẬT
      </h3>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-purple-600">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

