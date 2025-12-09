/**
 * Tính cân nặng quy đổi thể tích (Volumetric Weight)
 * Công thức: (Length × Width × Height) / 6000
 * 
 * @param length - Chiều dài (cm)
 * @param width - Chiều rộng (cm)
 * @param height - Chiều cao (cm)
 * @returns Cân nặng quy đổi (kg)
 */
export function calculateVolumetricWeight(
  length: number | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined
): number {
  // Safety check: Convert to Numbers và handle null/undefined
  const l = Number(length) || 0;
  const w = Number(width) || 0;
  const h = Number(height) || 0;

  if (l <= 0 || w <= 0 || h <= 0) {
    return 0;
  }

  // Công thức theo .cursorrules và KE_HOACH_DU_AN.md
  return (l * w * h) / 6000;
}

/**
 * Lấy cân nặng để tính phí vận chuyển
 * Logic: Lấy giá trị lớn hơn giữa cân nặng thực và cân nặng quy đổi
 * 
 * @param actualWeight - Cân nặng thực tế (kg)
 * @param volumetricWeight - Cân nặng quy đổi (kg)
 * @returns Cân nặng để tính phí ship (kg)
 */
export function getShippingWeight(
  actualWeight: number | null | undefined,
  volumetricWeight: number | null | undefined
): number {
  // Safety check: Convert to Numbers
  const actual = Number(actualWeight) || 0;
  const volumetric = Number(volumetricWeight) || 0;

  // Logic theo .cursorrules: Math.max(actualWeight, volumetricWeight)
  return Math.max(actual, volumetric);
}

/**
 * Tính tổng cân nặng vận chuyển cho giỏ hàng
 * 
 * @param items - Danh sách sản phẩm trong giỏ hàng
 * @returns Tổng cân nặng (kg)
 */
export function calculateTotalShippingWeight(
  items: Array<{
    quantity: number;
    product: {
      weight?: number | null;
      productSpecs?: {
        length?: number | null;
        width?: number | null;
        height?: number | null;
        volumetricWeight?: number | null;
      } | null;
    };
  }>
): number {
  return items.reduce((total, item) => {
    const { product, quantity } = item;
    
    // Tính volumetric weight nếu có kích thước
    const volumetricWeight = product.productSpecs
      ? calculateVolumetricWeight(
          product.productSpecs.length,
          product.productSpecs.width,
          product.productSpecs.height
        )
      : (product.productSpecs as any)?.volumetricWeight || 0;

    // Lấy shipping weight cho 1 sản phẩm
    const itemWeight = getShippingWeight(
      product.weight,
      volumetricWeight
    );

    // Nhân với số lượng
    return total + itemWeight * quantity;
  }, 0);
}

