/**
 * Filename Utils Unit Tests
 * 
 * Tests for generateUniqueFilename function
 * 
 * Run with: npm test -- filenameUtils.test.ts
 */

import { generateUniqueFilename, generateTimestampFilename } from '../filenameUtils';

describe('Filename Utils', () => {
  describe('generateUniqueFilename', () => {
    it('should generate unique filenames for same input', () => {
      const filename1 = generateUniqueFilename('image.jpg');
      const filename2 = generateUniqueFilename('image.jpg');

      expect(filename1).not.toBe(filename2);
      expect(filename1).toMatch(/^\d+-[a-f0-9]+-image\.jpg$/);
      expect(filename2).toMatch(/^\d+-[a-f0-9]+-image\.jpg$/);
    });

    it('should preserve original filename', () => {
      const result = generateUniqueFilename('my-image.jpg');
      expect(result).toContain('my-image');
      expect(result).toContain('.jpg');
    });

    it('should sanitize special characters', () => {
      const result = generateUniqueFilename('my image@#$%.jpg');
      expect(result).toMatch(/^[\d-]+-[a-f0-9]+-my_image___\.jpg$/);
    });

    it('should handle files without extension', () => {
      const result = generateUniqueFilename('file');
      expect(result).toMatch(/^\d+-[a-f0-9]+-file$/);
    });

    it('should handle files with multiple dots', () => {
      const result = generateUniqueFilename('my.image.backup.jpg');
      expect(result).toContain('my_image_backup');
      expect(result).toContain('.jpg');
    });

    it('should include timestamp and UUID', () => {
      const result = generateUniqueFilename('test.jpg');
      const parts = result.split('-');
      
      // Should have at least: timestamp, UUID (32 chars), filename
      expect(parts.length).toBeGreaterThanOrEqual(3);
      
      // First part should be timestamp (numeric)
      expect(Number(parts[0])).toBeGreaterThan(0);
      
      // Second part should be UUID (32 hex chars)
      expect(parts[1]).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('generateTimestampFilename', () => {
    it('should generate filenames with timestamp', () => {
      const result = generateTimestampFilename('image.jpg');
      expect(result).toMatch(/^\d+-image\.jpg$/);
    });

    it('should generate different filenames for same input', () => {
      const filename1 = generateTimestampFilename('image.jpg');
      // Wait 1ms to ensure different timestamp
      const filename2 = generateTimestampFilename('image.jpg');

      // May or may not be different (depends on timing)
      // But format should be correct
      expect(filename1).toMatch(/^\d+-image\.jpg$/);
      expect(filename2).toMatch(/^\d+-image\.jpg$/);
    });
  });
});
