/**
 * Validation utilities for forms
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Vietnamese phone number
 * Format: 10-11 digits, starting with 0
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^0[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validate Vietnamese postcode
 * Format: 5-6 digits
 */
export function validatePostcode(postcode: string): boolean {
  const postcodeRegex = /^[0-9]{5,6}$/;
  return postcodeRegex.test(postcode);
}

/**
 * Validate required field
 */
export function validateRequired(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.trim().length > 0;
}

/**
 * Validate shipping address
 */
export interface ShippingAddressValidation {
  province: boolean;
  district: boolean;
  ward?: boolean;
  address: boolean;
}

export function validateShippingAddress(address: {
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
}): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!validateRequired(address.province)) {
    errors.push({
      field: 'province',
      message: 'Vui lòng nhập tỉnh/thành phố',
    });
  }

  if (!validateRequired(address.district)) {
    errors.push({
      field: 'district',
      message: 'Vui lòng nhập quận/huyện',
    });
  }

  if (!validateRequired(address.address)) {
    errors.push({
      field: 'address',
      message: 'Vui lòng nhập địa chỉ chi tiết',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate checkout form data
 */
export function validateCheckoutForm(formData: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  billingAddress1?: string;
  billingProvince?: string;
  billingDistrict?: string;
  billingWard?: string;
  billingCity?: string;
  billingPostcode?: string;
  shippingCity?: string;
  shippingAddress1?: string;
}): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Customer info
  if (!validateRequired(formData.firstName)) {
    errors.push({ field: 'firstName', message: 'Vui lòng nhập họ' });
  }

  if (!validateRequired(formData.lastName)) {
    errors.push({ field: 'lastName', message: 'Vui lòng nhập tên' });
  }

  if (!validateRequired(formData.email)) {
    errors.push({ field: 'email', message: 'Vui lòng nhập email' });
  } else if (formData.email && !validateEmail(formData.email)) {
    errors.push({ field: 'email', message: 'Email không hợp lệ' });
  }

  if (!validateRequired(formData.phone)) {
    errors.push({ field: 'phone', message: 'Vui lòng nhập số điện thoại' });
  } else if (formData.phone && !validatePhone(formData.phone)) {
    errors.push({ field: 'phone', message: 'Số điện thoại không hợp lệ (10-11 chữ số, bắt đầu bằng 0)' });
  }

  // Billing address
  if (!validateRequired(formData.billingAddress1)) {
    errors.push({ field: 'billingAddress1', message: 'Vui lòng nhập địa chỉ' });
  }

  // Validate province (preferred) or city (fallback)
  if (!validateRequired(formData.billingProvince) && !validateRequired(formData.billingCity)) {
    errors.push({ field: 'billingProvince', message: 'Vui lòng chọn Tỉnh/Thành' });
  }

  // Validate district if province is selected
  if (formData.billingProvince && !validateRequired(formData.billingDistrict)) {
    errors.push({ field: 'billingDistrict', message: 'Vui lòng chọn Quận/Huyện' });
  }

  // Validate ward if district is selected
  if (formData.billingDistrict && !validateRequired(formData.billingWard)) {
    errors.push({ field: 'billingWard', message: 'Vui lòng chọn Phường/Xã' });
  }

  if (!validateRequired(formData.billingPostcode)) {
    errors.push({ field: 'billingPostcode', message: 'Vui lòng nhập mã bưu điện' });
  } else if (formData.billingPostcode && !validatePostcode(formData.billingPostcode)) {
    errors.push({ field: 'billingPostcode', message: 'Mã bưu điện không hợp lệ (5-6 chữ số)' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

