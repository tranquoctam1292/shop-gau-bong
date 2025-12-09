/**
 * Validate product dimensions for shipping calculation
 * Theo .cursorrules: length, width, height là bắt buộc cho tính phí vận chuyển
 */

export interface DimensionValidationResult {
  isValid: boolean;
  missingFields: string[];
  warningMessage: string | null;
}

/**
 * Validate product dimensions (length, width, height)
 * @param length - Chiều dài (cm)
 * @param width - Chiều rộng (cm)
 * @param height - Chiều cao (cm)
 * @returns Validation result với missing fields và warning message
 */
export function validateProductDimensions(
  length?: number | null,
  width?: number | null,
  height?: number | null
): DimensionValidationResult {
  const missingFields: string[] = [];

  // Check từng field
  if (!length || Number(length) <= 0) {
    missingFields.push('chiều dài');
  }
  if (!width || Number(width) <= 0) {
    missingFields.push('chiều rộng');
  }
  if (!height || Number(height) <= 0) {
    missingFields.push('chiều cao');
  }

  // Tạo warning message nếu có missing fields
  let warningMessage: string | null = null;
  if (missingFields.length > 0) {
    const fieldsText = missingFields.join(', ');
    warningMessage = `⚠️ Sản phẩm thiếu thông tin kích thước (${fieldsText}). Phí vận chuyển có thể không chính xác. Vui lòng liên hệ shop để được tư vấn.`;
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warningMessage,
  };
}


