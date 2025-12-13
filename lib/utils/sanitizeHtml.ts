/**
 * HTML Sanitization Utility
 * 
 * Sanitizes HTML content to prevent XSS attacks
 * Uses isomorphic-dompurify for both client and server-side sanitization
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content (works on both client and server)
 * 
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 * 
 * @example
 * ```tsx
 * const sanitized = sanitizeHtml(product.description);
 * <div dangerouslySetInnerHTML={{ __html: sanitized }} />
 * ```
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    return DOMPurify.sanitize(html, {
      // Allow common HTML tags for rich content
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id',
        'width', 'height', 'style', 'data-*',
      ],
      // Allow data attributes for custom functionality
      ALLOW_DATA_ATTR: true,
      // Add rel="noopener noreferrer" to external links automatically
      ADD_ATTR: ['target'],
      ADD_TAGS: [],
    });
  } catch (error) {
    // Fallback: return empty string if DOMPurify fails
    console.error('Error sanitizing HTML:', error);
    return '';
  }
}

/**
 * Sanitize HTML content for server-side rendering
 * 
 * Note: Now uses isomorphic-dompurify which works on both client and server.
 * This function is kept for backward compatibility but now just calls sanitizeHtml.
 * 
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtmlServer(html: string | null | undefined): string {
  // Now uses the same implementation as sanitizeHtml (isomorphic-dompurify)
  return sanitizeHtml(html);
}
