'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaUploader } from '@/components/admin/media/MediaUploader';
import { MediaFilterBar, type MediaFilters } from '@/components/admin/media/MediaFilterBar';
import { MediaGrid, type MediaGridItem } from '@/components/admin/media/MediaGrid';
import { MediaList } from '@/components/admin/media/MediaList';
import { MediaDetailSidebar } from '@/components/admin/media/MediaDetailSidebar';
import { useMediaList, useUpdateMedia, useDeleteMedia } from '@/lib/hooks/useMedia';
import { Trash2, Grid3x3, List } from 'lucide-react';
import type { MediaType, MediaSort } from '@/types/media';
import { useToastContext } from '@/components/providers/ToastProvider';

export default function MediaLibraryPage() {
  const { showToast } = useToastContext();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<MediaFilters>({
    sort: 'newest',
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaGridItem | null>(null);
  const [page, setPage] = useState(1);

  // Use React Query hook for data fetching
  const { data: mediaItems = [], pagination, isLoading: loading, refetch } = useMediaList({
    page,
    limit: 20,
    type: filters.type,
    search: filters.search,
    sort: filters.sort || 'newest',
    folder: filters.folder,
  });

  const updateMediaMutation = useUpdateMedia();
  const deleteMediaMutation = useDeleteMedia();

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => [...prev, id]);
  };

  const handleDeselect = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleItemClick = (item: MediaGridItem) => {
    setSelectedItem(item);
  };

  const handleUpdate = async (
    id: string,
    updates: {
      name?: string;
      altText?: string;
      caption?: string;
      description?: string;
    }
  ) => {
    try {
      const result = await updateMediaMutation.mutateAsync({ id, updates });
      if (selectedItem?._id === id) {
        setSelectedItem(result.data);
      }
      showToast('Đã cập nhật thông tin media thành công', 'success');
    } catch (error) {
      console.error('Error updating media:', error);
      showToast('Có lỗi xảy ra khi cập nhật thông tin media', 'error');
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMediaMutation.mutateAsync(id);
      if (selectedItem?._id === id) {
        setSelectedItem(null);
      }
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      showToast('Đã xóa media thành công', 'success');
    } catch (error) {
      console.error('Error deleting media:', error);
      showToast('Có lỗi xảy ra khi xóa media', 'error');
      throw error;
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa ${selectedIds.length} media đã chọn?`
    );

    if (!confirmed) return;

    try {
      await Promise.all(selectedIds.map((id) => deleteMediaMutation.mutateAsync(id)));
      setSelectedIds([]);
      if (selectedItem && selectedIds.includes(selectedItem._id)) {
        setSelectedItem(null);
      }
      showToast(`Đã xóa ${selectedIds.length} media thành công`, 'success');
    } catch (error) {
      console.error('Error bulk deleting media:', error);
      showToast('Có lỗi xảy ra khi xóa media', 'error');
    }
  };

  const handleUploadComplete = () => {
    refetch();
    // Toast đã được hiển thị trong MediaUploader component
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Thư viện Media</h1>
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa ({selectedIds.length})
                </Button>
              )}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <MediaFilterBar
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs defaultValue="library" className="w-full">
            <TabsList>
              <TabsTrigger value="library">Thư viện</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="mt-4">
              {viewMode === 'grid' ? (
                <MediaGrid
                  items={mediaItems}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                  onItemClick={handleItemClick}
                  loading={loading}
                  multiple={true}
                />
              ) : (
                <MediaList
                  items={mediaItems}
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onDeselect={handleDeselect}
                  onItemClick={handleItemClick}
                  loading={loading}
                  multiple={true}
                />
              )}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev || loading}
                  >
                    Trước
                  </Button>
                  <span className="text-sm text-gray-600">
                    Trang {pagination.page} / {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={!pagination.hasNext || loading}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <MediaUploader
                onUploadComplete={handleUploadComplete}
                maxFiles={10}
                maxSize={5 * 1024 * 1024}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Detail Sidebar */}
      {selectedItem && (
        <MediaDetailSidebar
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
