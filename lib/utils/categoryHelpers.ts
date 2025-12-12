/**
 * Category Helper Functions
 * 
 * Utility functions for category management:
 * - Slug generation with uniqueness check
 * - Circular reference detection
 * - Tree structure building
 * - Descendant retrieval
 */

import { getCollections, ObjectId } from '@/lib/db';
import { generateSlug } from './slug';

/**
 * Generate unique slug from name
 * Auto-adds suffix (-1, -2, etc.) if slug already exists
 * 
 * @param name - Category name
 * @param existingSlugs - Array of existing slugs to check against
 * @param excludeId - Category ID to exclude from check (for updates)
 * @returns Unique slug
 */
export async function generateUniqueSlug(
  name: string,
  existingSlugs: string[] = [],
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(name);
  
  // If no existing slugs provided, fetch from database
  if (existingSlugs.length === 0) {
    const { categories } = await getCollections();
    const query: any = { slug: { $regex: `^${baseSlug}(-\\d+)?$` } };
    
    if (excludeId && ObjectId.isValid(excludeId)) {
      query._id = { $ne: new ObjectId(excludeId) };
    }
    
    const existing = await categories.find(query).toArray();
    existingSlugs = existing.map(cat => cat.slug);
  }
  
  // Check if base slug is available
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  // Find next available suffix
  let suffix = 1;
  let uniqueSlug = `${baseSlug}-${suffix}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    suffix++;
    uniqueSlug = `${baseSlug}-${suffix}`;
  }
  
  return uniqueSlug;
}

/**
 * Get all descendant category IDs (recursive)
 * Used for circular reference checking
 * 
 * @param categoryId - Parent category ID
 * @returns Array of descendant category IDs (including nested children)
 */
export async function getCategoryDescendants(categoryId: string): Promise<string[]> {
  const { categories } = await getCollections();
  const descendants: string[] = [];
  
  // Recursive function to get all children
  async function getChildren(parentId: string) {
    const children = await categories
      .find({ parentId: parentId, deletedAt: null })
      .toArray();
    
    for (const child of children) {
      const childId = child._id.toString();
      descendants.push(childId);
      // Recursively get children of children
      await getChildren(childId);
    }
  }
  
  await getChildren(categoryId);
  return descendants;
}

/**
 * Check if setting newParentId would create a circular reference
 * 
 * @param categoryId - Category being updated (empty string for new categories)
 * @param newParentId - Proposed new parent ID
 * @returns true if circular reference would occur
 */
export async function checkCircularReference(
  categoryId: string,
  newParentId: string | null
): Promise<boolean> {
  // If no parent, no circular reference
  if (!newParentId) {
    return false;
  }
  
  // Cannot be parent of itself (only check if categoryId is provided)
  if (categoryId && categoryId === newParentId) {
    return true;
  }
  
  // For new categories, check if newParentId is a descendant of any category
  // For existing categories, get all descendants of categoryId
  if (categoryId) {
    const descendants = await getCategoryDescendants(categoryId);
    // If newParentId is a descendant, it would create circular reference
    return descendants.includes(newParentId);
  }
  
  // For new categories, no circular reference possible (category doesn't exist yet)
  return false;
}

/**
 * Build tree structure from flat category list
 * Supports both MongoDB format (_id) and MappedCategory format (id)
 * 
 * @param flatList - Flat array of categories
 * @returns Tree structure with nested children arrays
 */
export function buildCategoryTree<T extends { _id?: any; id?: string; parentId?: string | null }>(
  flatList: T[]
): Array<T & { children: Array<T & { children: any[] }> }> {
  // Create a map for quick lookup
  const categoryMap = new Map<string, T & { children: any[] }>();
  const roots: Array<T & { children: any[] }> = [];
  
  // Helper to get category ID (supports both _id and id)
  const getCategoryId = (category: T): string => {
    if (category._id) {
      return category._id.toString();
    }
    if (category.id) {
      return category.id;
    }
    throw new Error('Category must have either _id or id');
  };
  
  // First pass: create all nodes
  flatList.forEach(category => {
    const categoryId = getCategoryId(category);
    categoryMap.set(categoryId, {
      ...category,
      children: []
    });
  });
  
  // Second pass: build tree structure
  flatList.forEach(category => {
    const categoryId = getCategoryId(category);
    const node = categoryMap.get(categoryId);
    
    if (!node) return;
    
    const parentId = category.parentId;
    
    if (!parentId) {
      // Root category
      roots.push(node);
    } else {
      // Child category - find parent
      const parent = categoryMap.get(parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found in list, treat as root
        roots.push(node);
      }
    }
  });
  
  // Sort roots and children by position
  const sortByPosition = (a: any, b: any) => {
    const posA = a.position || 0;
    const posB = b.position || 0;
    if (posA !== posB) return posA - posB;
    return a.name.localeCompare(b.name);
  };
  
  const sortTree = (nodes: any[]) => {
    nodes.sort(sortByPosition);
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children);
      }
    });
  };
  
  sortTree(roots);
  
  return roots;
}

/**
 * Get category count (number of products in this category)
 * 
 * @param categoryId - Category ID
 * @returns Product count
 */
export async function getCategoryCount(categoryId: string): Promise<number> {
  const { products } = await getCollections();
  
  // Count products where category matches (exact match or in categories array)
  const count = await products.countDocuments({
    $or: [
      { category: categoryId },
      { categories: categoryId }
    ],
    deletedAt: null // Only count non-deleted products
  });
  
  return count;
}

