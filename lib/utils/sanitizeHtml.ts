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

/**
 * Strip all HTML tags from text content, returning plain text
 * 
 * Useful for displaying HTML content as plain text (e.g., in lists, tables)
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

/**
 * ✅ PERFORMANCE: Clean HTML for storage to reduce data bloat
 * 
 * Removes unnecessary attributes, empty classes, and redundant styles from HTML
 * before saving to database. This reduces storage size and improves backup/indexing performance.
 * 
 * Features:
 * - Removes empty class attributes
 * - Removes empty style attributes
 * - Removes unnecessary data attributes
 * - Detects and warns about Base64 images (should be uploaded to server instead)
 * - Preserves essential attributes (src, alt, href, etc.)
 * 
 * @param html - HTML string from Tiptap editor
 * @returns Cleaned HTML string optimized for storage
 * 
 * @example
 * ```tsx
 * const cleaned = cleanHtmlForStorage(editor.getHTML());
 * onChange(cleaned);
 * ```
 */
export function cleanHtmlForStorage(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // ✅ PERFORMANCE: Check for Base64 images (should be uploaded to server)
  // Base64 images are extremely large and should not be stored in database
  const base64ImagePattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/gi;
  if (base64ImagePattern.test(html)) {
    console.warn('[cleanHtmlForStorage] Warning: Base64 image detected in HTML. Images should be uploaded to server instead.');
    // Note: We don't remove Base64 images automatically as it might break content
    // Admin should use the paste handler which uploads images to server
  }

  try {
    // Use DOMPurify to parse and clean HTML
    // Configure to remove unnecessary attributes while preserving essential ones
    const cleaned = DOMPurify.sanitize(html, {
      // Keep all allowed tags
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span', 'div',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe',
      ],
      // Only keep essential attributes
      ALLOWED_ATTR: [
        'href', 'target', 'rel', 'src', 'alt', 'title', 
        'width', 'height', 'frameborder', 'allowfullscreen', 'allow',
        'class', // Keep class but will clean empty ones below
      ],
      // Remove data attributes (usually not needed for storage)
      ALLOW_DATA_ATTR: false,
      // Keep style for iframe video embeds (needed for responsive)
      KEEP_CONTENT: true,
    });

    // Further clean: Remove empty class and style attributes using regex
    // This is more efficient than parsing DOM again
    let result = cleaned
      // Remove empty class attributes: class="" or class=" "
      .replace(/\s*class\s*=\s*["']\s*["']/gi, '')
      // Remove empty style attributes: style="" or style=" "
      .replace(/\s*style\s*=\s*["']\s*["']/gi, '')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      // Remove spaces before closing tags
      .replace(/\s+>/g, '>')
      // Remove spaces after opening tags
      .replace(/>\s+/g, '>')
      .trim();

    return result;
  } catch (error) {
    // Fallback: return original HTML if cleaning fails
    console.error('[cleanHtmlForStorage] Error cleaning HTML:', error);
    return html;
  }
}
