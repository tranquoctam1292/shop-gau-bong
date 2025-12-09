'use client';

// Note: Blog posts still use GraphQL. This hook is temporarily disabled.
// TODO: Migrate to WordPress REST API if blog feature is needed.

interface UsePostsOptions {
  first?: number;
  categoryId?: string;
  tagId?: string;
  search?: string;
}

export function usePosts(options: UsePostsOptions = {}) {
  // Return empty state to prevent build errors
  return {
    posts: [],
    loading: false,
    error: null,
    hasNextPage: false,
    loadMore: () => {},
  };
}
