'use client';

// Note: Blog posts still use GraphQL. This hook is temporarily disabled.
// TODO: Migrate to WordPress REST API if blog feature is needed.

export function useRelatedPosts(postId: string, excludeId?: string) {
  // Return empty state to prevent build errors
  return {
    posts: [],
    loading: false,
    error: null,
  };
}
