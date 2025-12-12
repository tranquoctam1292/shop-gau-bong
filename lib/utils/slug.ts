/**
 * Slug Generation Utility
 * 
 * Converts Vietnamese text to URL-friendly slugs
 * Handles all Vietnamese characters including đ/Đ
 */

/**
 * Generate slug from Vietnamese text
 * 
 * @param text - Vietnamese text to convert
 * @returns URL-friendly slug
 * 
 * @example
 * generateSlug("Màu đỏ") // "mau-do"
 * generateSlug("Độ dài") // "do-dai"
 * generateSlug("Kích thước") // "kich-thuoc"
 * generateSlug("Đậu phộng") // "dau-phong"
 */
export function generateSlug(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    // Handle đ/Đ BEFORE normalize (đ/Đ are not decomposed by NFD)
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .normalize('NFD') // Decompose characters (é → e + ́, ả → a + ̉)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (dấu)
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate if a string is a valid slug
 * 
 * @param slug - Slug to validate
 * @returns true if valid slug format
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }
  
  // Slug should only contain lowercase letters, numbers, and hyphens
  // Should not start or end with hyphen
  // Should not have consecutive hyphens
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
