/**
 * Escape special regex characters to prevent ReDoS attacks
 * 
 * This function escapes all special regex characters in a string
 * so it can be safely used in MongoDB $regex queries.
 * 
 * @param str - String to escape
 * @returns Escaped string safe for regex use
 * 
 * @example
 * escapeRegExp("test[123]") // "test\\[123\\]"
 * escapeRegExp("price $100") // "price \\$100"
 */
export function escapeRegExp(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  
  // Escape all regex special characters: . * + ? ^ $ { } ( ) | [ ] \
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

