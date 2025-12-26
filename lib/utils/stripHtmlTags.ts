/**
 * Strip HTML Tags Utility
 * 
 * Simple utility to remove HTML tags from text content
 * Does NOT use DOMPurify to avoid ES Module issues on Vercel
 * 
 * @param html - HTML string to strip tags from
 * @returns Plain text without HTML tags
 * 
 * @example
 * ```tsx
 * const plainText = stripHtmlTags(product.description);
 * <p>{plainText}</p>
 * ```
 */
export function stripHtmlTags(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Remove HTML tags using regex
  return html.replace(/<[^>]*>/g, '').trim();
}

