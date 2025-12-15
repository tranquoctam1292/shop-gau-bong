'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Power,
  PowerOff,
  Pencil,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { SortableCategoryRow } from '@/components/admin/SortableCategoryRow';
import { QuickEditCategory } from '@/components/admin/QuickEditCategory';
import { AddSubCategoryModal } from '@/components/admin/AddSubCategoryModal';
import { useToastContext } from '@/components/providers/ToastProvider';
import type { MappedCategory } from '@/lib/utils/productMapper';

interface CategoryTreeNode extends MappedCategory {
  children?: CategoryTreeNode[];
  level?: number;
}

export default function AdminCategoriesPage() {
  const { showToast } = useToastContext();
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [flatCategories, setFlatCategories] = useState<MappedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [formKey, setFormKey] = useState(0); // Force re-render form after submit
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [addSubCategoryModal, setAddSubCategoryModal] = useState<{
    isOpen: boolean;
    parentId: string;
    parentName: string;
  }>({ isOpen: false, parentId: '', parentName: '' });

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCategories();
  }, [statusFilter, viewMode]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const type = viewMode === 'tree' ? 'tree' : 'flat';
      const response = await fetch(
        `/api/admin/categories?type=${type}&status=${statusFilter}`
      );
      const data = await response.json();

      if (viewMode === 'tree' && data.type === 'tree') {
        // Add level to tree nodes
        const addLevels = (nodes: CategoryTreeNode[], level = 0): CategoryTreeNode[] => {
          return nodes.map(node => ({
            ...node,
            level,
            children: node.children ? addLevels(node.children, level + 1) : undefined,
          }));
        };
        setCategories(addLevels(data.categories || []));
      } else {
        setFlatCategories(data.categories || []);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này? Các sản phẩm trong danh mục này sẽ được chuyển về "Chưa phân loại".')) {
      return;
    }

    try {
      // Extract ID from GraphQL format if needed
      let categoryId = id;
      if (id.startsWith('gid://shop-gau-bong/ProductCategory/')) {
        categoryId = id.replace('gid://shop-gau-bong/ProductCategory/', '');
      }
      
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Đã xóa danh mục thành công', 'success');
        fetchCategories();
      } else {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi xóa', 'error');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Có lỗi xảy ra khi xóa danh mục', 'error');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      // Extract ID from GraphQL format if needed
      let categoryId = id;
      if (id.startsWith('gid://shop-gau-bong/ProductCategory/')) {
        categoryId = id.replace('gid://shop-gau-bong/ProductCategory/', '');
      }
      
      const response = await fetch(`/api/admin/categories/${categoryId}/toggle-status`, {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        const newStatus = data.category?.status;
        showToast(`Đã ${newStatus === 'active' ? 'bật' : 'tắt'} danh mục`, 'success');
        fetchCategories();
      } else {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra', 'error');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast('Có lỗi xảy ra khi thay đổi trạng thái', 'error');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = viewMode === 'tree'
      ? getAllCategoryIds(categories)
      : flatCategories.map(cat => cat.id);
    
    if (selectedCategories.size === allIds.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(allIds));
    }
  };

  const getAllCategoryIds = (nodes: CategoryTreeNode[]): string[] => {
    const ids: string[] = [];
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children) {
        ids.push(...getAllCategoryIds(node.children));
      }
    });
    return ids;
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.size === 0) return;
    
    if (!confirm(`Bạn có chắc muốn xóa ${selectedCategories.size} danh mục đã chọn?`)) {
      return;
    }

    // Delete in parallel
    const promises = Array.from(selectedCategories).map(id => {
      // Extract ID from GraphQL format if needed
      let categoryId = id;
      if (id.startsWith('gid://shop-gau-bong/ProductCategory/')) {
        categoryId = id.replace('gid://shop-gau-bong/ProductCategory/', '');
      }
      return fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE' });
    });

    try {
      await Promise.all(promises);
      setSelectedCategories(new Set());
      showToast(`Đã xóa ${selectedCategories.size} danh mục thành công`, 'success');
      fetchCategories();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      showToast('Có lỗi xảy ra khi xóa danh mục', 'error');
    }
  };

  const handleBulkToggleStatus = async (newStatus: 'active' | 'inactive') => {
    if (selectedCategories.size === 0) return;

    // Toggle status for each selected category
    const promises = Array.from(selectedCategories).map(async (id) => {
      // Extract ID from GraphQL format if needed
      let categoryId = id;
      if (id.startsWith('gid://shop-gau-bong/ProductCategory/')) {
        categoryId = id.replace('gid://shop-gau-bong/ProductCategory/', '');
      }
      
      // Get current status first
      const response = await fetch(`/api/admin/categories/${categoryId}`);
      const data = await response.json();
      const currentStatus = data.category?.status || 'active';
      
      // Only toggle if status is different
      if (currentStatus !== newStatus) {
        return fetch(`/api/admin/categories/${categoryId}/toggle-status`, { method: 'PUT' });
      }
      return Promise.resolve();
    });

    try {
      await Promise.all(promises);
      setSelectedCategories(new Set());
      showToast(`Đã ${newStatus === 'active' ? 'bật' : 'tắt'} ${selectedCategories.size} danh mục`, 'success');
      fetchCategories();
    } catch (error) {
      console.error('Error bulk toggling status:', error);
      showToast('Có lỗi xảy ra khi thay đổi trạng thái', 'error');
    }
  };

  const handleFormSuccess = () => {
    setFormKey(prev => prev + 1);
    showToast('Đã lưu danh mục thành công', 'success');
    fetchCategories();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Get all category IDs in flat order
    const getAllIds = (nodes: CategoryTreeNode[]): string[] => {
      const ids: string[] = [];
      nodes.forEach(node => {
        ids.push(node.id);
        if (node.children) {
          ids.push(...getAllIds(node.children));
        }
      });
      return ids;
    };

    const allIds = viewMode === 'tree' 
      ? getAllIds(categories)
      : flatCategories.map(cat => cat.id);

    const oldIndex = allIds.indexOf(active.id as string);
    const newIndex = allIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder categories
    const reordered = [...allIds];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Build items array with new positions
    const items = reordered.map((id, index) => {
      const category = viewMode === 'tree'
        ? findCategoryInTree(categories, id)
        : flatCategories.find(cat => cat.id === id);
      
      if (!category) return null;

      // Extract ID from GraphQL format if needed
      let categoryId = id;
      if (id.startsWith('gid://shop-gau-bong/ProductCategory/')) {
        categoryId = id.replace('gid://shop-gau-bong/ProductCategory/', '');
      }

      return {
        id: categoryId,
        position: index,
      };
    }).filter(Boolean) as Array<{ id: string; position: number }>;

    // Call API to update positions
    try {
      const response = await fetch('/api/admin/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        showToast('Đã sắp xếp danh mục thành công', 'success');
        fetchCategories();
      } else {
        const error = await response.json();
        showToast(error.error || 'Có lỗi xảy ra khi sắp xếp', 'error');
      }
    } catch (error) {
      console.error('Error reordering:', error);
      showToast('Có lỗi xảy ra khi sắp xếp danh mục', 'error');
    }
  };

  const findCategoryInTree = (nodes: CategoryTreeNode[], id: string): CategoryTreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findCategoryInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleQuickEdit = async (categoryId: string, name: string, slug: string) => {
    // Extract ID from GraphQL format if needed
    let id = categoryId;
    if (categoryId.startsWith('gid://shop-gau-bong/ProductCategory/')) {
      id = categoryId.replace('gid://shop-gau-bong/ProductCategory/', '');
    }

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Có lỗi xảy ra');
      }

      setQuickEditId(null);
      showToast('Đã cập nhật danh mục thành công', 'success');
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      showToast(error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật', 'error');
      throw error;
    }
  };

  const handleAddSubCategorySuccess = () => {
    const parentId = addSubCategoryModal.parentId;
    setAddSubCategoryModal({ isOpen: false, parentId: '', parentName: '' });
    // Auto-expand parent row
    if (parentId) {
      setExpandedRows(prev => new Set(prev).add(parentId));
    }
    showToast('Đã thêm danh mục con thành công', 'success');
    fetchCategories();
  };

  // Filter categories by search
  const filterCategories = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
    if (!search) return nodes;
    
    const query = search.toLowerCase();
    const filtered: CategoryTreeNode[] = [];
    
    for (const node of nodes) {
      const matches = 
        node.name.toLowerCase().includes(query) ||
        node.slug.toLowerCase().includes(query);
      
      const filteredChildren = node.children 
        ? filterCategories(node.children)
        : undefined;
      
      if (matches || (filteredChildren && filteredChildren.length > 0)) {
        filtered.push({
          ...node,
          children: filteredChildren,
        });
      }
    }
    
    return filtered;
  };

  const filteredTree = search ? filterCategories(categories) : categories;
  const filteredFlat = search
    ? flatCategories.filter(cat =>
        cat.name.toLowerCase().includes(search.toLowerCase()) ||
        cat.slug.toLowerCase().includes(search.toLowerCase())
      )
    : flatCategories;

  const renderTreeRow = (category: CategoryTreeNode) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedRows.has(category.id);
    const isSelected = selectedCategories.has(category.id);
    const isQuickEditing = quickEditId === category.id;

    // Extract ID for API calls
    let categoryId = category.id;
    if (category.id.startsWith('gid://shop-gau-bong/ProductCategory/')) {
      categoryId = category.id.replace('gid://shop-gau-bong/ProductCategory/', '');
    }

    return (
      <React.Fragment key={category.id}>
        {isQuickEditing ? (
          <TableRow>
            <TableCell colSpan={7}>
              <QuickEditCategory
                categoryId={category.id}
                name={category.name}
                slug={category.slug}
                onSave={async (name, slug) => {
                  await handleQuickEdit(category.id, name, slug);
                }}
                onCancel={() => setQuickEditId(null)}
              />
            </TableCell>
          </TableRow>
        ) : (
          <SortableCategoryRow
            category={category}
            isSelected={isSelected}
            isExpanded={isExpanded}
            onToggleSelect={() => toggleSelect(category.id)}
            onToggleExpand={() => toggleExpand(category.id)}
            onEdit={() => {
              // Extract ID for edit link
              const editId = category.id.startsWith('gid://shop-gau-bong/ProductCategory/')
                ? category.id.replace('gid://shop-gau-bong/ProductCategory/', '')
                : category.id;
              window.location.href = `/admin/categories/${editId}/edit`;
            }}
            onQuickEdit={() => setQuickEditId(category.id)}
            onToggleStatus={() => handleToggleStatus(category.id)}
            onDelete={() => handleDelete(category.id)}
            onAddSubCategory={() => {
              setAddSubCategoryModal({
                isOpen: true,
                parentId: categoryId,
                parentName: category.name,
              });
            }}
          />
        )}
        {hasChildren && isExpanded && category.children?.map(renderTreeRow)}
      </React.Fragment>
    );
  };

  return (
    <div className="flex gap-6">
      {/* Left Column: Form (30%, Sticky) */}
      <div className="w-[30%] flex-shrink-0">
        <div className="sticky top-6 z-0">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Thêm danh mục mới</h2>
            <p className="text-sm text-gray-600 mt-1">Tạo danh mục sản phẩm mới</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <CategoryForm key={formKey} onSuccess={handleFormSuccess} />
          </div>
        </div>
      </div>

      {/* Right Column: Table (70% on desktop, full width on mobile) */}
      <div className="w-full lg:flex-1">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý danh mục</h1>
            <p className="text-gray-600 mt-2">Quản lý tất cả danh mục sản phẩm</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {/* Filters */}
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Tìm kiếm danh mục..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-12 px-4 rounded-full border border-input bg-background"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tắt</option>
            </select>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="h-12 px-4 rounded-full border border-input bg-background"
            >
              <option value="tree">Dạng cây</option>
              <option value="flat">Danh sách phẳng</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedCategories.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">
                Đã chọn {selectedCategories.size} danh mục
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkToggleStatus('active')}
                >
                  Bật
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkToggleStatus('inactive')}
                >
                  Tắt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  Xóa
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">Đang tải...</div>
          ) : viewMode === 'tree' ? (
            filteredTree.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Không có danh mục nào
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={getAllCategoryIds(filteredTree)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={
                              filteredTree.length > 0 &&
                              getAllCategoryIds(filteredTree).every(id =>
                                selectedCategories.has(id)
                              )
                            }
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead className="w-16">Ảnh</TableHead>
                        <TableHead>Tên danh mục</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-center">Số SP</TableHead>
                        <TableHead>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTree.map(renderTreeRow)}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            )
          ) : (
            filteredFlat.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Không có danh mục nào
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredFlat.length > 0 &&
                          filteredFlat.every(cat => selectedCategories.has(cat.id))
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-16">Ảnh</TableHead>
                    <TableHead>Tên danh mục</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-center">Số SP</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFlat.map((category) => {
                    const isQuickEditing = quickEditId === category.id;
                    let categoryId = category.id;
                    if (category.id.startsWith('gid://shop-gau-bong/ProductCategory/')) {
                      categoryId = category.id.replace('gid://shop-gau-bong/ProductCategory/', '');
                    }

                    return isQuickEditing ? (
                      <TableRow key={category.id}>
                        <TableCell colSpan={7}>
                          <QuickEditCategory
                            categoryId={category.id}
                            name={category.name}
                            slug={category.slug}
                            onSave={async (name, slug) => {
                              await handleQuickEdit(category.id, name, slug);
                            }}
                            onCancel={() => setQuickEditId(null)}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCategories.has(category.id)}
                            onCheckedChange={() => toggleSelect(category.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {category.image?.sourceUrl ? (
                            <div className="relative w-12 h-12 rounded overflow-hidden">
                              <Image
                                src={category.image.sourceUrl}
                                alt={category.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No img</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{category.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setQuickEditId(category.id)}
                              className="h-6 w-6 p-0"
                              title="Sửa nhanh"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{category.slug}</TableCell>
                        <TableCell>
                          <Badge
                            variant={category.status === 'active' ? 'default' : 'outline'}
                            className={category.status === 'active' ? 'bg-green-500' : ''}
                          >
                            {category.status === 'active' ? 'Hoạt động' : 'Tắt'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Link
                            href={`/admin/products?category=${category.id}`}
                            className="text-primary hover:underline"
                          >
                            {category.count || 0}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/admin/categories/${categoryId}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(category.id)}
                            >
                              {category.status === 'active' ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          )}
        </div>
      </div>

      {/* Add Sub-category Modal */}
      <AddSubCategoryModal
        isOpen={addSubCategoryModal.isOpen}
        onClose={() => setAddSubCategoryModal({ isOpen: false, parentId: '', parentName: '' })}
        parentId={addSubCategoryModal.parentId}
        parentName={addSubCategoryModal.parentName}
        onSuccess={handleAddSubCategorySuccess}
      />
    </div>
  );
}
