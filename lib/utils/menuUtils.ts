/**
 * Menu Utility Functions
 * 
 * Functions for menu operations: dynamic link resolution, reference validation, etc.
 */

import { getCollections, ObjectId } from '@/lib/db';

export interface MenuItemReference {
  id: string;
  name: string;
  slug: string;
  url: string;
  exists: boolean;
  active: boolean;
}

/**
 * ✅ PERFORMANCE: Batch resolve menu item links
 * Gộp tất cả các referenceId theo type và query một lần với $in để tránh N+1 queries
 * 
 * @param items - Array of menu items to resolve
 * @returns Map of referenceId -> resolved link data
 */
export async function resolveMenuItemLinksBatch(
  items: Array<{
    type: 'custom' | 'category' | 'page' | 'product' | 'post';
    url?: string | null;
    referenceId?: ObjectId | string | null;
    title?: string | null;
  }>
): Promise<Map<string, { url: string; title: string; exists: boolean; active: boolean }>> {
  const { categories, products, posts } = await getCollections();
  const resultMap = new Map<string, { url: string; title: string; exists: boolean; active: boolean }>();
  
  // Group items by type
  const categoryIds: ObjectId[] = [];
  const productIds: ObjectId[] = [];
  const pageIds: ObjectId[] = [];
  const postIds: ObjectId[] = [];
  const customItems: Array<{ key: string; item: typeof items[0] }> = [];
  
  items.forEach((item, index) => {
    const key = `${item.type}-${item.referenceId || index}`;
    
    if (item.type === 'custom') {
      customItems.push({ key, item });
      return;
    }
    
    if (!item.referenceId) {
      resultMap.set(key, {
        url: '#',
        title: item.title || 'Untitled',
        exists: false,
        active: false,
      });
      return;
    }
    
    const referenceId = typeof item.referenceId === 'string'
      ? new ObjectId(item.referenceId)
      : item.referenceId;
    
    switch (item.type) {
      case 'category':
        categoryIds.push(referenceId);
        break;
      case 'product':
        productIds.push(referenceId);
        break;
      case 'page':
        pageIds.push(referenceId);
        break;
      case 'post':
        postIds.push(referenceId);
        break;
    }
  });
  
  // Batch query categories
  if (categoryIds.length > 0) {
    const categoryDocs = await categories.find({
      _id: { $in: categoryIds },
    }).toArray();
    
    const categoryMap = new Map(
      categoryDocs.map(cat => [cat._id.toString(), cat])
    );
    
    items.forEach((item, index) => {
      if (item.type === 'category' && item.referenceId) {
        const key = `${item.type}-${item.referenceId}`;
        const referenceId = typeof item.referenceId === 'string'
          ? item.referenceId
          : item.referenceId.toString();
        const category = categoryMap.get(referenceId);
        
        if (!category) {
          resultMap.set(key, {
            url: '#',
            title: item.title || 'Category not found',
            exists: false,
            active: false,
          });
        } else {
          const isActive = category.status === 'active' && !category.deletedAt;
          resultMap.set(key, {
            url: `/products?category=${category.slug}`,
            title: item.title || category.name,
            exists: true,
            active: isActive,
          });
        }
      }
    });
  }
  
  // Batch query products
  if (productIds.length > 0) {
    const productDocs = await products.find({
      _id: { $in: productIds },
    }).toArray();
    
    const productMap = new Map(
      productDocs.map(prod => [prod._id.toString(), prod])
    );
    
    items.forEach((item, index) => {
      if (item.type === 'product' && item.referenceId) {
        const key = `${item.type}-${item.referenceId}`;
        const referenceId = typeof item.referenceId === 'string'
          ? item.referenceId
          : item.referenceId.toString();
        const product = productMap.get(referenceId);
        
        if (!product) {
          resultMap.set(key, {
            url: '#',
            title: item.title || 'Product not found',
            exists: false,
            active: false,
          });
        } else {
          const isActive = product.status === 'publish' && !product.deletedAt;
          resultMap.set(key, {
            url: `/products/${product.slug}`,
            title: item.title || product.name,
            exists: true,
            active: isActive,
          });
        }
      }
    });
  }
  
  // Batch query pages
  if (pageIds.length > 0) {
    const pageDocs = await posts.find({
      _id: { $in: pageIds },
      type: 'page',
    }).toArray();
    
    const pageMap = new Map(
      pageDocs.map(page => [page._id.toString(), page])
    );
    
    items.forEach((item, index) => {
      if (item.type === 'page' && item.referenceId) {
        const key = `${item.type}-${item.referenceId}`;
        const referenceId = typeof item.referenceId === 'string'
          ? item.referenceId
          : item.referenceId.toString();
        const page = pageMap.get(referenceId);
        
        if (!page) {
          resultMap.set(key, {
            url: '#',
            title: item.title || 'Page not found',
            exists: false,
            active: false,
          });
        } else {
          const isActive = page.status === 'publish';
          resultMap.set(key, {
            url: `/${page.slug}`,
            title: item.title || page.title,
            exists: true,
            active: isActive,
          });
        }
      }
    });
  }
  
  // Batch query posts
  if (postIds.length > 0) {
    const postDocs = await posts.find({
      _id: { $in: postIds },
      type: 'post',
    }).toArray();
    
    const postMap = new Map(
      postDocs.map(post => [post._id.toString(), post])
    );
    
    items.forEach((item, index) => {
      if (item.type === 'post' && item.referenceId) {
        const key = `${item.type}-${item.referenceId}`;
        const referenceId = typeof item.referenceId === 'string'
          ? item.referenceId
          : item.referenceId.toString();
        const post = postMap.get(referenceId);
        
        if (!post) {
          resultMap.set(key, {
            url: '#',
            title: item.title || 'Post not found',
            exists: false,
            active: false,
          });
        } else {
          const isActive = post.status === 'publish';
          resultMap.set(key, {
            url: `/blog/${post.slug}`,
            title: item.title || post.title,
            exists: true,
            active: isActive,
          });
        }
      }
    });
  }
  
  // Handle custom items
  customItems.forEach(({ key, item }) => {
    resultMap.set(key, {
      url: item.url || '#',
      title: item.title || 'Untitled',
      exists: true,
      active: true,
    });
  });
  
  return resultMap;
}

/**
 * Resolve dynamic link for a menu item (single item - backward compatibility)
 * Returns the URL and title based on the item's type and reference
 * 
 * @deprecated Use resolveMenuItemLinksBatch for multiple items to avoid N+1 queries
 */
export async function resolveMenuItemLink(
  item: {
    type: 'custom' | 'category' | 'page' | 'product' | 'post';
    url?: string | null;
    referenceId?: ObjectId | string | null;
    title?: string | null;
  }
): Promise<{ url: string; title: string; exists: boolean; active: boolean }> {
  const { categories, products, posts } = await getCollections();
  
  // Custom link - use URL directly
  if (item.type === 'custom') {
    return {
      url: item.url || '#',
      title: item.title || 'Untitled',
      exists: true,
      active: true,
    };
  }
  
  // Need referenceId for non-custom items
  if (!item.referenceId) {
    return {
      url: '#',
      title: item.title || 'Untitled',
      exists: false,
      active: false,
    };
  }
  
  const referenceId = typeof item.referenceId === 'string'
    ? new ObjectId(item.referenceId)
    : item.referenceId;
  
  // Resolve based on type
  switch (item.type) {
    case 'category': {
      const category = await categories.findOne({ _id: referenceId });
      if (!category) {
        return {
          url: '#',
          title: item.title || 'Category not found',
          exists: false,
          active: false,
        };
      }
      
      // Check if category is active
      const isActive = category.status === 'active' && !category.deletedAt;
      
      return {
        url: `/products?category=${category.slug}`,
        title: item.title || category.name,
        exists: true,
        active: isActive,
      };
    }
    
    case 'product': {
      const product = await products.findOne({ _id: referenceId });
      if (!product) {
        return {
          url: '#',
          title: item.title || 'Product not found',
          exists: false,
          active: false,
        };
      }
      
      // Check if product is active
      const isActive = product.status === 'publish' && !product.deletedAt;
      
      return {
        url: `/products/${product.slug}`,
        title: item.title || product.name,
        exists: true,
        active: isActive,
      };
    }
    
    case 'page': {
      // Pages are stored in posts collection with type = 'page'
      const page = await posts.findOne({
        _id: referenceId,
        type: 'page',
      });
      if (!page) {
        return {
          url: '#',
          title: item.title || 'Page not found',
          exists: false,
          active: false,
        };
      }
      
      // Check if page is active
      const isActive = page.status === 'publish';
      
      return {
        url: `/${page.slug}`,
        title: item.title || page.title,
        exists: true,
        active: isActive,
      };
    }
    
    case 'post': {
      const post = await posts.findOne({
        _id: referenceId,
        type: 'post',
      });
      if (!post) {
        return {
          url: '#',
          title: item.title || 'Post not found',
          exists: false,
          active: false,
        };
      }
      
      // Check if post is active
      const isActive = post.status === 'publish';
      
      return {
        url: `/blog/${post.slug}`,
        title: item.title || post.title,
        exists: true,
        active: isActive,
      };
    }
    
    default:
      return {
        url: '#',
        title: item.title || 'Unknown',
        exists: false,
        active: false,
      };
  }
}

/**
 * Validate max depth for menu structure
 * Returns true if depth is valid (max 3 levels: 0, 1, 2)
 */
export async function validateMenuDepth(
  menuItems: any,
  itemId: ObjectId,
  newParentId: ObjectId | null
): Promise<{ valid: boolean; depth: number; error?: string }> {
  if (!newParentId) {
    return { valid: true, depth: 0 };
  }
  
  // Get depth of parent
  let depth = 0;
  let currentParentId: ObjectId | null = newParentId;
  
  while (currentParentId) {
    const parent: any = await menuItems.findOne({ _id: currentParentId });
    if (!parent) {
      break;
    }
    depth++;
    if (depth >= 3) {
      return {
        valid: false,
        depth,
        error: 'Maximum depth exceeded (max 3 levels)',
      };
    }
    currentParentId = parent.parentId as ObjectId | null;
  }
  
  return { valid: true, depth };
}

/**
 * Check if a reference exists and is active
 */
export async function checkReferenceStatus(
  type: 'category' | 'page' | 'product' | 'post',
  referenceId: ObjectId | string
): Promise<{ exists: boolean; active: boolean }> {
  const { categories, products, posts } = await getCollections();
  
  const id = typeof referenceId === 'string' ? new ObjectId(referenceId) : referenceId;
  
  switch (type) {
    case 'category': {
      const category = await categories.findOne({ _id: id });
      if (!category) {
        return { exists: false, active: false };
      }
      return {
        exists: true,
        active: category.status === 'active' && !category.deletedAt,
      };
    }
    
    case 'product': {
      const product = await products.findOne({ _id: id });
      if (!product) {
        return { exists: false, active: false };
      }
      return {
        exists: true,
        active: product.status === 'publish' && !product.deletedAt,
      };
    }
    
    case 'page': {
      const page = await posts.findOne({ _id: id, type: 'page' });
      if (!page) {
        return { exists: false, active: false };
      }
      return {
        exists: true,
        active: page.status === 'publish',
      };
    }
    
    case 'post': {
      const post = await posts.findOne({ _id: id, type: 'post' });
      if (!post) {
        return { exists: false, active: false };
      }
      return {
        exists: true,
        active: post.status === 'publish',
      };
    }
    
    default:
      return { exists: false, active: false };
  }
}

