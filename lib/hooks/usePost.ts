'use client';

// Note: Blog posts still use GraphQL. This hook is temporarily disabled.
// TODO: Migrate to WordPress REST API if blog feature is needed.

export function usePost(slug: string) {
  // Return empty state to prevent build errors
  return {
    post: null,
    loading: false,
    error: new Error('Blog feature is temporarily disabled. Please migrate to REST API if needed.'),
  };
}
