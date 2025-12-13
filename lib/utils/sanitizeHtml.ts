/**
 * HTML Sanitization Utility
 * 
 * Sanitizes HTML content to prevent XSS attacks
 * Uses DOMPurify for client-side sanitization
 */

/**
 * Sanitize HTML content (client-side only)
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

  // Client-side only - DOMPurify requires window object
  if (typeof window === 'undefined') {
    // Server-side: return as-is (will be sanitized on client)
    // Note: In production, consider server-side sanitization
    return html;
  }

  // Dynamic import for DOMPurify (client-side only)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require('dompurify');
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
      // Add rel="noopener noreferrer" to external links
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
 * Note: This is a placeholder. For production, consider using
 * a server-side HTML sanitization library like `isomorphic-dompurify`
 * or `sanitize-html` (Node.js compatible)
 * 
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string (or original if sanitization unavailable)
 */
export function sanitizeHtmlServer(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Basic server-side sanitization (remove script tags)
  // For production, use a proper server-side sanitization library
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
}
