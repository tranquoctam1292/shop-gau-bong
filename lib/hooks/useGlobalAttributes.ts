/**
 * Hook để fetch global attributes và terms từ CMS API
 * 
 * Sử dụng React Query để cache và optimize performance
 */

import { useQuery } from '@tanstack/react-query';

export interface GlobalAttribute {
  id: string;
  name: string;
  slug: string;
  type: 'text' | 'color' | 'image' | 'button';
  sortOrder: 'name' | 'number' | 'id';
}

export interface GlobalTerm {
  id: string;
  name: string;
  slug: string;
  description?: string;
  colorHex?: string;
  colorHex2?: string;
  imageUrl?: string;
  imageId?: string;
  sortOrder?: number;
}

interface AttributeWithTerms {
  attribute: GlobalAttribute;
  terms: GlobalTerm[];
}

/**
 * Fetch all global attributes
 */
export function useGlobalAttributes() {
  return useQuery({
    queryKey: ['global-attributes'],
    queryFn: async (): Promise<GlobalAttribute[]> => {
      const response = await fetch('/api/cms/attributes');
      if (!response.ok) {
        throw new Error('Failed to fetch global attributes');
      }
      const data = await response.json();
      return data.attributes || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Fetch terms for a specific global attribute
 */
export function useGlobalAttributeTerms(attributeId: string | null | undefined) {
  return useQuery({
    queryKey: ['global-attribute-terms', attributeId],
    queryFn: async (): Promise<AttributeWithTerms | null> => {
      if (!attributeId) return null;
      
      const response = await fetch(`/api/cms/attributes?attributeId=${attributeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attribute terms');
      }
      const data = await response.json();
      return {
        attribute: data.attribute,
        terms: data.terms || [],
      };
    },
    enabled: !!attributeId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Fetch multiple attributes with their terms
 */
export function useMultipleGlobalAttributeTerms(attributeIds: string[]) {
  return useQuery({
    queryKey: ['global-attribute-terms-multiple', attributeIds.sort().join(',')],
    queryFn: async (): Promise<AttributeWithTerms[]> => {
      const results = await Promise.all(
        attributeIds.map(async (id) => {
          const response = await fetch(`/api/cms/attributes?attributeId=${id}`);
          if (!response.ok) {
            return null;
          }
          const data = await response.json();
          return {
            attribute: data.attribute,
            terms: data.terms || [],
          };
        })
      );
      return results.filter((r): r is AttributeWithTerms => r !== null);
    },
    enabled: attributeIds.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}
