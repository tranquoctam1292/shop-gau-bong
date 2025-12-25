/**
 * SKU Validation Hook
 * 
 * PHASE 2: SKU Real-time Validation (7.8.2)
 * 
 * Provides debounced SKU validation với visual feedback
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface SkuValidationResult {
  isValidating: boolean;
  isValid: boolean | null; // null = not validated yet, true = valid, false = invalid
  error: string | null;
}

interface UseSkuValidationOptions {
  sku: string;
  productId?: string; // Current product ID (for edit mode, to exclude from uniqueness check)
  debounceMs?: number; // Debounce delay in milliseconds
  enabled?: boolean; // Whether to enable validation
}

export function useSkuValidation({
  sku,
  productId,
  debounceMs = 500,
  enabled = true,
}: UseSkuValidationOptions): SkuValidationResult {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateSku = useCallback(async (skuValue: string) => {
    // Skip validation if empty or disabled
    if (!skuValue.trim() || !enabled) {
      setIsValid(null);
      setError(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Build query string
      const params = new URLSearchParams({
        sku: skuValue.trim(),
      });
      if (productId) {
        params.append('excludeId', productId);
      }

      const response = await fetch(`/api/admin/products/validate-sku?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        // Handle error response
        const errorData = await response.json().catch(() => ({}));
        setIsValid(false);
        setError(errorData.error || 'Không thể kiểm tra SKU');
        return;
      }

      const data = await response.json();

      if (data.available) {
        setIsValid(true);
        setError(null);
      } else {
        setIsValid(false);
        setError(data.error || 'SKU đã tồn tại trong hệ thống');
      }
    } catch (err) {
      // Network error or other error - don't show error, just mark as unknown
      console.error('[useSkuValidation] Error:', err);
      setIsValid(null);
      setError(null);
    } finally {
      setIsValidating(false);
    }
  }, [productId, enabled]);

  useEffect(() => {
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateSku(sku);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [sku, validateSku, debounceMs]);

  return {
    isValidating,
    isValid,
    error,
  };
}

