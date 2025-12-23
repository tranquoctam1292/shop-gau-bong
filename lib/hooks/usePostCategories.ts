'use client';

// Note: Blog posts still use GraphQL. This hook is temporarily disabled.
// TODO: Migrate to WordPress REST API if blog feature is needed.

export function usePostCategories() {
  // Return empty state to prevent build errors
  return {
    categories: [],
    loading: false,
    error: null,
  };
}
