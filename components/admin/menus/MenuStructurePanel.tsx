'use client';

import { useState, useCallback, useEffect, useRef, memo } from 'react';
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
  title: string;
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
 * Convert flat items array to nested tree structure
 */
function buildTree(items: MenuItem[]): MenuItem[] {
  const itemMap = new Map<string, MenuItem>();
  const rootItems: MenuItem[] = [];

  // Create map of all items
  items.forEach((item) => {
    itemMap.set(item.id, { ...item, children: [] });
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

  // Sort by order
  const sortByOrder = (items: MenuItem[]): MenuItem[] => {
    return items
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        ...item,
        children: item.children ? sortByOrder(item.children) : [],
      }));
  };

  return sortByOrder(rootItems);
}

/**
 * Flatten tree structure to flat array
 */
function flattenTree(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];
  items.forEach((item) => {
    result.push(item);
    if (item.children && item.children.length > 0) {
      result.push(...flattenTree(item.children));
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
    await onUpdate?.(item.id, updates);
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
        
        // #region agent log
        if (isHoveringOverItem) {
          fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:476',message:'Placeholder check',data:{itemId:item.id,itemTitle:item.title,depth,projectedDepth,isExpanded,isHoveringOverItem},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        }
        // #endregion
        
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
        
        // #region agent log
        if (isHoveringOverItem) {
          fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:490',message:'Placeholder decision',data:{showPlaceholderAtItem,projectedDepth,depth,isExpanded,condition1:projectedDepth===depth,condition2:projectedDepth===depth+1&&isExpanded,condition3:projectedDepth>depth&&depth===projectedDepth-1&&isExpanded},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        }
        // #endregion

        return (
          <div key={item.id} className="relative">
            {/* Show placeholder before item if this is the target position */}
            {/* FIX: Always use projectedDepth for placeholder indentation (now updated immediately) */}
            {showPlaceholderAtItem && projectedPosition && (
              <>
                {/* #region agent log */}
                {(() => {
                  fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:504',message:'Rendering DragPlaceholder at item',data:{itemId:item.id,itemTitle:item.title,depth,projectedDepth:projectedPosition.depth,isHoveringOverItem,showPlaceholderAtItem},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
                  return null;
                })()}
                {/* #endregion */}
                <DragPlaceholder 
                  depth={projectedPosition.depth} 
                  isInvalid={projectedPosition.isInvalid}
                  itemHeight={placeholderHeight}
                />
              </>
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
                  <>
                    {/* #region agent log */}
                    {(() => {
                      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:533',message:'Rendering DragPlaceholder in children area',data:{parentItemId:item.id,parentItemTitle:item.title,depth,projectedDepth:projectedPosition.depth,overId:projectedPosition.overId,condition1:projectedPosition.overId===item.id,condition2:projectedPosition.depth===depth+1},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
                      return null;
                    })()}
                    {/* #endregion */}
                    <DragPlaceholder 
                      depth={projectedPosition.depth} 
                      isInvalid={projectedPosition.isInvalid}
                      itemHeight={activeItemHeight}
                    />
                  </>
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
  const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null);
  const [activeItemHeight, setActiveItemHeight] = useState<number>(60); // Default height

  // Build tree structure from flat items
  useEffect(() => {
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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:628',message:'handleDragOver entry',data:{activeId:active.id,overId:over?.id||null,deltaX:delta?.x||null,deltaY:delta?.y||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:650',message:'Items found',data:{overItemFound:!!overItem,activeItemFound:!!activeItem,overItemId:overItem?.id||null,activeItemId:activeItem?.id||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:660',message:'Depths calculated',data:{overDepth,activeDepth,overItemId:overItem.id,activeItemId:activeItem.id,overItemTitle:overItem.title,activeItemTitle:activeItem.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // FIX: Calculate projected depth based on activeDepth (item being dragged) instead of overDepth
    // This prevents "jumpy" behavior when mouse moves over items with different depths
    // The depth should only change based on horizontal movement (delta X), not which item is under cursor
    const levelChange = Math.round(delta.x / INDENTATION_WIDTH);
    let projectedDepth = activeDepth + levelChange;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:666',message:'Before clamp',data:{levelChange,projectedDepthBeforeClamp:projectedDepth,deltaX:delta.x,indentationWidth:INDENTATION_WIDTH},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Clamp projected depth with constraints
    // 1. Cannot be less than 0 (root level)
    projectedDepth = Math.max(0, projectedDepth);
    
    // 2. Cannot exceed MAX_DEPTH
    projectedDepth = Math.min(MAX_DEPTH - 1, projectedDepth);
    
    // 3. Cannot be greater than (over item's depth + 1)
    // This ensures we can't create orphaned items - item can't be deeper than child of item under cursor
    const maxDepth = overDepth + 1;
    const projectedDepthBeforeMaxClamp = projectedDepth;
    projectedDepth = Math.min(projectedDepth, maxDepth);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:678',message:'After clamp',data:{projectedDepthBeforeMaxClamp,maxDepth,projectedDepthAfterClamp:projectedDepth,overDepth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // 4. If moving left (un-nesting), cannot go below 0
    if (levelChange < 0) {
      projectedDepth = Math.max(0, projectedDepth);
    }

    // Check if projected position is invalid (exceeds max depth)
    const isInvalid = projectedDepth >= MAX_DEPTH;
    
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:735',message:'Auto-expand trigger',data:{projectedDepth,overDepth,overItemId:over.id,isExpanded:expandedItems.has(over.id as string),delay:COLLAPSED_EXPAND_DELAY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      setTimeout(() => {
        if (activeId === active.id) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:740',message:'Auto-expand executed',data:{overItemId:over.id,stillActive:activeId === active.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          setExpandedItems((prev) => new Set([...prev, over.id as string]));
        }
      }, COLLAPSED_EXPAND_DELAY);
    }

    // Auto-scroll when near edges
    handleAutoScroll(event);
  };
  
  // Auto-scroll handler
  const handleAutoScroll = useCallback((event: DragOverEvent) => {
    if (!event.delta) return;
    
    // Clear existing interval
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
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

    let scrollInterval: NodeJS.Timeout | null = null;

    if (distanceFromTop < AUTO_SCROLL_THRESHOLD && viewport.top > 0) {
      // Scroll up
      scrollInterval = setInterval(() => {
        if (window.scrollY > 0) {
          window.scrollBy(0, -AUTO_SCROLL_SPEED);
        } else {
          clearInterval(scrollInterval!);
        }
      }, 16); // ~60fps
      setAutoScrollInterval(scrollInterval);
    } else if (distanceFromBottom < AUTO_SCROLL_THRESHOLD) {
      // Scroll down
      scrollInterval = setInterval(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY < maxScroll) {
          window.scrollBy(0, AUTO_SCROLL_SPEED);
        } else {
          clearInterval(scrollInterval!);
        }
      }, 16);
      setAutoScrollInterval(scrollInterval);
    }
  }, [autoScrollInterval]);
  
  // Cleanup auto-scroll on drag end
  useEffect(() => {
    if (!activeId && autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }
  }, [activeId, autoScrollInterval]);

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
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval);
      setAutoScrollInterval(null);
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:703',message:'handleDragEnd entry',data:{activeId:active.id,overIdFromEvent:over?.id||null,projectedOverId:savedProjectedPosition?.overId||null,targetOverId,projectedDepth:savedProjectedPosition?.depth||null,savedDragOffsetX:savedDragOffset?.x||null},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'K'})}).catch(()=>{});
    // #endregion

    if (!targetOverId || !savedProjectedPosition) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:715',message:'Early return: no over or no projected position',data:{targetOverId,activeId:active.id,hasProjectedPosition:!!savedProjectedPosition},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:900',message:'Adjusting target item - dragging at current position, using item above',data:{originalOverItemId:targetOverId,originalOverItemTitle:overItem?.title||'N/A',newOverItemId:itemAbove.id,newOverItemTitle:itemAbove.title,activeItemIndex,activeDepth,itemAboveDepth,dragOffsetX:savedDragOffset.x,projectedDepth:savedProjectedPosition?.depth||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'K'})}).catch(()=>{});
          // #endregion
          overItem = itemAbove;
          // Force targetDepth to be activeDepth + 1 (create child)
          // We'll set this later after calculating targetDepth from savedProjectedPosition
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:900',message:'Cannot create child - max depth reached',data:{activeItemId:active.id,activeItemIndex,activeDepth,itemAboveDepth,dragOffsetX:savedDragOffset.x},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'K'})}).catch(()=>{});
          // #endregion
          // Cannot create child - return early
          return;
        }
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:900',message:'No item above found - cannot create child at current position',data:{activeItemId:active.id,activeItemIndex,activeDepth,dragOffsetX:savedDragOffset.x,projectedDepth:savedProjectedPosition?.depth||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
        // If no item above found, cannot create child - return early
        return;
      }
    } else if (active.id === targetOverId) {
      // If dragging at current position but not creating child (dragOffsetX <= 0),
      // return early (no action needed)
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:900',message:'Early return: dragging at current position but not creating child',data:{activeId:active.id,projectedDepth:savedProjectedPosition?.depth||0,dragOffsetX:savedDragOffset?.x||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:900',message:'Adjusting target item - using root item above',data:{originalOverItemId:targetOverId,originalOverItemTitle:overItem.title,newOverItemId:targetRootItem.id,newOverItemTitle:targetRootItem.title,activeItemIndex,overItemIndex,currentRootIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'J'})}).catch(()=>{});
          // #endregion
          overItem = targetRootItem;
        }
      }
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:543',message:'Found items',data:{activeItem:activeItem?{id:activeItem.id,parentId:activeItem.parentId,title:activeItem.title}:null,overItem:overItem?{id:overItem.id,parentId:overItem.parentId,title:overItem.title}:null,allFlatItemsCount:allFlatItems.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!activeItem || !overItem) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:545',message:'Early return: items not found',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }

    // Check depth limits
    const activeDepth = getItemDepth(activeItem, allFlatItems);
    const overDepth = getItemDepth(overItem, allFlatItems);

    // Don't allow moving into level 3 (depth >= 2)
    if (overDepth >= 2) {
      showToast('Không thể di chuyển vào cấp này (đã đạt độ sâu tối đa)', 'error');
      return;
    }

    // Don't allow moving level 3 items (depth >= 2)
    if (activeDepth >= 2) {
      showToast('Không thể di chuyển item ở cấp này (đã đạt độ sâu tối đa)', 'error');
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:1029',message:'Force targetDepth to create child at current position',data:{originalTargetDepth:savedProjectedPosition.depth,newTargetDepth:targetDepth,activeDepth:activeDepthForCheck,overItemId:overItem.id,overItemTitle:overItem.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'K'})}).catch(()=>{});
      // #endregion
    }
    
    // FIX: When dragging a child item (activeDepth > 0) onto its current parent (overItem.id === activeItem.parentId),
    // and overItem is root (overDepth === 0), force targetDepth to 0 to move to root
    // This handles the case where user drags a child item onto its parent root item to move it to root level
    // This check must happen BEFORE the dragOffset check to ensure it takes priority
    if (overDepth === 0 && activeDepth > 0 && overItem.id === activeItem.parentId) {
      targetDepth = 0;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:909',message:'Force move to root - dragging child onto its parent',data:{originalTargetDepth:savedProjectedPosition.depth,newTargetDepth:0,overDepth,activeDepth,overItemId:overItem.id,activeItemParentId:activeItem.parentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
    }
    // FIX: When dragging a child item (activeDepth > 0) onto a different root item (overDepth === 0),
    // and projectedDepth is 1 (would become child), but user likely wants to move to root (sibling of overItem)
    // Check if savedDragOffset indicates left movement (negative or small positive)
    else if (overDepth === 0 && activeDepth > 0 && targetDepth === 1 && overItem.id !== activeItem.parentId) {
      // If dragOffset is negative or very small positive (< 15px), treat as moving to root
      const dragOffsetX = savedDragOffset?.x ?? 0;
      if (dragOffsetX < 15) {
        targetDepth = 0;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:920',message:'Force move to root - dragging child onto different root with left movement',data:{originalTargetDepth:savedProjectedPosition.depth,newTargetDepth:0,dragOffsetX,overDepth,activeDepth,overItemId:overItem.id,activeItemParentId:activeItem.parentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      }
    }
    
    // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:936',message:'Target parent calculation start',data:{targetDepth,overDepth,activeDepth,overItemId:overItem.id,overItemTitle:overItem.title,activeItemId:activeItem.id,activeItemTitle:activeItem.title,overItemParentId:overItem.parentId,activeItemParentId:activeItem.parentId,dragOffsetX:savedDragOffset?.x??null,projectedDepth:savedProjectedPosition.depth},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    
    // FIX: Use tree structure and depth comparison instead of look-back in flat array
    // This is more reliable during drag operations
    let targetParentId: string | null = null;
    
    if (targetDepth === 0) {
      // Moving to root level
      targetParentId = null;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:870',message:'Moving to root',data:{targetParentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    } else if (targetDepth > overDepth) {
      // Item will become a child of overItem
      targetParentId = overItem.id;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:873',message:'Becoming child of overItem',data:{targetParentId,targetDepth,overDepth,overItemId:overItem.id,overItemTitle:overItem.title,activeItemId:activeItem.id,activeItemTitle:activeItem.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
    } else if (targetDepth === overDepth) {
      // Item will be a sibling of overItem, same parent
      targetParentId = overItem.parentId;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:877',message:'Same level sibling',data:{targetParentId,overItemParentId:overItem.parentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
          if (current.parentId) {
            current = allItems.find((i) => i.id === current.parentId) || null;
          } else {
            break;
          }
        }
        
        return null;
      };
      
      const allItemsFlat = flattenTree(treeItems);
      const parentAtTargetDepth = findParentAtDepth(overItem, targetDepth - 1, allItemsFlat);
      targetParentId = parentAtTargetDepth?.id || null;
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:910',message:'Finding ancestor parent',data:{targetDepth,targetParentDepth:targetDepth-1,parentAtTargetDepthFound:!!parentAtTargetDepth,parentAtTargetDepthId:parentAtTargetDepth?.id||null,overItemId:overItem.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // Fallback: if still not found, use overItem's parent
      if (!targetParentId && overItem.parentId) {
        targetParentId = overItem.parentId;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:913',message:'Using fallback parent',data:{targetParentId,overItemParentId:overItem.parentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:916',message:'Target parent final',data:{targetParentId,targetDepth,overDepth},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Determine action based on target depth and current state
    const activeParentId = activeItem.parentId;
    const overParentId = overItem.parentId;
    const areSiblings = targetDepth === 0 && activeParentId === null;
    const isAlreadyChild = activeParentId === targetParentId;
    const shouldMoveToRoot = targetDepth === 0 && activeParentId !== null;
    const shouldReorder = areSiblings || (isAlreadyChild && targetParentId !== null);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:920',message:'Action decision',data:{activeParentId,overParentId,targetDepth,targetParentId,areSiblings,isAlreadyChild,shouldMoveToRoot,shouldReorder,activeItemId:activeItem.id,activeItemTitle:activeItem.title,overItemId:overItem.id,overItemTitle:overItem.title,action:shouldReorder?'reorder':shouldMoveToRoot?'moveToRoot':'addAsChild'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
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

    // Remove active item from old location
    const removeItem = (items: MenuItem[]): MenuItem[] => {
      return items
        .filter((item) => item.id !== active.id)
        .map((item) => ({
          ...item,
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
        newRootItems.splice(insertIndex, 0, { ...itemToInsert, parentId: null, children: activeItem.children || [] });
        
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
              newChildren.splice(insertIndex, 0, { ...itemToInsert, parentId, children: activeItem.children || [] });
              return { ...item, children: newChildren };
            }
          }
          return {
            ...item,
            children: item.children ? reorderInParent(item.children, parentId, itemToInsert) : [],
          };
        });
      }
    };

    // Add active item as child of over item
    const addItemAsChild = (items: MenuItem[], targetId: string): MenuItem[] => {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:1069',message:'addItemAsChild entry',data:{targetId,activeItemId:activeItem.id,activeItemTitle:activeItem.title,activeItemParentId:activeItem.parentId,itemsCount:items.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      return items.map((item) => {
        if (item.id === targetId) {
          const oldChildrenCount = item.children?.length || 0;
          const newChildren = item.children ? [...item.children, { ...activeItem, parentId: targetId, children: activeItem.children || [] }] : [{ ...activeItem, parentId: targetId, children: activeItem.children || [] }];
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:1076',message:'addItemAsChild found target',data:{targetId,itemId:item.id,itemTitle:item.title,oldChildrenCount,newChildrenCount:newChildren.length,activeItemId:activeItem.id,activeItemTitle:activeItem.title,activeItemNewParentId:targetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          
          return {
            ...item,
            children: newChildren,
          };
        }
        // FIX: Only recurse into children if they exist and are not empty
        // This prevents unnecessary recursive calls with empty arrays
        return {
          ...item,
          children: item.children && item.children.length > 0 ? addItemAsChild(item.children, targetId) : (item.children || []),
        };
      });
    };

    // Move active item to root level (as sibling of over item)
    const moveToRoot = (items: MenuItem[], siblingId: string): MenuItem[] => {
      // Filter root items (items with no parentId)
      const rootItems = items.filter((item) => !item.parentId);
      // Keep nested items as-is (they will be preserved in their parent's children)
      const nestedItems = items.filter((item) => item.parentId);
      
      const siblingIndex = rootItems.findIndex((item) => item.id === siblingId);
      
      // Create new root item with parentId = null and preserve its children
      const newRootItem: MenuItem = {
        ...activeItem,
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
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:706',message:'After removeItem',data:{treeItemsCount:treeItems.length,newTreeCount:newTree.length,removedItemId:active.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Step 2: Reorder, move to root, or move to child
    if (shouldReorder) {
      // Reorder: Insert active item at over item's position
      // Use targetParentId from projected depth calculation
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:1150',message:'Before reorderInParent',data:{targetParentId,overItemId:overItem.id,activeItemId:activeItem.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      newTree = reorderInParent(newTree, targetParentId, activeItem);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:1153',message:'After reorderInParent',data:{newTreeCount:newTree.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } else if (shouldMoveToRoot) {
      // Move to root: Make active item a root item (sibling of over item)
      // Use overItem.id as reference for positioning
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:1157',message:'Before moveToRoot',data:{overItemId:overItem.id,overItemTitle:overItem.title,overItemParentId:overItem.parentId,activeItemId:activeItem.id,activeItemTitle:activeItem.title,activeItemParentId:activeItem.parentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      newTree = moveToRoot(newTree, overItem.id);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:1160',message:'After moveToRoot',data:{newTreeCount:newTree.length,flattenedCount:flattenTree(newTree).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
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
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:960',message:'Before addItemAsChild',data:{targetParentId,targetDepth,overItemId:overItem.id,overItemTitle:overItem.title,activeItemId:activeItem.id,activeItemTitle:activeItem.title,treeItemsCount:newTree.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      
      newTree = addItemAsChild(newTree, targetParentId);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:968',message:'After addItemAsChild',data:{newTreeCount:newTree.length,flattenedCount:flattenTree(newTree).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
    }
    
    // Step 3: Recalculate order for all items
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
          ...item,
          order,
          children: result.items,
        };
      });
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:777',message:'recalculateOrder result',data:{itemsCount:orderedItems.length,startOrder,nextOrder:currentOrder,itemsOrders:orderedItems.map(i=>({id:i.id.substring(0,8),order:i.order,childrenCount:i.children?.length||0}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      return { items: orderedItems, nextOrder: currentOrder };
    };

    const { items: orderedTree } = recalculateOrder(newTree);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:737',message:'Before setTreeItems',data:{orderedTreeCount:orderedTree.length,orderedTreeFlatCount:flattenTree(orderedTree).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
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
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:755',message:'Before API call',data:{structureCount:structure.length,structureJSON:JSON.stringify(structure).substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      const response = await fetch(`/api/admin/menus/${menuId}/structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(structure),
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:765',message:'API response',data:{ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const errorData = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:768',message:'API error',data:{error:errorData.error,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        throw new Error(errorData.error || 'Failed to save structure');
      }

      showToast('Đã lưu cấu trúc menu', 'success');
      await onRefresh?.();
    } catch (err: any) {
      console.error('Error saving structure:', err);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/e2483124-0963-404f-9f5e-ae93dae6b718',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MenuStructurePanel.tsx:775',message:'Save error caught',data:{error:err.message,stack:err.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
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

  const activeItem = activeId
    ? flattenTree(treeItems).find((item) => item.id === activeId)
    : null;

  // Get all item IDs for SortableContext (must include all nested items)
  const allItemIds = flattenTree(treeItems).map((item) => item.id);

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
          allItems={flattenTree(treeItems)}
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
                  +{flattenTree([activeItem]).length - 1} items
                </Badge>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

