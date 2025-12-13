'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
}

interface SelectedItem {
  id: string;
  type: 'page' | 'category' | 'product' | 'post' | 'custom';
  title: string;
  url?: string;
  referenceId?: string;
}

interface PostsTabProps {
  selectedItems: SelectedItem[];
  onItemSelect: (item: SelectedItem) => void;
  onItemDeselect: (itemId: string, type: SelectedItem['type']) => void;
}

export function PostsTab({
  selectedItems,
  onItemSelect,
  onItemDeselect,
}: PostsTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [page, search]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20',
        status: 'publish',
      });
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/posts?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      const newPosts = (data.posts || []).map((p: any) => ({
        id: p._id || p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || p.content?.substring(0, 100),
      }));

      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasMore(data.pagination?.hasNextPage || false);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    if (!search) return posts;
    return posts.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
    );
  }, [posts, search]);

  const isSelected = (postId: string) => {
    return selectedItems.some((item) => item.id === postId && item.type === 'post');
  };

  const handleToggle = (post: Post) => {
    if (isSelected(post.id)) {
      onItemDeselect(post.id, 'post');
    } else {
      onItemSelect({
        id: post.id,
        type: 'post',
        title: post.title,
        referenceId: post.id,
      });
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm bài viết..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {/* Posts List */}
      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          title="Không tìm thấy bài viết nào"
          description={search ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có bài viết nào'}
          icon="📝"
        />
      ) : (
        <>
          <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
            {filteredPosts.map((post) => {
              const checked = isSelected(post.id);
              return (
                <div
                  key={post.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors min-h-[44px]"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => handleToggle(post)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{post.title}</div>
                    {post.excerpt && (
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {post.excerpt}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground truncate">
                      /{post.slug}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  'Tải thêm'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

