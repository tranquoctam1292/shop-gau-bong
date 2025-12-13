'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Page {
  id: string;
  title: string;
  slug: string;
  url: string;
}

interface SelectedItem {
  id: string;
  type: 'page' | 'category' | 'product' | 'post' | 'custom';
  title: string;
  url?: string;
  referenceId?: string;
}

interface PagesTabProps {
  selectedItems: SelectedItem[];
  onItemSelect: (item: SelectedItem) => void;
  onItemDeselect: (itemId: string, type: SelectedItem['type']) => void;
}

// Hardcoded pages for now (can be replaced with API call later)
const DEFAULT_PAGES: Page[] = [
  { id: 'home', title: 'Trang chủ', slug: '', url: '/' },
  { id: 'about', title: 'Về chúng tôi', slug: 'about', url: '/about' },
  { id: 'contact', title: 'Liên hệ', slug: 'contact', url: '/contact' },
  { id: 'blog', title: 'Blog', slug: 'blog', url: '/blog' },
  { id: 'products', title: 'Sản phẩm', slug: 'products', url: '/products' },
];

export function PagesTab({ selectedItems, onItemSelect, onItemDeselect }: PagesTabProps) {
  const [pages, setPages] = useState<Page[]>(DEFAULT_PAGES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // TODO: Fetch pages from API when pages collection is available
    // fetchPages();
  }, []);

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(search.toLowerCase()) ||
    page.slug.toLowerCase().includes(search.toLowerCase())
  );

  const isSelected = (pageId: string) => {
    return selectedItems.some((item) => item.id === pageId && item.type === 'page');
  };

  const handleToggle = (page: Page) => {
    if (isSelected(page.id)) {
      onItemDeselect(page.id, 'page');
    } else {
      onItemSelect({
        id: page.id,
        type: 'page',
        title: page.title,
        url: page.url,
        referenceId: page.id,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm trang..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Pages List */}
      {filteredPages.length === 0 ? (
        <EmptyState
          title="Không tìm thấy trang nào"
          description={search ? 'Thử tìm kiếm với từ khóa khác' : 'Chưa có trang nào'}
          icon="📄"
        />
      ) : (
        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
          {filteredPages.map((page) => {
            const checked = isSelected(page.id);
            return (
              <div
                key={page.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors min-h-[44px]"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleToggle(page)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{page.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {page.url}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

