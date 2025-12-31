/**
 * SEO Audit Utility Tests
 *
 * Tests for runSEOAudit, getScoreCategory, getIssueCodes, batchAuditProducts
 */

import { runSEOAudit, getScoreCategory, getIssueCodes, batchAuditProducts } from '../seoAudit';
import { SEO_ISSUE_CODES, SEO_SCORE_THRESHOLDS } from '@/types/seo';

describe('seoAudit', () => {
  describe('runSEOAudit', () => {
    it('should return 0 score for empty product', () => {
      const result = runSEOAudit({
        name: '',
      });

      expect(result.score).toBe(0);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.passed.length).toBe(0);
    });

    it('should give full score for fully optimized product', () => {
      const result = runSEOAudit({
        name: 'Gấu bông teddy bear cao cấp siêu mềm mại',
        slug: 'gau-bong-teddy-bear-cao-cap',
        description: 'Mô tả chi tiết sản phẩm gấu bông teddy bear cao cấp',
        shortDescription: 'Gấu bông teddy bear cao cấp, chất liệu mềm mại',
        price: 299000,
        images: ['https://example.com/image.jpg'],
        seo: {
          focusKeyword: 'gấu bông teddy',
          seoTitle: 'Mua Gấu Bông Teddy Bear Cao Cấp - Giá Tốt Nhất',
          seoDescription: 'Gấu bông teddy bear cao cấp với chất liệu bông mềm mại, an toàn cho bé. Đa dạng kích thước từ 40cm đến 1m2. Giao hàng toàn quốc, đổi trả 7 ngày.',
          slug: 'gau-bong-teddy-bear-cao-cap',
          canonicalUrl: 'https://shop-gau-bong.com/products/gau-bong-teddy-bear-cao-cap',
          ogImage: 'https://example.com/og-image.jpg',
        },
      });

      expect(result.score).toBe(100);
      expect(result.issues.length).toBe(0);
      expect(result.passed.length).toBeGreaterThan(0);
    });

    it('should detect missing SEO title', () => {
      const result = runSEOAudit({
        name: '',
        price: 100000,
        images: ['img.jpg'],
      });

      const titleIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.MISSING_TITLE
      );
      expect(titleIssue).toBeDefined();
      expect(titleIssue?.type).toBe('error');
    });

    it('should detect missing SEO description', () => {
      const result = runSEOAudit({
        name: 'Test Product',
        price: 100000,
        images: ['img.jpg'],
      });

      const descIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.MISSING_SEO_DESCRIPTION
      );
      expect(descIssue).toBeDefined();
      expect(descIssue?.type).toBe('error');
    });

    it('should detect missing images', () => {
      const result = runSEOAudit({
        name: 'Test Product',
        price: 100000,
        images: [],
      });

      const imageIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.MISSING_IMAGE
      );
      expect(imageIssue).toBeDefined();
    });

    it('should detect missing price', () => {
      const result = runSEOAudit({
        name: 'Test Product',
        images: ['img.jpg'],
      });

      const priceIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.MISSING_PRICE
      );
      expect(priceIssue).toBeDefined();
    });

    it('should detect short title', () => {
      const result = runSEOAudit({
        name: 'Short',
        seo: {
          seoTitle: 'Short',
        },
      });

      const shortTitleIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.SHORT_TITLE
      );
      expect(shortTitleIssue).toBeDefined();
    });

    it('should detect long title', () => {
      const result = runSEOAudit({
        name: 'A'.repeat(70),
        seo: {
          seoTitle: 'A'.repeat(70),
        },
      });

      const longTitleIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.LONG_TITLE
      );
      expect(longTitleIssue).toBeDefined();
    });

    it('should detect short description', () => {
      const result = runSEOAudit({
        name: 'Test Product',
        seo: {
          seoDescription: 'Short desc',
        },
      });

      const shortDescIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.SHORT_DESCRIPTION
      );
      expect(shortDescIssue).toBeDefined();
    });

    it('should detect long description', () => {
      const result = runSEOAudit({
        name: 'Test Product',
        seo: {
          seoDescription: 'A'.repeat(170),
        },
      });

      const longDescIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.LONG_DESCRIPTION
      );
      expect(longDescIssue).toBeDefined();
    });

    it('should detect missing focus keyword', () => {
      const result = runSEOAudit({
        name: 'Test Product',
      });

      const keywordIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.NO_FOCUS_KEYWORD
      );
      expect(keywordIssue).toBeDefined();
    });

    it('should detect keyword not in title', () => {
      const result = runSEOAudit({
        name: 'Test Product',
        seo: {
          focusKeyword: 'gấu bông',
          seoTitle: 'Test Product Title Without Keyword',
        },
      });

      const keywordIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.KEYWORD_NOT_IN_TITLE
      );
      expect(keywordIssue).toBeDefined();
    });

    it('should detect keyword not in description', () => {
      const result = runSEOAudit({
        name: 'Test Product',
        seo: {
          focusKeyword: 'gấu bông',
          seoDescription: 'This is a description without the keyword we are looking for in this test case.',
        },
      });

      const keywordIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.KEYWORD_NOT_IN_DESCRIPTION
      );
      expect(keywordIssue).toBeDefined();
    });

    it('should pass when keyword is in title', () => {
      const result = runSEOAudit({
        name: 'Gấu bông teddy bear',
        seo: {
          focusKeyword: 'gấu bông',
          seoTitle: 'Mua Gấu Bông Teddy Bear - Giá Tốt Nhất Việt Nam',
        },
      });

      const keywordCheck = result.passed.find((p) => p.code === 'KEYWORD_IN_TITLE');
      expect(keywordCheck).toBeDefined();
    });

    it('should detect missing canonical URL', () => {
      const result = runSEOAudit({
        name: 'Test Product',
      });

      const canonicalIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.MISSING_CANONICAL
      );
      expect(canonicalIssue).toBeDefined();
      expect(canonicalIssue?.type).toBe('info');
    });

    it('should detect missing OG image', () => {
      const result = runSEOAudit({
        name: 'Test Product',
      });

      const ogIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.MISSING_OG_IMAGE
      );
      expect(ogIssue).toBeDefined();
      expect(ogIssue?.type).toBe('info');
    });

    it('should detect long slug', () => {
      const result = runSEOAudit({
        name: 'Test Product',
        slug: 'a'.repeat(70),
      });

      const slugIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.LONG_SLUG
      );
      expect(slugIssue).toBeDefined();
    });

    it('should detect missing short description', () => {
      const result = runSEOAudit({
        name: 'Test Product',
      });

      const shortDescIssue = result.issues.find(
        (i) => i.code === SEO_ISSUE_CODES.MISSING_SHORT_DESCRIPTION
      );
      expect(shortDescIssue).toBeDefined();
    });

    it('should sort issues by severity (errors first)', () => {
      const result = runSEOAudit({
        name: '', // error: missing title
        seo: {
          seoDescription: 'Short', // warning: short description
        },
      });

      const errorIndex = result.issues.findIndex((i) => i.type === 'error');
      const warningIndex = result.issues.findIndex((i) => i.type === 'warning');

      if (errorIndex !== -1 && warningIndex !== -1) {
        expect(errorIndex).toBeLessThan(warningIndex);
      }
    });

    it('should cap score at 100', () => {
      const result = runSEOAudit({
        name: 'Gấu bông teddy bear cao cấp siêu mềm mại',
        slug: 'gau-bong-teddy-bear-cao-cap',
        shortDescription: 'Gấu bông cao cấp',
        price: 299000,
        images: ['img.jpg'],
        seo: {
          focusKeyword: 'gấu bông',
          seoTitle: 'Mua Gấu Bông Teddy Bear Cao Cấp - Giá Tốt Nhất',
          seoDescription: 'Gấu bông teddy cao cấp với chất liệu bông mềm mại an toàn cho bé. Đa dạng kích thước từ 40cm. Giao toàn quốc đổi trả 7 ngày.',
          slug: 'gau-bong-teddy-bear-cao-cap',
          canonicalUrl: 'https://example.com/product',
          ogImage: 'https://example.com/og.jpg',
        },
      });

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should not go below 0', () => {
      const result = runSEOAudit({
        name: '',
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getScoreCategory', () => {
    it('should return "Xuất sắc" for score >= 90', () => {
      const category = getScoreCategory(95);
      expect(category.label).toBe('Xuất sắc');
      expect(category.color).toBe('text-green-700');
    });

    it('should return "Tốt" for score >= 70', () => {
      const category = getScoreCategory(75);
      expect(category.label).toBe('Tốt');
      expect(category.color).toBe('text-emerald-600');
    });

    it('should return "Cần cải thiện" for score >= 50', () => {
      const category = getScoreCategory(55);
      expect(category.label).toBe('Cần cải thiện');
      expect(category.color).toBe('text-yellow-600');
    });

    it('should return "Yếu" for score < 50', () => {
      const category = getScoreCategory(30);
      expect(category.label).toBe('Yếu');
      expect(category.color).toBe('text-red-600');
    });

    it('should handle boundary values correctly', () => {
      expect(getScoreCategory(SEO_SCORE_THRESHOLDS.EXCELLENT).label).toBe('Xuất sắc');
      expect(getScoreCategory(SEO_SCORE_THRESHOLDS.EXCELLENT - 1).label).toBe('Tốt');
      expect(getScoreCategory(SEO_SCORE_THRESHOLDS.GOOD).label).toBe('Tốt');
      expect(getScoreCategory(SEO_SCORE_THRESHOLDS.GOOD - 1).label).toBe('Cần cải thiện');
      expect(getScoreCategory(SEO_SCORE_THRESHOLDS.NEEDS_WORK).label).toBe('Cần cải thiện');
      expect(getScoreCategory(SEO_SCORE_THRESHOLDS.NEEDS_WORK - 1).label).toBe('Yếu');
    });
  });

  describe('getIssueCodes', () => {
    it('should return array of issue codes', () => {
      const result = runSEOAudit({
        name: '',
      });

      const codes = getIssueCodes(result);
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain(SEO_ISSUE_CODES.MISSING_TITLE);
    });

    it('should return empty array when no issues', () => {
      const result = runSEOAudit({
        name: 'Gấu bông teddy bear cao cấp siêu mềm mại',
        slug: 'gau-bong-teddy-bear-cao-cap',
        shortDescription: 'Gấu bông cao cấp',
        price: 299000,
        images: ['img.jpg'],
        seo: {
          focusKeyword: 'gấu bông',
          seoTitle: 'Mua Gấu Bông Teddy Bear Cao Cấp - Giá Tốt Nhất',
          seoDescription: 'Gấu bông teddy cao cấp với chất liệu bông mềm mại an toàn cho bé. Đa dạng kích thước từ 40cm. Giao toàn quốc đổi trả 7 ngày.',
          slug: 'gau-bong-teddy-bear-cao-cap',
          canonicalUrl: 'https://example.com/product',
          ogImage: 'https://example.com/og.jpg',
        },
      });

      const codes = getIssueCodes(result);
      expect(codes.length).toBe(0);
    });
  });

  describe('batchAuditProducts', () => {
    it('should audit multiple products', () => {
      const products = [
        { name: 'Product 1', price: 100000, images: ['img1.jpg'] },
        { name: 'Product 2', price: 200000, images: ['img2.jpg'] },
        { name: 'Product 3', price: 300000, images: ['img3.jpg'] },
      ];

      const results = batchAuditProducts(products);

      expect(results.length).toBe(3);
      results.forEach((item) => {
        expect(item.result).toBeDefined();
        expect(typeof item.result.score).toBe('number');
        expect(Array.isArray(item.result.issues)).toBe(true);
        expect(Array.isArray(item.result.passed)).toBe(true);
      });
    });

    it('should handle empty array', () => {
      const results = batchAuditProducts([]);
      expect(results.length).toBe(0);
    });

    it('should include productId when available', () => {
      const products = [
        { _id: { toString: () => '123' }, name: 'Product 1' },
      ];

      const results = batchAuditProducts(products as any);

      expect(results[0].productId).toBe('123');
    });
  });
});
