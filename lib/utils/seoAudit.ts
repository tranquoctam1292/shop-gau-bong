/**
 * SEO Audit Utility
 *
 * Scoring algorithm and audit logic for product SEO
 *
 * @see docs/plans/SEO_MODULE_PLAN.md for scoring weights
 */

import {
  SEO_WEIGHTS,
  SEO_SCORE_THRESHOLDS,
  SEO_ISSUE_CODES,
  type SEOAuditResult,
  type SEOIssue,
  type SEOCheck,
  type ProductSEOFields,
  type SEOIssueCode,
} from '@/types/seo';

/**
 * Product data needed for SEO audit
 */
interface ProductAuditData {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  images?: string[];
  seo?: ProductSEOFields;
}

/**
 * Optimal length ranges for SEO fields
 */
const LENGTH_LIMITS = {
  title: { min: 30, max: 60, optimal: 55 },
  description: { min: 120, max: 160, optimal: 155 },
  slug: { max: 60 },
} as const;

/**
 * Issue messages (Vietnamese)
 */
const ISSUE_MESSAGES: Record<SEOIssueCode, { message: string; suggestion?: string }> = {
  [SEO_ISSUE_CODES.MISSING_TITLE]: {
    message: 'Thiếu tiêu đề SEO',
    suggestion: 'Thêm tiêu đề SEO để hiển thị tốt hơn trên kết quả tìm kiếm',
  },
  [SEO_ISSUE_CODES.MISSING_SEO_DESCRIPTION]: {
    message: 'Thiếu mô tả SEO',
    suggestion: 'Thêm mô tả SEO 150-160 ký tự để thu hút người dùng click',
  },
  [SEO_ISSUE_CODES.MISSING_IMAGE]: {
    message: 'Sản phẩm chưa có hình ảnh',
    suggestion: 'Thêm ít nhất 1 hình ảnh cho sản phẩm',
  },
  [SEO_ISSUE_CODES.MISSING_PRICE]: {
    message: 'Sản phẩm chưa có giá',
    suggestion: 'Thêm giá sản phẩm để hiển thị trong kết quả tìm kiếm',
  },
  [SEO_ISSUE_CODES.SHORT_TITLE]: {
    message: `Tiêu đề SEO quá ngắn (< ${LENGTH_LIMITS.title.min} ký tự)`,
    suggestion: `Tiêu đề nên dài ${LENGTH_LIMITS.title.min}-${LENGTH_LIMITS.title.max} ký tự`,
  },
  [SEO_ISSUE_CODES.LONG_TITLE]: {
    message: `Tiêu đề SEO quá dài (> ${LENGTH_LIMITS.title.max} ký tự)`,
    suggestion: `Tiêu đề nên dài ${LENGTH_LIMITS.title.min}-${LENGTH_LIMITS.title.max} ký tự`,
  },
  [SEO_ISSUE_CODES.SHORT_DESCRIPTION]: {
    message: `Mô tả SEO quá ngắn (< ${LENGTH_LIMITS.description.min} ký tự)`,
    suggestion: `Mô tả nên dài ${LENGTH_LIMITS.description.min}-${LENGTH_LIMITS.description.max} ký tự`,
  },
  [SEO_ISSUE_CODES.LONG_DESCRIPTION]: {
    message: `Mô tả SEO quá dài (> ${LENGTH_LIMITS.description.max} ký tự)`,
    suggestion: `Mô tả nên dài ${LENGTH_LIMITS.description.min}-${LENGTH_LIMITS.description.max} ký tự`,
  },
  [SEO_ISSUE_CODES.NO_FOCUS_KEYWORD]: {
    message: 'Chưa có từ khóa chính (Focus Keyword)',
    suggestion: 'Thêm từ khóa chính để tối ưu SEO cho sản phẩm',
  },
  [SEO_ISSUE_CODES.KEYWORD_NOT_IN_TITLE]: {
    message: 'Từ khóa chính không có trong tiêu đề SEO',
    suggestion: 'Đưa từ khóa chính vào tiêu đề SEO để cải thiện ranking',
  },
  [SEO_ISSUE_CODES.KEYWORD_NOT_IN_DESCRIPTION]: {
    message: 'Từ khóa chính không có trong mô tả SEO',
    suggestion: 'Đưa từ khóa chính vào mô tả SEO một cách tự nhiên',
  },
  [SEO_ISSUE_CODES.MISSING_CANONICAL]: {
    message: 'Chưa có Canonical URL',
    suggestion: 'Thêm Canonical URL để tránh duplicate content',
  },
  [SEO_ISSUE_CODES.MISSING_OG_IMAGE]: {
    message: 'Chưa có hình Open Graph',
    suggestion: 'Thêm hình OG để hiển thị đẹp khi chia sẻ lên mạng xã hội',
  },
  [SEO_ISSUE_CODES.MISSING_SLUG]: {
    message: 'Sản phẩm chưa có slug',
    suggestion: 'Thêm slug URL thân thiện cho sản phẩm',
  },
  [SEO_ISSUE_CODES.LONG_SLUG]: {
    message: `Slug quá dài (> ${LENGTH_LIMITS.slug.max} ký tự)`,
    suggestion: `Rút ngắn slug xuống dưới ${LENGTH_LIMITS.slug.max} ký tự`,
  },
  [SEO_ISSUE_CODES.MISSING_SHORT_DESCRIPTION]: {
    message: 'Thiếu mô tả ngắn sản phẩm',
    suggestion: 'Thêm mô tả ngắn để tóm tắt sản phẩm',
  },
  // Additional issue codes
  [SEO_ISSUE_CODES.NO_IMAGES]: {
    message: 'Sản phẩm chưa có hình ảnh',
    suggestion: 'Thêm ít nhất 1 hình ảnh cho sản phẩm',
  },
  [SEO_ISSUE_CODES.NO_PRICE]: {
    message: 'Sản phẩm chưa có giá',
    suggestion: 'Thêm giá sản phẩm để hiển thị trong Schema',
  },
  [SEO_ISSUE_CODES.NO_KEYWORD_IN_TITLE]: {
    message: 'Từ khóa chưa xuất hiện trong tiêu đề',
    suggestion: 'Đưa từ khóa chính vào tiêu đề SEO',
  },
  [SEO_ISSUE_CODES.NO_KEYWORD_IN_DESCRIPTION]: {
    message: 'Từ khóa chưa xuất hiện trong mô tả',
    suggestion: 'Đưa từ khóa chính vào mô tả SEO',
  },
  [SEO_ISSUE_CODES.NO_KEYWORD_IN_SLUG]: {
    message: 'Từ khóa chưa xuất hiện trong URL slug',
    suggestion: 'Cân nhắc đưa từ khóa vào URL slug',
  },
  [SEO_ISSUE_CODES.SHORT_CONTENT]: {
    message: 'Nội dung quá ngắn (< 300 từ)',
    suggestion: 'Thêm nội dung mô tả chi tiết cho sản phẩm',
  },
  [SEO_ISSUE_CODES.LOW_KEYWORD_DENSITY]: {
    message: 'Mật độ từ khóa thấp (< 0.5%)',
    suggestion: 'Tăng tần suất sử dụng từ khóa trong mô tả',
  },
  [SEO_ISSUE_CODES.HIGH_KEYWORD_DENSITY]: {
    message: 'Mật độ từ khóa cao (> 2.5%)',
    suggestion: 'Giảm tần suất sử dụng từ khóa để tránh bị coi là spam',
  },
  [SEO_ISSUE_CODES.MISSING_IMAGE_ALT]: {
    message: 'Hình ảnh thiếu thuộc tính alt',
    suggestion: 'Thêm alt text cho hình ảnh để cải thiện SEO',
  },
  [SEO_ISSUE_CODES.NO_INTERNAL_LINKS]: {
    message: 'Chưa có liên kết nội bộ trong mô tả',
    suggestion: 'Thêm liên kết đến sản phẩm liên quan',
  },
};

/**
 * Create an issue object
 */
function createIssue(
  code: SEOIssueCode,
  type: SEOIssue['type'] = 'warning',
  field?: string
): SEOIssue {
  const { message, suggestion } = ISSUE_MESSAGES[code];
  return {
    type,
    code,
    message,
    field,
    suggestion,
  };
}

/**
 * Create a passed check object
 */
function createCheck(code: string, message: string): SEOCheck {
  return { code, message };
}

/**
 * Check if string contains keyword (case-insensitive)
 */
function containsKeyword(text: string | undefined, keyword: string | undefined): boolean {
  if (!text || !keyword) return false;
  return text.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * Get effective SEO title (seoTitle or product name)
 */
function getEffectiveTitle(product: ProductAuditData): string {
  return product.seo?.seoTitle || product.name || '';
}

/**
 * Get effective SEO description
 */
function getEffectiveDescription(product: ProductAuditData): string {
  return product.seo?.seoDescription || product.shortDescription || '';
}

/**
 * Run SEO audit on a product
 *
 * @param product - Product data to audit
 * @returns SEOAuditResult with score, issues, and passed checks
 */
export function runSEOAudit(product: ProductAuditData): SEOAuditResult {
  const issues: SEOIssue[] = [];
  const passed: SEOCheck[] = [];
  let score = 0;

  const seo = product.seo || {};
  const title = getEffectiveTitle(product);
  const description = getEffectiveDescription(product);
  const slug = seo.slug || product.slug || '';
  const focusKeyword = seo.focusKeyword;

  // ============================================
  // CRITICAL CHECKS (40 points)
  // ============================================

  // Has Title (10 points)
  if (title && title.trim().length > 0) {
    score += SEO_WEIGHTS.hasTitle;
    passed.push(createCheck('HAS_TITLE', 'Có tiêu đề SEO'));
  } else {
    issues.push(createIssue(SEO_ISSUE_CODES.MISSING_TITLE, 'error', 'seoTitle'));
  }

  // Has SEO Description (10 points)
  if (seo.seoDescription && seo.seoDescription.trim().length > 0) {
    score += SEO_WEIGHTS.hasSeoDescription;
    passed.push(createCheck('HAS_SEO_DESCRIPTION', 'Có mô tả SEO'));
  } else {
    issues.push(createIssue(SEO_ISSUE_CODES.MISSING_SEO_DESCRIPTION, 'error', 'seoDescription'));
  }

  // Has Image (10 points)
  if (product.images && product.images.length > 0) {
    score += SEO_WEIGHTS.hasImage;
    passed.push(createCheck('HAS_IMAGE', 'Có hình ảnh sản phẩm'));
  } else {
    issues.push(createIssue(SEO_ISSUE_CODES.MISSING_IMAGE, 'error', 'images'));
  }

  // Has Price (10 points)
  if (product.price && product.price > 0) {
    score += SEO_WEIGHTS.hasPrice;
    passed.push(createCheck('HAS_PRICE', 'Có giá sản phẩm'));
  } else {
    issues.push(createIssue(SEO_ISSUE_CODES.MISSING_PRICE, 'warning', 'price'));
  }

  // ============================================
  // IMPORTANT CHECKS (35 points)
  // ============================================

  // Title Length (8 points)
  if (title) {
    const titleLen = title.length;
    if (titleLen >= LENGTH_LIMITS.title.min && titleLen <= LENGTH_LIMITS.title.max) {
      score += SEO_WEIGHTS.titleLength;
      passed.push(createCheck('TITLE_LENGTH', `Độ dài tiêu đề tốt (${titleLen} ký tự)`));
    } else if (titleLen < LENGTH_LIMITS.title.min) {
      issues.push(createIssue(SEO_ISSUE_CODES.SHORT_TITLE, 'warning', 'seoTitle'));
    } else {
      issues.push(createIssue(SEO_ISSUE_CODES.LONG_TITLE, 'warning', 'seoTitle'));
    }
  }

  // Description Length (8 points)
  if (seo.seoDescription) {
    const descLen = seo.seoDescription.length;
    if (descLen >= LENGTH_LIMITS.description.min && descLen <= LENGTH_LIMITS.description.max) {
      score += SEO_WEIGHTS.descriptionLength;
      passed.push(createCheck('DESCRIPTION_LENGTH', `Độ dài mô tả tốt (${descLen} ký tự)`));
    } else if (descLen < LENGTH_LIMITS.description.min) {
      issues.push(createIssue(SEO_ISSUE_CODES.SHORT_DESCRIPTION, 'warning', 'seoDescription'));
    } else {
      issues.push(createIssue(SEO_ISSUE_CODES.LONG_DESCRIPTION, 'info', 'seoDescription'));
    }
  }

  // Has Focus Keyword (7 points)
  if (focusKeyword && focusKeyword.trim().length > 0) {
    score += SEO_WEIGHTS.hasFocusKeyword;
    passed.push(createCheck('HAS_FOCUS_KEYWORD', 'Có từ khóa chính'));

    // Keyword in Title (6 points)
    if (containsKeyword(title, focusKeyword)) {
      score += SEO_WEIGHTS.keywordInTitle;
      passed.push(createCheck('KEYWORD_IN_TITLE', 'Từ khóa có trong tiêu đề'));
    } else {
      issues.push(createIssue(SEO_ISSUE_CODES.KEYWORD_NOT_IN_TITLE, 'warning', 'seoTitle'));
    }

    // Keyword in Description (6 points)
    if (containsKeyword(description, focusKeyword)) {
      score += SEO_WEIGHTS.keywordInDescription;
      passed.push(createCheck('KEYWORD_IN_DESCRIPTION', 'Từ khóa có trong mô tả'));
    } else {
      issues.push(createIssue(SEO_ISSUE_CODES.KEYWORD_NOT_IN_DESCRIPTION, 'warning', 'seoDescription'));
    }
  } else {
    issues.push(createIssue(SEO_ISSUE_CODES.NO_FOCUS_KEYWORD, 'warning', 'focusKeyword'));
  }

  // ============================================
  // GOOD TO HAVE CHECKS (25 points)
  // ============================================

  // Has Canonical URL (5 points)
  if (seo.canonicalUrl && seo.canonicalUrl.trim().length > 0) {
    score += SEO_WEIGHTS.hasCanonical;
    passed.push(createCheck('HAS_CANONICAL', 'Có Canonical URL'));
  } else {
    issues.push(createIssue(SEO_ISSUE_CODES.MISSING_CANONICAL, 'info', 'canonicalUrl'));
  }

  // Has OG Image (5 points)
  if (seo.ogImage && seo.ogImage.trim().length > 0) {
    score += SEO_WEIGHTS.hasOgImage;
    passed.push(createCheck('HAS_OG_IMAGE', 'Có hình Open Graph'));
  } else {
    issues.push(createIssue(SEO_ISSUE_CODES.MISSING_OG_IMAGE, 'info', 'ogImage'));
  }

  // Has Slug (5 points)
  if (slug && slug.trim().length > 0) {
    score += SEO_WEIGHTS.hasSlug;
    passed.push(createCheck('HAS_SLUG', 'Có slug URL'));

    // Slug not too long (5 points)
    if (slug.length <= LENGTH_LIMITS.slug.max) {
      score += SEO_WEIGHTS.noLongSlug;
      passed.push(createCheck('SHORT_SLUG', 'Slug có độ dài phù hợp'));
    } else {
      issues.push(createIssue(SEO_ISSUE_CODES.LONG_SLUG, 'info', 'slug'));
    }
  } else {
    issues.push(createIssue(SEO_ISSUE_CODES.MISSING_SLUG, 'warning', 'slug'));
  }

  // Has Short Description (5 points)
  if (product.shortDescription && product.shortDescription.trim().length > 0) {
    score += SEO_WEIGHTS.hasShortDescription;
    passed.push(createCheck('HAS_SHORT_DESCRIPTION', 'Có mô tả ngắn'));
  } else {
    issues.push(createIssue(SEO_ISSUE_CODES.MISSING_SHORT_DESCRIPTION, 'info', 'shortDescription'));
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Sort issues by severity (errors first, then warnings, then info)
  issues.sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.type] - order[b.type];
  });

  return { score, issues, passed };
}

/**
 * Get score category/color based on score value
 */
export function getScoreCategory(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= SEO_SCORE_THRESHOLDS.EXCELLENT) {
    return { label: 'Xuất sắc', color: 'text-green-700', bgColor: 'bg-green-100' };
  }
  if (score >= SEO_SCORE_THRESHOLDS.GOOD) {
    return { label: 'Tốt', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  }
  if (score >= SEO_SCORE_THRESHOLDS.NEEDS_WORK) {
    return { label: 'Cần cải thiện', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
  }
  return { label: 'Yếu', color: 'text-red-600', bgColor: 'bg-red-50' };
}

/**
 * Get issue codes from audit result
 */
export function getIssueCodes(result: SEOAuditResult): string[] {
  return result.issues.map((issue) => issue.code);
}

/**
 * Calculate SEO score for multiple products
 */
export function batchAuditProducts(
  products: ProductAuditData[]
): Array<{ productId?: string; result: SEOAuditResult }> {
  return products.map((product) => ({
    productId: (product as { _id?: { toString: () => string } })._id?.toString(),
    result: runSEOAudit(product),
  }));
}
