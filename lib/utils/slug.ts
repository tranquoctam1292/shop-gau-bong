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

/**
 * Generate a random short ID (4-6 characters)
 * Used as suffix for duplicate slugs
 * 
 * @returns Random alphanumeric string
 */
export function generateShortId(): string {
  // Generate 4-6 character random string using alphanumeric
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 4 + Math.floor(Math.random() * 3); // 4-6 chars
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate unique slug with duplicate check
 * If slug exists, appends random short ID suffix
 * 
 * @param baseSlug - Base slug to check
 * @param checkExists - Function to check if slug exists (returns Promise<boolean>)
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  if (!baseSlug) {
    return '';
  }

  // Check if base slug is available
  const exists = await checkExists(baseSlug);
  if (!exists) {
    return baseSlug;
  }

  // Generate unique slug with random suffix
  let attempts = 0;
  const maxAttempts = 10; // Prevent infinite loop
  
  while (attempts < maxAttempts) {
    const suffix = generateShortId();
    const uniqueSlug = `${baseSlug}-${suffix}`;
    
    const slugExists = await checkExists(uniqueSlug);
    if (!slugExists) {
      return uniqueSlug;
    }
    
    attempts++;
  }

  // Fallback: use timestamp if all attempts failed
  return `${baseSlug}-${Date.now().toString(36)}`;
}
