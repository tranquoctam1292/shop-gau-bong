'use client';

import { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
  useDndMonitor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, GripVertical, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useToastContext } from '@/components/providers/ToastProvider';
import { MenuItemEditor } from './MenuItemEditor';

interface MenuItem {
  id: string;
  title: string | null;
  type: 'custom' | 'category' | 'product' | 'page' | 'post';
  url: string | null;
  referenceId: string | null;
  target: '_self' | '_blank';
  iconClass: string | null;
  cssClass: string | null;
  order: number;
  parentId: string | null;
  children?: MenuItem[];
  // FIX: Include referenceStatus from backend to avoid N+1 API calls
  referenceStatus?: {
    exists: boolean;
    active: boolean;
    url: string;
    title: string;
  };
}

interface MenuStructurePanelProps {
  menuId: string;
  items: MenuItem[];
  onDelete?: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

const TYPE_LABELS: Record<MenuItem['type'], string> = {
  custom: 'Tùy chỉnh',
  category: 'Danh mục',
  product: 'Sản phẩm',
  page: 'Trang',
  post: 'Bài viết',
};

const TYPE_COLORS: Record<MenuItem['type'], string> = {
  custom: 'bg-gray-100 text-gray-800',
  category: 'bg-blue-100 text-blue-800',
  product: 'bg-green-100 text-green-800',
  page: 'bg-purple-100 text-purple-800',
  post: 'bg-orange-100 text-orange-800',
};

// WordPress-style drag & drop constants
const INDENTATION_WIDTH = 30; // px per level
const MAX_DEPTH = 3; // Max level (0, 1, 2)
const AUTO_SCROLL_THRESHOLD = 50; // px from edge to trigger auto-scroll
const AUTO_SCROLL_SPEED = 10; // px per frame
// FIX: Reduced delay for better responsiveness when dragging over collapsed parent
const COLLAPSED_EXPAND_DELAY = 300; // ms to auto-expand collapsed parent (reduced from 500ms)

/**
 * Calculate depth of an item in the tree
 */
function getItemDepth(item: MenuItem, items: MenuItem[], depth: number = 0): number {
  if (!item.parentId) return depth;
  const parent = items.find((i) => i.id === item.parentId);
  if (!parent) return depth;
  return getItemDepth(parent, items, depth + 1);
}

/**
 * Calculate maximum depth of a menu item's subtree (relative to itself)
 * 
 * Returns the maximum depth of all descendants relative to the item itself.
 * - If item has no children, returns 0
 * - If item has children, returns 1 + max depth of children
 * 
 * Example:
 * - Item with no children: 0
 * - Item with direct children only: 1
 * - Item with grandchildren: 2
 * 
 * @param item - Menu item with children structure
 * @returns Maximum depth of subtree (0 = no children, 1 = has direct children, etc.)
 */
function getMaxSubtreeDepth(item: MenuItem): number {
  if (!item.children || item.children.length === 0) {
    return 0;
  }
  return 1 + Math.max(...item.children.map(getMaxSubtreeDepth));
}

/**
 * Find an item in the tree structure (with children) by ID
 * 
 * @param items - Tree structure of menu items
 * @param itemId - ID of item to find
 * @returns Found item with children structure, or null if not found
 */
function findItemInTree(items: MenuItem[], itemId: string): MenuItem | null {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const found = findItemInTree(item.children, itemId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Convert flat items array to nested tree structure
 * 
 * ✅ FIX: Preserve ALL properties of MenuItem when building tree
 */
function buildTree(items: MenuItem[]): MenuItem[] {
  const itemMap = new Map<string, MenuItem>();
  const rootItems: MenuItem[] = [];

  // ✅ FIX: Create map of all items preserving ALL properties
  items.forEach((item) => {
    // Destructure to separate children (will be rebuilt) from other properties
    const { children, ...itemWithoutChildren } = item;
    // Preserve ALL properties and initialize children array
    itemMap.set(item.id, { ...itemWithoutChildren, children: [] });
  });

  // Build tree
  items.forEach((item) => {
    const node = itemMap.get(item.id)!;
    if (!item.parentId) {
      rootItems.push(node);
    } else {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
      } else {
        // Orphaned item, add to root
        rootItems.push(node);
      }
    }
  });

  // ✅ FIX: Sort by order preserving ALL properties
  const sortByOrder = (items: MenuItem[]): MenuItem[] => {
    return items
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        ...item, // ✅ PRESERVE ALL PROPERTIES
        children: item.children ? sortByOrder(item.children) : [],
      }));
  };

  return sortByOrder(rootItems);
}

/**
 * Flatten tree structure to flat array
 * 
 * ✅ FIX: Preserve ALL properties of MenuItem when flattening
 * Separates children to avoid circular references in flat list
 */
function flattenTree(items: MenuItem[], parentId: string | null = null): MenuItem[] {
  const result: MenuItem[] = [];
  items.forEach((item) => {
    // ✅ FIX: Destructure children out to avoid circular references
    // Preserve ALL other properties using spread operator
    const { children, ...itemWithoutChildren } = item;
    
    // Create flat item with ALL original data + structure metadata
    // ✅ FIX: Preserve parentId from item if exists (from flat structure), otherwise use passed parentId (from tree structure)
    const flatItem: MenuItem = {
      ...itemWithoutChildren, // ✅ PRESERVE ALL DATA (id, title, type, url, target, iconClass, cssClass, order, referenceId, etc.)
      parentId: item.parentId ?? parentId, // Use item's parentId if exists, otherwise use passed parentId
      // Note: children is optional in MenuItem interface, so we don't need to set it explicitly
      // The spread operator already excludes it from itemWithoutChildren
    };
    
    result.push(flatItem);
    
    // Recursively flatten children
    if (children && children.length > 0) {
      result.push(...flattenTree(children, item.id));
    }
  });
  return result;
}

/**
 * Convert tree to structure format for API
 */
function treeToStructure(items: MenuItem[]): Array<{ id: string; children: any[] }> {
  return items.map((item) => ({
    id: item.id,
    children: item.children && item.children.length > 0 ? treeToStructure(item.children) : [],
  }));
}

/**
 * Sortable Menu Item Row Component
 * FIX: Memoized to prevent unnecessary re-renders during drag operations
 */
const SortableMenuItem = memo(function SortableMenuItem({
  item,
  allItems,
  expandedItems,
  onToggleExpand,
  onDelete,
  onUpdate,
  onDuplicate,
  depth,
  menuId,
}: {
  item: MenuItem;
  allItems: MenuItem[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
  depth: number;
  menuId: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    // FIX: Always allow dragging - depth limit is enforced in handleDragOver logic
    // Previously disabled: depth >= 2 prevented moving level 3 items back to upper levels
    disabled: false,
  });

  const { showToast } = useToastContext();
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [referenceStatus, setReferenceStatus] = useState<{
    exists: boolean;
    active: boolean;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.id);
  const isMaxDepth = depth >= 2; // Level 3 (depth 2)

  // FIX: Use referenceStatus from backend API instead of making individual API calls
  useEffect(() => {
    if (item.referenceStatus) {
      // Use status from backend (batch resolved)
      setPreviewUrl(item.referenceStatus.url);
      setReferenceStatus({
        exists: item.referenceStatus.exists,
        active: item.referenceStatus.active,
      });
    } else if (item.type === 'custom') {
      // Custom links don't need resolution
      setPreviewUrl(item.url || '#');
      setReferenceStatus({ exists: true, active: true });
    } else {
      // Fallback: no reference status available
      setPreviewUrl('#');
      setReferenceStatus({ exists: false, active: false });
    }
  }, [item]);

  // FIX: Optimize style for smooth dragging and reduce flickering
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // Use will-change to optimize rendering during drag operations
    willChange: isDragging ? 'transform' : 'auto',
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa menu item này? Nếu có menu items con, chúng cũng sẽ bị xóa.')) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete?.(item.id);
    } catch (err) {
      // Error handled in parent
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      await onDuplicate?.(item.id);
    } catch (err) {
      // Error handled in parent
    } finally {
      setDuplicating(false);
    }
  };

  const handleSave = async (updates: Partial<MenuItem>) => {
    // Convert null to undefined for title to match MenuItem type
    const normalizedUpdates = { ...updates };
    if ('title' in normalizedUpdates && normalizedUpdates.title === null) {
      normalizedUpdates.title = undefined;
    }
    await onUpdate?.(item.id, normalizedUpdates as Partial<MenuItem>);
    setEditing(false);
  };

  // If editing, show editor
  if (editing) {
    return (
      <div style={{ paddingLeft: `${12 + depth * 24}px` }}>
        <MenuItemEditor
          item={item}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      data-sortable-id={item.id}
      style={{ ...style, paddingLeft: `${12 + depth * 24}px` }}
      className={`flex items-center gap-2 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-all duration-150 ${
        isDragging ? 'shadow-lg scale-105 z-50 opacity-50' : ''
      } ${isMaxDepth ? 'opacity-60' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 ${
          isMaxDepth ? 'cursor-not-allowed opacity-50' : ''
        }`}
        title={isMaxDepth ? 'Không thể di chuyển (đã đạt độ sâu tối đa)' : 'Kéo để di chuyển'}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Expand/Collapse Button */}
      {hasChildren ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onToggleExpand(item.id)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
      ) : (
        <div className="w-6" />
      )}

      {/* Item Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* FIX: Add fallback text for empty title to prevent invisible items */}
          <span className={`font-medium ${!item.title ? 'text-gray-400 italic' : 'text-gray-900'}`}>
            {item.title || '(Chưa có tiêu đề)'}
          </span>
          <Badge className={TYPE_COLORS[item.type]} variant="secondary">
            {TYPE_LABELS[item.type]}
          </Badge>
          {item.target === '_blank' && (
            <Badge variant="outline" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Mở tab mới
            </Badge>
          )}
          {isMaxDepth && (
            <Badge variant="outline" className="text-xs text-orange-600">
              Độ sâu tối đa
            </Badge>
          )}
          {referenceStatus && !referenceStatus.exists && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Reference không tồn tại
            </Badge>
          )}
          {referenceStatus && referenceStatus.exists && !referenceStatus.active && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Reference không active
            </Badge>
          )}
        </div>
        {/* URL/Reference info - Hide when dragging for compact view */}
        {!isDragging && (
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            {previewUrl && previewUrl !== '#' && (
              <span className="truncate flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {previewUrl}
              </span>
            )}
            {!previewUrl && item.url && <span className="truncate">{item.url}</span>}
            {item.referenceId && (
              <span className="text-xs">(ID: {item.referenceId.substring(0, 8)}...)</span>
            )}
          </div>
        )}
      </div>

      {/* Actions - Hide when dragging for compact view */}
      {!isDragging && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={deleting}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setEditing(true)}
              className="cursor-pointer"
              disabled={deleting || duplicating}
            >
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDuplicate}
              className="cursor-pointer"
              disabled={deleting || duplicating}
            >
              <Copy className="mr-2 h-4 w-4" />
              {duplicating ? 'Đang nhân bản...' : 'Nhân bản'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="cursor-pointer text-red-600"
              disabled={deleting || duplicating}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});

/**
 * Render nested menu items recursively
 * Note: SortableContext should wrap all items at root level, not nested
 */
function NestedMenuItems({
  items,
  allItems,
  expandedItems,
  onToggleExpand,
  onDelete,
  onUpdate,
  onDuplicate,
  depth = 0,
  menuId,
  projectedPosition,
  activeItemHeight = 60,
}: {
  items: MenuItem[];
  allItems: MenuItem[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
  depth?: number;
  menuId: string;
  projectedPosition?: { overId: string | null; depth: number; isInvalid: boolean } | null;
  activeItemHeight?: number;
}) {
  if (items.length === 0) return null;
  
  // Default height if not provided
  const placeholderHeight = activeItemHeight;

  return (
    <div className="space-y-2 relative">
      {items.map((item, index) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.has(item.id);
        
        // FIX: Show placeholder at correct depth when dragging
        // Use projectedPosition prop directly (now updated immediately without throttle)
        const isHoveringOverItem = projectedPosition?.overId === item.id;
        const projectedDepth = projectedPosition?.depth ?? -1;
        
        // Show placeholder if:
        // 1. Hovering over this item AND projected depth equals current depth (same level - reorder)
        // FIX: When projectedDepth === depth + 1, placeholder should be shown in CHILD AREA, not at parent item
        // This prevents duplicate placeholders when dragging to create a child
        // IMPORTANT: Also check if parent is rendering placeholder in children area to avoid duplicate
        // If projectedDepth === depth + 1, parent will render placeholder in children area, so don't render here
        const isParentRenderingPlaceholderInChildren = projectedPosition && 
          projectedPosition.overId === item.parentId && 
          projectedPosition.depth === depth + 1;
        const showPlaceholderAtItem = isHoveringOverItem && 
          projectedDepth === depth &&
          !isParentRenderingPlaceholderInChildren;

        return (
          <div key={item.id} className="relative">
            {/* Show placeholder before item if this is the target position */}
            {/* FIX: Always use projectedDepth for placeholder indentation (now updated immediately) */}
            {showPlaceholderAtItem && projectedPosition && (
              <DragPlaceholder 
                depth={projectedPosition.depth} 
                isInvalid={projectedPosition.isInvalid}
                itemHeight={placeholderHeight}
              />
            )}
            <SortableMenuItem
              item={item}
              allItems={allItems}
              expandedItems={expandedItems}
              onToggleExpand={onToggleExpand}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onDuplicate={onDuplicate}
              depth={depth}
              menuId={menuId}
            />
            {hasChildren && isExpanded && (
              <div className="ml-6 mt-2">
                {/* FIX: Show placeholder at start of children area when projectedDepth === depth + 1 */}
                {/* This ensures placeholder appears in child area, not at parent item, preventing duplicate placeholders */}
                {projectedPosition && 
                 projectedPosition.overId === item.id && 
                 projectedPosition.depth === depth + 1 && (
                  <DragPlaceholder 
                    depth={projectedPosition.depth} 
                    isInvalid={projectedPosition.isInvalid}
                    itemHeight={activeItemHeight}
                  />
                )}
                <NestedMenuItems
                  items={item.children!}
                  allItems={allItems}
                  expandedItems={expandedItems}
                  onToggleExpand={onToggleExpand}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  onDuplicate={onDuplicate}
                  depth={depth + 1}
                  menuId={menuId}
                  projectedPosition={projectedPosition}
                  activeItemHeight={activeItemHeight}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// WordPress-style Placeholder Component
function DragPlaceholder({
  depth,
  isInvalid,
  itemHeight,
}: {
  depth: number;
  isInvalid?: boolean;
  itemHeight: number;
}) {
  const indentPx = depth * INDENTATION_WIDTH;
  
  return (
    <div
      className={`relative left-0 right-0 pointer-events-none z-10 mb-2 ${
        isInvalid ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-300'
      } border-2 border-dashed rounded-lg transition-all duration-150`}
      style={{
        paddingLeft: `${12 + indentPx}px`,
        height: `${itemHeight}px`,
        minHeight: '60px',
      }}
    >
      <div className="h-full flex items-center">
        <div className={`w-1 h-8 ${isInvalid ? 'bg-red-400' : 'bg-blue-400'} rounded`} />
      </div>
    </div>
  );
}

export function MenuStructurePanel({
  menuId,
  items,
  onDelete,
  onRefresh,
}: MenuStructurePanelProps) {
  const { showToast } = useToastContext();
  const [treeItems, setTreeItems] = useState<MenuItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // FIX: Ref to store snapshot for rollback on API failure
  const previousTreeSnapshot = useRef<MenuItem[]>([]);
  
  // FIX: Ref to throttle projectedPosition updates and prevent unnecessary re-renders
  const projectedPositionRef = useRef<{ overId: string | null; depth: number; isInvalid: boolean } | null>(null);
  const projectedPositionUpdateTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // WordPress-style drag & drop state
  const [projectedPosition, setProjectedPosition] = useState<{
    overId: string | null;
    depth: number;
    isInvalid: boolean;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  // ✅ FIX: Use useRef instead of useState for scroll interval to prevent memory leaks
  // State can be lost on re-render, but ref persists across renders
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [activeItemHeight, setActiveItemHeight] = useState<number>(60); // Default height

  // ✅ FIX: Build tree structure from flat items with deep comparison
  // Use ref to track previous items and only update when actually changed
  const previousItemsRef = useRef<string>('');
  
  useEffect(() => {
    // Deep comparison using JSON.stringify to prevent unnecessary updates
    const itemsKey = JSON.stringify(items.map(item => ({ id: item.id, parentId: item.parentId, order: item.order })));
    
    // Only rebuild tree if items actually changed
    if (previousItemsRef.current === itemsKey) {
      return;
    }
    
    previousItemsRef.current = itemsKey;
    const tree = buildTree(items);
    setTreeItems(tree);
    // Auto-expand all items by default
    const allIds = new Set(flattenTree(tree).map((item) => item.id));
    setExpandedItems(allIds);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8px for smoother dragging
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setProjectedPosition(null);
    setDragOffset(null);
    
    // Measure active item height for placeholder
    const activeElement = document.querySelector(`[data-sortable-id="${event.active.id}"]`);
    if (activeElement) {
      const height = (activeElement as HTMLElement).offsetHeight;
      setActiveItemHeight(height || 60);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over, delta } = event;
    
    if (!over || !delta) {
      setProjectedPosition(null);
      projectedPositionRef.current = null;
      if (projectedPositionUpdateTimeout.current) {
        clearTimeout(projectedPositionUpdateTimeout.current);
        projectedPositionUpdateTimeout.current = null;
      }
      return;
    }

    // FIX: delta from dnd-kit is already cumulative, don't accumulate it
    // Just store the current delta value for reference
    setDragOffset({ x: delta.x, y: delta.y });

    // Calculate projected depth based on horizontal movement (deltaX)
    const allFlatItems = flattenTree(treeItems);
    const overItem = allFlatItems.find((item) => item.id === over.id);
    const activeItem = allFlatItems.find((item) => item.id === active.id);
    
    if (!overItem || !activeItem) {
      setProjectedPosition(null);
      projectedPositionRef.current = null;
      if (projectedPositionUpdateTimeout.current) {
        clearTimeout(projectedPositionUpdateTimeout.current);
        projectedPositionUpdateTimeout.current = null;
      }
      return;
    }

    const overDepth = getItemDepth(overItem, allFlatItems);
    const activeDepth = getItemDepth(activeItem, allFlatItems);
    
    // ✅ FIX: Calculate subtree depth of active item to account for children
    // Find active item in tree structure (with children) to calculate subtree depth
    const activeItemInTree = findItemInTree(treeItems, active.id as string);
    const subtreeDepth = activeItemInTree ? getMaxSubtreeDepth(activeItemInTree) : 0;
    
    // ✅ FIX: Calculate projected depth based on activeDepth (item being dragged) instead of overDepth
    // This prevents "jumpy" behavior when mouse moves over items with different depths
    // The depth should only change based on horizontal movement (delta X), not which item is under cursor
    const levelChange = Math.round(delta.x / INDENTATION_WIDTH);
    let projectedDepth = activeDepth + levelChange;
    
    // Clamp projected depth with constraints
    // 1. Cannot be less than 0 (root level)
    projectedDepth = Math.max(0, projectedDepth);
    
    // ✅ FIX: Dynamic max depth constraint based on subtree depth
    // MAX_DEPTH = 3 means max depth index = 2 (levels: 0, 1, 2)
    // If active item has subtree depth of 1 (has direct children), then:
    // - Max allowed depth = 2 - 1 = 1 (so children won't exceed depth 2)
    // - If active item has subtree depth of 0 (no children), max allowed depth = 2
    const ABSOLUTE_MAX_DEPTH = MAX_DEPTH - 1; // Max depth index (2 for 3 levels)
    const maxAllowedDepth = ABSOLUTE_MAX_DEPTH - subtreeDepth;
    projectedDepth = Math.min(projectedDepth, maxAllowedDepth);
    
    // 3. Cannot be greater than (over item's depth + 1)
    // This ensures we can't create orphaned items - item can't be deeper than child of item under cursor
    const maxDepthByOverItem = overDepth + 1;
    projectedDepth = Math.min(projectedDepth, maxDepthByOverItem);
    
    // 4. If moving left (un-nesting), cannot go below 0
    if (levelChange < 0) {
      projectedDepth = Math.max(0, projectedDepth);
    }

    // ✅ FIX: Check if projected position is invalid (exceeds max depth or would push children too deep)
    // Invalid if: projectedDepth exceeds absolute max OR projectedDepth + subtreeDepth would exceed absolute max
    const isInvalid = projectedDepth >= MAX_DEPTH || (projectedDepth + subtreeDepth) > ABSOLUTE_MAX_DEPTH;
    
    // FIX: Update state immediately (no throttle) so placeholder always uses correct depth
    // React.memo on SortableMenuItem will prevent unnecessary re-renders
    const newProjectedPosition = {
      overId: over.id as string,
      depth: projectedDepth,
      isInvalid,
    };
    
    // Update ref for reference
    projectedPositionRef.current = newProjectedPosition;
    
    // Compare with previous state value
    const prev = projectedPosition;
    if (!prev || 
        prev.overId !== newProjectedPosition.overId || 
        prev.depth !== newProjectedPosition.depth || 
        prev.isInvalid !== newProjectedPosition.isInvalid) {
      // Clear any pending update
      if (projectedPositionUpdateTimeout.current) {
        clearTimeout(projectedPositionUpdateTimeout.current);
        projectedPositionUpdateTimeout.current = null;
      }
      
      // Update state immediately (no throttle) for correct placeholder rendering
      setProjectedPosition(newProjectedPosition);
    }

    // Auto-expand collapsed parent if hovering for delay
    if (projectedDepth > overDepth && !expandedItems.has(over.id as string)) {
      setTimeout(() => {
        if (activeId === active.id) {
          setExpandedItems((prev) => new Set([...prev, over.id as string]));
        }
      }, COLLAPSED_EXPAND_DELAY);
    }

    // Auto-scroll when near edges
    handleAutoScroll(event);
  };
  
  // ✅ FIX: Auto-scroll handler using useRef for stable interval reference
  const handleAutoScroll = useCallback((event: DragOverEvent) => {
    if (!event.delta) {
      // Stop scrolling if no delta (not dragging)
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
      return;
    }
    
    // ✅ FIX: Clear existing interval before starting new one (defensive programming)
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

    const viewport = {
      top: window.scrollY,
      bottom: window.scrollY + window.innerHeight,
    };

    // Get pointer Y position (approximate from event)
    const pointerY = event.activatorEvent instanceof MouseEvent 
      ? event.activatorEvent.clientY + window.scrollY
      : viewport.top + window.innerHeight / 2;
    
    const distanceFromTop = pointerY - viewport.top;
    const distanceFromBottom = viewport.bottom - pointerY;

    // ✅ FIX: Store interval ID in ref instead of state
    if (distanceFromTop < AUTO_SCROLL_THRESHOLD && viewport.top > 0) {
      // Scroll up
      scrollIntervalRef.current = setInterval(() => {
        if (window.scrollY > 0) {
          window.scrollBy(0, -AUTO_SCROLL_SPEED);
        } else {
          // Reached top, stop scrolling
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
        }
      }, 16); // ~60fps
    } else if (distanceFromBottom < AUTO_SCROLL_THRESHOLD) {
      // Scroll down
      scrollIntervalRef.current = setInterval(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY < maxScroll) {
          window.scrollBy(0, AUTO_SCROLL_SPEED);
        } else {
          // Reached bottom, stop scrolling
          if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
        }
      }, 16);
    }
    // If not near edges, interval is already cleared above (defensive)
  }, []);
  
  // ✅ FIX: Cleanup auto-scroll on drag end or unmount
  useEffect(() => {
    // Cleanup when drag ends (activeId becomes null)
    if (!activeId && scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    // Cleanup on unmount (defensive programming)
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [activeId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // FIX: Save projectedPosition and dragOffset BEFORE cleanup (needed for logic checks)
    // These values are needed to determine if user wants to create child at current position
    const savedProjectedPosition = projectedPosition;
    const savedDragOffset = dragOffset;
    
    // FIX: Use over.id from event (item where user drops) but use projectedPosition.depth for target depth
    // The event's over.id is the item where the user actually drops, which is more accurate
    // projectedPosition.depth is calculated based on horizontal movement and is more accurate for nesting
    const targetOverId = over?.id;
    
    // Cleanup
    setActiveId(null);
    setProjectedPosition(null);
    projectedPositionRef.current = null;
    if (projectedPositionUpdateTimeout.current) {
      clearTimeout(projectedPositionUpdateTimeout.current);
      projectedPositionUpdateTimeout.current = null;
    }
    setDragOffset(null);
    
    // ✅ FIX: Clear auto-scroll interval using ref (stable reference)
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

    if (!targetOverId || !savedProjectedPosition) {
      return;
    }

    // Reject invalid positions
    if (savedProjectedPosition.isInvalid) {
      showToast('Không thể di chuyển đến vị trí này (vượt quá độ sâu tối đa)', 'error');
      return;
    }

    // Find active and over items in the tree
    const allFlatItems = flattenTree(treeItems);
    const activeItem = allFlatItems.find((item) => item.id === active.id);
    let overItem = allFlatItems.find((item) => item.id === targetOverId);
    
    // FIX: When dragging an item to the right at its current position (over.id === active.id),
    // check if user wants to create a child by dragging right (savedDragOffset.x > 0)
    // This handles the case where user drags item C to the right at position C to become child of item B above
    // IMPORTANT: This check must happen BEFORE the early return for same id
    // We check dragOffset.x > 0 (dragging right) instead of projectedDepth > 0 because
    // when dragging at current position, deltaX might be 0 or very small, so projectedDepth might not increase
    if (activeItem && targetOverId === active.id && savedDragOffset && savedDragOffset.x > 0) {
      const allFlatItemsOrdered = flattenTree(treeItems);
      const activeItemIndex = allFlatItemsOrdered.findIndex((item) => item.id === active.id);
      
      // Find the item immediately above the active item at the same depth level
      // Look backwards from activeItemIndex to find the previous item at the same or shallower depth
      const activeDepth = getItemDepth(activeItem, allFlatItems);
      let itemAbove: MenuItem | null = null;
      
      for (let i = activeItemIndex - 1; i >= 0; i--) {
        const candidate = allFlatItemsOrdered[i];
        const candidateDepth = getItemDepth(candidate, allFlatItems);
        
        // Find the first item at the same or shallower depth (can be parent)
        if (candidateDepth <= activeDepth) {
          itemAbove = candidate;
          break;
        }
      }
      
      if (itemAbove) {
        // Check if we can create a child (activeDepth < MAX_DEPTH - 1)
        const itemAboveDepth = getItemDepth(itemAbove, allFlatItems);
        if (activeDepth < MAX_DEPTH - 1 && itemAboveDepth < MAX_DEPTH - 1) {
          overItem = itemAbove;
          // Force targetDepth to be activeDepth + 1 (create child)
          // We'll set this later after calculating targetDepth from savedProjectedPosition
        } else {
          // Cannot create child - return early
          return;
        }
      } else {
        // If no item above found, cannot create child - return early
        return;
      }
    } else if (active.id === targetOverId) {
      // If dragging at current position but not creating child (dragOffsetX <= 0),
      // return early (no action needed)
      return;
    }
    // FIX: When dragging right (deltaX > 0) to create a child (projectedDepth > 0),
    // if overItem is not the intended target (e.g., mouse passed through it),
    // try to find the item above it that might be the intended target
    // This helps when user wants to drop on "Trang chủ" but mouse is on "Về chúng tôi"
    else if (overItem && savedDragOffset && savedDragOffset.x > 0 && savedProjectedPosition && savedProjectedPosition.depth > 0) {
      const allFlatItemsOrdered = flattenTree(treeItems);
      const overItemIndex = allFlatItemsOrdered.findIndex((item) => item.id === targetOverId);
      const activeItemIndex = allFlatItemsOrdered.findIndex((item) => item.id === active.id);
      
      // If dragging upward (activeItemIndex > overItemIndex) and overItem is not root,
      // try to find the root item above it
      if (activeItemIndex > overItemIndex && overItem.parentId === null) {
        // Look for root items above the current overItem
        const rootItems = allFlatItemsOrdered.filter((item) => item.parentId === null);
        const currentRootIndex = rootItems.findIndex((item) => item.id === targetOverId);
        
        // If there's a root item above, use it as target (user likely wants to drop on it)
        if (currentRootIndex > 0) {
          const targetRootItem = rootItems[currentRootIndex - 1];
          overItem = targetRootItem;
        }
      }
    }

    if (!activeItem || !overItem) {
      return;
    }

    // ✅ FIX: Check depth limits accounting for subtree depth
    const activeDepth = getItemDepth(activeItem, allFlatItems);
    const overDepth = getItemDepth(overItem, allFlatItems);
    
    // Find active item in tree structure to calculate subtree depth
    const activeItemInTree = findItemInTree(treeItems, active.id as string);
    const subtreeDepth = activeItemInTree ? getMaxSubtreeDepth(activeItemInTree) : 0;
    
    // ✅ FIX: Dynamic max depth constraint based on subtree depth
    const ABSOLUTE_MAX_DEPTH = MAX_DEPTH - 1; // Max depth index (2 for 3 levels)
    const maxAllowedDepth = ABSOLUTE_MAX_DEPTH - subtreeDepth;
    
    // Don't allow moving into level that would exceed max depth
    if (overDepth >= ABSOLUTE_MAX_DEPTH) {
      showToast('Không thể di chuyển vào cấp này (đã đạt độ sâu tối đa)', 'error');
      return;
    }

    // ✅ FIX: Don't allow moving item if its subtree would exceed max depth
    // Check if active item's depth + subtree depth would exceed absolute max
    if (activeDepth + subtreeDepth > ABSOLUTE_MAX_DEPTH) {
      showToast('Không thể di chuyển item này (cây con sẽ vượt quá độ sâu tối đa)', 'error');
      return;
    }
    
    // ✅ FIX: Check if target depth would exceed max allowed depth
    // This check uses savedProjectedPosition.depth which was calculated in handleDragOver
    if (savedProjectedPosition && savedProjectedPosition.depth > maxAllowedDepth) {
      showToast('Không thể di chuyển đến vị trí này (cây con sẽ vượt quá độ sâu tối đa)', 'error');
      return;
    }

    // Prevent moving item into its own descendant
    const isDescendant = (item: MenuItem, potentialParent: MenuItem): boolean => {
      if (item.id === potentialParent.id) return true;
      if (!potentialParent.children || potentialParent.children.length === 0) return false;
      return potentialParent.children.some((child) => isDescendant(item, child));
    };

    if (isDescendant(overItem, activeItem)) {
      showToast('Không thể di chuyển item vào chính nó hoặc item con của nó', 'error');
      return;
    }

    // WordPress-style: Use projected depth to determine target parent
    // Get target depth from projected position
    let targetDepth = savedProjectedPosition.depth;
    
    // FIX: If we're dragging at current position and adjusted overItem to item above,
    // force targetDepth to create a child (activeDepth + 1)
    if (targetOverId === active.id && savedDragOffset && savedDragOffset.x > 0 && overItem && overItem.id !== active.id) {
      const activeDepthForCheck = getItemDepth(activeItem, allFlatItems);
      targetDepth = activeDepthForCheck + 1;
    }
    
    // FIX: When dragging a child item (activeDepth > 0) onto its current parent (overItem.id === activeItem.parentId),
    // and overItem is root (overDepth === 0), force targetDepth to 0 to move to root
    // This handles the case where user drags a child item onto its parent root item to move it to root level
    // This check must happen BEFORE the dragOffset check to ensure it takes priority
    if (overDepth === 0 && activeDepth > 0 && overItem.id === activeItem.parentId) {
      targetDepth = 0;
    }
    // FIX: When dragging a child item (activeDepth > 0) onto a different root item (overDepth === 0),
    // and projectedDepth is 1 (would become child), but user likely wants to move to root (sibling of overItem)
    // Check if savedDragOffset indicates left movement (negative or small positive)
    else if (overDepth === 0 && activeDepth > 0 && targetDepth === 1 && overItem.id !== activeItem.parentId) {
      // If dragOffset is negative or very small positive (< 15px), treat as moving to root
      const dragOffsetX = savedDragOffset?.x ?? 0;
      if (dragOffsetX < 15) {
        targetDepth = 0;
      }
    }
    
    // FIX: Use tree structure and depth comparison instead of look-back in flat array
    // This is more reliable during drag operations
    let targetParentId: string | null = null;
    
    if (targetDepth === 0) {
      // Moving to root level
      targetParentId = null;
    } else if (targetDepth > overDepth) {
      // Item will become a child of overItem
      targetParentId = overItem.id;
    } else if (targetDepth === overDepth) {
      // Item will be a sibling of overItem, same parent
      targetParentId = overItem.parentId;
    } else {
      // targetDepth < overDepth: Item will be a child of an ancestor of overItem
      // Find the parent at targetDepth - 1 by traversing up the tree from overItem
      const findParentAtDepth = (item: MenuItem, targetParentDepth: number, allItems: MenuItem[]): MenuItem | null => {
        if (targetParentDepth < 0) return null;
        
        // If overItem itself is at the target parent depth, use it
        if (overDepth === targetParentDepth) {
          return overItem;
        }
        
        // Traverse up the tree to find parent at target depth
        let current: MenuItem | null = overItem;
        while (current) {
          const currentDepth = getItemDepth(current, allItems);
          if (currentDepth === targetParentDepth) {
            return current;
          }
          // Move up to parent
          if (current?.parentId) {
            current = allItems.find((i) => i.id === current!.parentId) || null;
          } else {
            break;
          }
        }
        
        return null;
      };
      
      const allItemsFlat = flattenTree(treeItems);
      const parentAtTargetDepth = findParentAtDepth(overItem, targetDepth - 1, allItemsFlat);
      targetParentId = parentAtTargetDepth?.id || null;
      
      // Fallback: if still not found, use overItem's parent
      if (!targetParentId && overItem.parentId) {
        targetParentId = overItem.parentId;
      }
    }
    
    // Determine action based on target depth and current state
    const activeParentId = activeItem.parentId;
    const overParentId = overItem.parentId;
    const areSiblings = targetDepth === 0 && activeParentId === null;
    const isAlreadyChild = activeParentId === targetParentId;
    const shouldMoveToRoot = targetDepth === 0 && activeParentId !== null;
    const shouldReorder = areSiblings || (isAlreadyChild && targetParentId !== null);
    
    // Helper: Find item in tree and get its siblings
    const findItemAndSiblings = (items: MenuItem[], itemId: string, parentId: string | null): { item: MenuItem | null; siblings: MenuItem[]; parent: MenuItem | null } => {
      if (parentId === null) {
        // Looking for root items
        const siblings = items.filter((item) => !item.parentId);
        const item = siblings.find((i) => i.id === itemId) || null;
        return { item, siblings, parent: null };
      } else {
        // Looking for nested items
        for (const item of items) {
          if (item.id === parentId && item.children) {
            const siblings = item.children;
            const foundItem = siblings.find((i) => i.id === itemId) || null;
            return { item: foundItem, siblings, parent: item };
          }
          if (item.children) {
            const result = findItemAndSiblings(item.children, itemId, parentId);
            if (result.item || result.parent) {
              return result;
            }
          }
        }
      }
      return { item: null, siblings: [], parent: null };
    };

    // ✅ FIX: Remove active item from old location preserving ALL properties
    const removeItem = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter((item) => item.id !== active.id)
        .map((item) => ({
          ...item, // ✅ PRESERVE ALL PROPERTIES
          children: item.children ? removeItem(item.children) : [],
        }));
    };

    // FIX: Reorder items in the same parent - determine insert position based on drag direction
    // Before removing item, save original indices to determine if dragging up or down
    const allFlatItemsOriginal = flattenTree(treeItems);
    const originalActiveIndex = allFlatItemsOriginal.findIndex((item) => item.id === active.id);
    const originalOverIndex = allFlatItemsOriginal.findIndex((item) => item.id === over.id);
    const isMovingDown = originalActiveIndex < originalOverIndex;
    
    const reorderInParent = (items: MenuItem[], parentId: string | null, itemToInsert: MenuItem): MenuItem[] => {
      if (parentId === null) {
        // Reorder root items
        const rootItems = items.filter((item) => !item.parentId);
        const otherItems = items.filter((item) => item.parentId);
        
        const overIndex = rootItems.findIndex((item) => item.id === over.id);
        
        if (overIndex === -1) {
          return items;
        }
        
        // FIX: Determine insert position based on drag direction
        // If moving down (activeIndex < overIndex), insert AFTER over item (overIndex + 1)
        // If moving up (activeIndex > overIndex), insert BEFORE over item (overIndex)
        let insertIndex = overIndex;
        if (isMovingDown) {
          insertIndex = overIndex + 1;
        }
        
        const newRootItems = [...rootItems];
        // ✅ FIX: Preserve ALL properties from itemToInsert (which is activeItem)
        // Only update parentId and children structure
        newRootItems.splice(insertIndex, 0, { 
          ...itemToInsert, // ✅ PRESERVE ALL PROPERTIES (id, title, type, url, target, iconClass, cssClass, etc.)
          parentId: null, 
          children: activeItem.children || [] 
        });
        
        return [...newRootItems, ...otherItems];
      } else {
        // Reorder in nested parent
        return items.map((item) => {
          if (item.id === parentId && item.children) {
            const overIndex = item.children.findIndex((child) => child.id === over.id);
            
            if (overIndex !== -1) {
              // FIX: Determine insert position based on drag direction
              let insertIndex = overIndex;
              if (isMovingDown) {
                insertIndex = overIndex + 1;
              }
              
              const newChildren = [...item.children];
              // ✅ FIX: Preserve ALL properties from itemToInsert (which is activeItem)
              newChildren.splice(insertIndex, 0, { 
                ...itemToInsert, // ✅ PRESERVE ALL PROPERTIES
                parentId, 
                children: activeItem.children || [] 
              });
              return { ...item, children: newChildren };
            }
          }
          return {
            ...item, // ✅ PRESERVE ALL PROPERTIES
            children: item.children ? reorderInParent(item.children, parentId, itemToInsert) : [],
          };
        });
      }
    };

    // ✅ FIX: Add active item as child of over item preserving ALL properties
    const addItemAsChild = (items: MenuItem[], targetId: string): MenuItem[] => {
      return items.map((item) => {
        if (item.id === targetId) {
          // ✅ FIX: Preserve ALL properties from activeItem
          const newChild: MenuItem = { 
            ...activeItem, // ✅ PRESERVE ALL PROPERTIES (id, title, type, url, target, iconClass, cssClass, order, referenceId, etc.)
            parentId: targetId, 
            children: activeItem.children || [] 
          };
          const newChildren = item.children ? [...item.children, newChild] : [newChild];
          
          return {
            ...item, // ✅ PRESERVE ALL PROPERTIES
            children: newChildren,
          };
        }
        // FIX: Only recurse into children if they exist and are not empty
        // This prevents unnecessary recursive calls with empty arrays
        return {
          ...item, // ✅ PRESERVE ALL PROPERTIES
          children: item.children && item.children.length > 0 ? addItemAsChild(item.children, targetId) : (item.children || []),
        };
      });
    };

    // ✅ FIX: Move active item to root level preserving ALL properties
    const moveToRoot = (items: MenuItem[], siblingId: string): MenuItem[] => {
      // Filter root items (items with no parentId)
      const rootItems = items.filter((item) => !item.parentId);
      // Keep nested items as-is (they will be preserved in their parent's children)
      const nestedItems = items.filter((item) => item.parentId);
      
      const siblingIndex = rootItems.findIndex((item) => item.id === siblingId);
      
      // ✅ FIX: Create new root item preserving ALL properties
      const newRootItem: MenuItem = {
        ...activeItem, // ✅ PRESERVE ALL PROPERTIES (id, title, type, url, target, iconClass, cssClass, order, referenceId, etc.)
        parentId: null,
        children: activeItem.children || [],
      };
      
      if (siblingIndex === -1) {
        // If sibling not found in root, just add to root
        return [...rootItems, newRootItem, ...nestedItems];
      }
      
      // Insert active item at sibling's position (before sibling)
      const newRootItems = [...rootItems];
      newRootItems.splice(siblingIndex, 0, newRootItem);
      
      return [...newRootItems, ...nestedItems];
    };

    // Step 1: Remove active item from old location
    let newTree = removeItem(treeItems);
    
    // Step 2: Reorder, move to root, or move to child
    if (shouldReorder) {
      // Reorder: Insert active item at over item's position
      // Use targetParentId from projected depth calculation
      newTree = reorderInParent(newTree, targetParentId, activeItem);
    } else if (shouldMoveToRoot) {
      // Move to root: Make active item a root item (sibling of over item)
      // Use overItem.id as reference for positioning
      newTree = moveToRoot(newTree, overItem.id);
    } else {
      // Move active item to be a child of target parent (create parent-child relationship)
      // Use targetParentId from projected depth calculation
      if (!targetParentId) {
        // Fallback: use overItem as parent if targetParentId is null but targetDepth > 0
        if (targetDepth > 0) {
          targetParentId = overItem.id;
        } else {
          // Should not happen, but handle gracefully
          showToast('Không thể xác định vị trí đích', 'error');
          return;
        }
      }
      
      newTree = addItemAsChild(newTree, targetParentId);
    }
    
    // ✅ FIX: Recalculate order for all items preserving ALL properties
    // IMPORTANT: Order is relative to parent, not global
    // Each parent's children start at order 0
    const recalculateOrder = (items: MenuItem[], startOrder: number = 0): { items: MenuItem[]; nextOrder: number } => {
      let currentOrder = startOrder;
      const orderedItems = items.map((item) => {
        const order = currentOrder++;
        // Children always start at order 0 relative to their parent
        const result = recalculateOrder(item.children || [], 0);
        // Don't increment currentOrder for children - they have their own sequence
        return {
          ...item, // ✅ PRESERVE ALL PROPERTIES
          order, // Only update order field
          children: result.items,
        };
      });
      
      return { items: orderedItems, nextOrder: currentOrder };
    };

    const { items: orderedTree } = recalculateOrder(newTree);
    
    // FIX: Save snapshot before optimistic update for rollback on failure
    previousTreeSnapshot.current = JSON.parse(JSON.stringify(treeItems));
    
    setTreeItems(orderedTree);

    // Debounce save
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(async () => {
      await saveStructure(orderedTree);
    }, 500);

    setSaveTimeout(timeout);
  };

  const saveStructure = async (tree: MenuItem[]) => {
    setSaving(true);
    try {
      const structure = treeToStructure(tree);
      
      const response = await fetch(`/api/admin/menus/${menuId}/structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(structure),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save structure');
      }

      showToast('Đã lưu cấu trúc menu', 'success');
      await onRefresh?.();
    } catch (err: any) {
      console.error('Error saving structure:', err);
      
      // FIX: Rollback to previous state on API failure
      if (previousTreeSnapshot.current.length > 0) {
        setTreeItems(JSON.parse(JSON.stringify(previousTreeSnapshot.current)));
        showToast('Lưu thất bại, đã hoàn tác thay đổi', 'error');
      } else {
        showToast(err.message || 'Không thể lưu cấu trúc menu', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete?.(id);
      showToast('Xóa menu item thành công', 'success');
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || 'Không thể xóa menu item', 'error');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const response = await fetch(`/api/admin/menu-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update menu item');
      }

      showToast('Cập nhật menu item thành công', 'success');
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || 'Không thể cập nhật menu item', 'error');
      throw err;
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/menu-items/${id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to duplicate menu item');
      }

      showToast('Nhân bản menu item thành công', 'success');
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || 'Không thể nhân bản menu item', 'error');
      throw err;
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="Chưa có menu item nào"
        description="Bắt đầu bằng cách thêm menu item đầu tiên vào menu này."
        icon="📋"
      />
    );
  }

  // ✅ FIX: Memoize flattened items to prevent infinite re-renders
  // Use ref to track previous treeItems and only recalculate when actually changed
  const previousTreeItemsRef = useRef<string>('');
  const allFlatItemsRef = useRef<MenuItem[]>([]);
  
  // Calculate items key for comparison (only structure, not full object)
  const treeItemsKey = treeItems.length > 0 
    ? treeItems.map(item => ({ id: item.id, parentId: item.parentId, order: item.order })).join('|')
    : '';
  
  // Only recalculate if treeItems actually changed
  if (previousTreeItemsRef.current !== treeItemsKey) {
    previousTreeItemsRef.current = treeItemsKey;
    allFlatItemsRef.current = flattenTree(treeItems);
  }
  
  const allFlatItems = allFlatItemsRef.current;
  
  const activeItem = activeId
    ? allFlatItems.find((item) => item.id === activeId)
    : null;

  // Get all item IDs for SortableContext (must include all nested items)
  const allItemIds = useMemo(() => allFlatItems.map((item) => item.id), [allFlatItems]);

  return (
    <div className="space-y-4">
      {saving && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang lưu cấu trúc...</span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* FIX: verticalListSortingStrategy works for nested structures when combined with proper 
            depth calculation and throttled updates. Flickering is minimized by:
            1. Fixed dragOffset calculation (Lỗi 1)
            2. React.memo for SortableMenuItem (Lỗi 4)
            3. Throttled projectedPosition updates (Lỗi 4)
            4. Proper tree-based parent detection (Lỗi 3)
            Custom collision detection would add complexity without significant benefit. */}
        <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
        <NestedMenuItems
          items={treeItems}
          allItems={allFlatItems}
          expandedItems={expandedItems}
          onToggleExpand={toggleExpand}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onDuplicate={handleDuplicate}
          depth={0}
          menuId={menuId}
          projectedPosition={projectedPosition}
          activeItemHeight={activeItemHeight}
        />
        </SortableContext>

        <DragOverlay>
          {activeItem ? (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-white shadow-lg opacity-90">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{activeItem.title}</span>
              <Badge className={TYPE_COLORS[activeItem.type]} variant="secondary">
                {TYPE_LABELS[activeItem.type]}
              </Badge>
              {activeItem.children && activeItem.children.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{(() => {
                    // Count all descendants recursively without creating new array
                    const countDescendants = (item: MenuItem): number => {
                      if (!item.children || item.children.length === 0) return 0;
                      return item.children.length + item.children.reduce((sum, child) => sum + countDescendants(child), 0);
                    };
                    return countDescendants(activeItem);
                  })()} items
                </Badge>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

