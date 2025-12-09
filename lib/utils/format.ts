/**
 * Format giá tiền theo định dạng Việt Nam
 * @param price - Giá tiền (string hoặc number)
 * @returns Chuỗi giá đã format (ví dụ: "500.000₫")
 */
export function formatPrice(price: string | number | null | undefined): string {
  // Error handling: Nếu price null/undefined, trả về "Liên hệ" theo .cursorrules
  if (!price || price === '0' || price === 0) {
    return 'Liên hệ';
  }

  let numPrice: number;
  
  if (typeof price === 'string') {
    // Xử lý string: có thể có dấu chấm, dấu phẩy, hoặc ký tự đặc biệt
    // Loại bỏ tất cả ký tự không phải số (trừ dấu chấm và dấu phẩy)
    const cleaned = price.replace(/[^\d.,]/g, '');
    // Thay dấu phẩy bằng dấu chấm (nếu có)
    const normalized = cleaned.replace(',', '.');
    numPrice = parseFloat(normalized);
  } else {
    numPrice = price;
  }
  
  if (isNaN(numPrice) || numPrice <= 0) {
    return 'Liên hệ';
  }

  // Format price from WooCommerce REST API
  // WooCommerce stores price as string in VND (e.g., "500000" = 500,000₫)
  // No conversion needed - REST API returns price as-is
  if (numPrice < 1000 && numPrice > 0) {
    // Có thể giá đã bị chia cho 1000, nhân lại
    numPrice = numPrice * 1000;
  }

  // Format với dấu chấm phân cách hàng nghìn và ký hiệu ₫
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

/**
 * Format số với dấu chấm phân cách hàng nghìn
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('vi-VN').format(num);
}

