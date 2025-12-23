/**
 * WordPress/WooCommerce to MongoDB Migration Script
 * 
 * Migrates products, categories, and orders from WordPress/WooCommerce to MongoDB
 * 
 * Usage: npm run migrate:wordpress-to-mongodb
 * 
 * Prerequisites:
 * - MongoDB connection configured in .env.local
 * - WooCommerce REST API credentials configured in .env.local
 * - Next.js dev server NOT running (to avoid conflicts)
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { wcApi, getMetaValue } from '@/lib/api/woocommerce';
import { connectDB, getCollections, closeDB, ObjectId } from '@/lib/db';
import type { WooCommerceProduct, WooCommerceCategory, WooCommerceOrder, WooCommerceVariation } from '@/types/woocommerce';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface MigrationStats {
  products: {
    fetched: number;
    transformed: number;
    imported: number;
    errors: number;
  };
  categories: {
    fetched: number;
    transformed: number;
    imported: number;
    errors: number;
  };
  orders: {
    fetched: number;
    transformed: number;
    imported: number;
    errors: number;
  };
  variations: {
    fetched: number;
    transformed: number;
    errors: number;
  };
}

const stats: MigrationStats = {
  products: { fetched: 0, transformed: 0, imported: 0, errors: 0 },
  categories: { fetched: 0, transformed: 0, imported: 0, errors: 0 },
  orders: { fetched: 0, transformed: 0, imported: 0, errors: 0 },
  variations: { fetched: 0, transformed: 0, errors: 0 },
};

const errors: Array<{ type: string; id: number | string; error: string }> = [];

/**
 * Transform WooCommerce Product to MongoDB Product format
 */
function transformProduct(wcProduct: WooCommerceProduct, categoryMap: Map<number, string>): any {
  try {
    // Extract ACF fields from meta_data
    const length = getMetaValue(wcProduct.meta_data, 'length') as number | undefined;
    const width = getMetaValue(wcProduct.meta_data, 'width') as number | undefined;
    const height = getMetaValue(wcProduct.meta_data, 'height') as number | undefined;
    const volumetricWeight = getMetaValue(wcProduct.meta_data, 'volumetric_weight') as number | undefined;
    const material = getMetaValue(wcProduct.meta_data, 'material') as string | undefined;
    const origin = getMetaValue(wcProduct.meta_data, 'origin') as string | undefined;

    // Calculate volumetric weight if dimensions provided but not set
    let finalVolumetricWeight = volumetricWeight;
    if (!finalVolumetricWeight && length && width && height) {
      finalVolumetricWeight = (length * width * height) / 6000;
    }

    // Extract price
    const minPrice = parseFloat(wcProduct.price || wcProduct.regular_price || '0');
    const salePrice = wcProduct.sale_price ? parseFloat(wcProduct.sale_price) : undefined;
    const maxPrice = salePrice && salePrice < minPrice ? minPrice : (salePrice || minPrice);

    // Extract images
    const images = wcProduct.images?.map(img => img.src) || [];

    // Extract category (use first category or null)
    const categoryId = wcProduct.categories?.[0]?.id;
    let categoryMongoId: any = undefined;
    if (categoryId) {
      const mongoIdString = categoryMap.get(categoryId);
      if (mongoIdString && ObjectId.isValid(mongoIdString)) {
        categoryMongoId = new ObjectId(mongoIdString);
      } else if (mongoIdString) {
        categoryMongoId = mongoIdString; // Keep as string if not valid ObjectId
      }
    }

    // Extract tags
    const tags = wcProduct.tags?.map(tag => tag.name) || [];

    // Transform product
    const mongoProduct = {
      name: wcProduct.name,
      slug: wcProduct.slug,
      description: wcProduct.description || '',
      shortDescription: wcProduct.short_description || '',
      sku: wcProduct.sku || '',
      minPrice,
      maxPrice,
      images,
      category: categoryMongoId || categoryId?.toString() || undefined,
      tags,
      variants: [], // Will be populated from variations
      isHot: wcProduct.featured || false,
      isActive: wcProduct.status === 'publish',
      status: wcProduct.status === 'publish' ? 'publish' : 'draft',
      length: length || (wcProduct.dimensions?.length ? parseFloat(wcProduct.dimensions.length) : undefined),
      width: width || (wcProduct.dimensions?.width ? parseFloat(wcProduct.dimensions.width) : undefined),
      height: height || (wcProduct.dimensions?.height ? parseFloat(wcProduct.dimensions.height) : undefined),
      weight: wcProduct.weight ? parseFloat(wcProduct.weight) : undefined,
      volumetricWeight: finalVolumetricWeight,
      material,
      origin,
      createdAt: new Date(wcProduct.date_created || Date.now()),
      updatedAt: new Date(wcProduct.date_modified || Date.now()),
      // Store original WooCommerce ID for reference
      _wcId: wcProduct.id,
    };

    stats.products.transformed++;
    return mongoProduct;
  } catch (error: any) {
    stats.products.errors++;
    errors.push({
      type: 'product',
      id: wcProduct.id,
      error: error.message || 'Unknown error',
    });
    throw error;
  }
}

/**
 * Transform WooCommerce Variation to MongoDB Variant format
 */
function transformVariation(wcVariation: WooCommerceVariation): any {
  try {
    // Extract size and color from attributes
    let size = '';
    let color = '';
    let colorCode = '';

    wcVariation.attributes?.forEach(attr => {
      const attrName = attr.name.toLowerCase();
      if (attrName.includes('size') || attrName === 'pa_size') {
        size = attr.option || '';
      } else if (attrName.includes('color') || attrName === 'pa_color') {
        color = attr.option || '';
        // Try to extract color code from meta_data if available
        const colorCodeMeta = getMetaValue(wcVariation.meta_data, 'color_code');
        if (colorCodeMeta) {
          colorCode = String(colorCodeMeta);
        }
      }
    });

    const price = parseFloat(wcVariation.price || wcVariation.regular_price || '0');
    const stock = wcVariation.stock_quantity || 0;

    const variant = {
      id: `var_${wcVariation.id}`,
      size,
      color: color || undefined,
      colorCode: colorCode || undefined,
      price,
      stock,
      image: wcVariation.image?.src || undefined,
      sku: wcVariation.sku || undefined,
    };

    stats.variations.transformed++;
    return variant;
  } catch (error: any) {
    stats.variations.errors++;
    errors.push({
      type: 'variation',
      id: wcVariation.id,
      error: error.message || 'Unknown error',
    });
    throw error;
  }
}

/**
 * Transform WooCommerce Category to MongoDB Category format
 */
function transformCategory(wcCategory: WooCommerceCategory, parentMap: Map<number, string>): any {
  try {
    // Get parent MongoDB ObjectId string, convert to ObjectId if exists
    let parentId: any = null;
    if (wcCategory.parent && wcCategory.parent > 0) {
      const parentMongoId = parentMap.get(wcCategory.parent);
      if (parentMongoId) {
        // Convert string to ObjectId if valid
        if (ObjectId.isValid(parentMongoId)) {
          parentId = new ObjectId(parentMongoId);
        } else {
          parentId = parentMongoId; // Keep as string if not valid ObjectId
        }
      }
    }

    const mongoCategory = {
      name: wcCategory.name,
      slug: wcCategory.slug,
      description: wcCategory.description || '',
      parentId,
      imageUrl: wcCategory.image?.src || undefined,
      position: wcCategory.menu_order || 0,
      count: wcCategory.count || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Store original WooCommerce ID for reference
      _wcId: wcCategory.id,
    };

    stats.categories.transformed++;
    return mongoCategory;
  } catch (error: any) {
    stats.categories.errors++;
    errors.push({
      type: 'category',
      id: wcCategory.id,
      error: error.message || 'Unknown error',
    });
    throw error;
  }
}

/**
 * Fetch all products from WooCommerce (with pagination)
 */
async function fetchAllProducts(): Promise<WooCommerceProduct[]> {
  console.log(`${colors.blue}Fetching products from WooCommerce...${colors.reset}`);
  
  const allProducts: WooCommerceProduct[] = [];
  let page = 1;
  const perPage = 100; // WooCommerce max per_page
  let hasMore = true;

  while (hasMore) {
    try {
      const result = await wcApi.getProducts({ per_page: perPage, page }, true);
      const data = Array.isArray(result) ? result : (result as { data: any[]; headers: Headers }).data;
      const headers = Array.isArray(result) ? new Headers() : (result as { data: any[]; headers: Headers }).headers;
      const products = Array.isArray(data) ? data : [];
      
      if (products.length === 0) {
        hasMore = false;
        break;
      }

      allProducts.push(...products);
      stats.products.fetched += products.length;

      console.log(`  Fetched page ${page}: ${products.length} products (Total: ${allProducts.length})`);

      // Check if there are more pages
      const totalPages = parseInt(headers.get('x-wp-totalpages') || '1', 10);
      hasMore = page < totalPages;
      page++;

      // Rate limiting: small delay to avoid overwhelming the API
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error: any) {
      console.error(`${colors.red}Error fetching products page ${page}:${colors.reset}`, error.message);
      hasMore = false;
    }
  }

  console.log(`${colors.green}✓ Fetched ${allProducts.length} products${colors.reset}\n`);
  return allProducts;
}

/**
 * Fetch all categories from WooCommerce
 */
async function fetchAllCategories(): Promise<WooCommerceCategory[]> {
  console.log(`${colors.blue}Fetching categories from WooCommerce...${colors.reset}`);
  
  try {
    const categories = await wcApi.getCategories({ per_page: 100 });
    const categoriesArray = Array.isArray(categories) ? categories : [];
    
    stats.categories.fetched = categoriesArray.length;
    console.log(`${colors.green}✓ Fetched ${categoriesArray.length} categories${colors.reset}\n`);
    
    return categoriesArray;
  } catch (error: any) {
    console.error(`${colors.red}Error fetching categories:${colors.reset}`, error.message);
    return [];
  }
}

/**
 * Fetch variations for a product
 */
async function fetchProductVariations(productId: number): Promise<WooCommerceVariation[]> {
  try {
    const variations = await wcApi.getProductVariations(productId);
    return Array.isArray(variations) ? variations : [];
  } catch (error: any) {
    // Some products may not have variations, so this is not always an error
    return [];
  }
}

/**
 * Import categories to MongoDB
 */
async function importCategories(
  wcCategories: WooCommerceCategory[],
  collections: Awaited<ReturnType<typeof getCollections>>
): Promise<Map<number, string>> {
  console.log(`${colors.blue}Importing categories to MongoDB...${colors.reset}`);
  
  const categoryMap = new Map<number, string>(); // WC ID -> MongoDB ObjectId string
  const { categories } = collections;

  // Sort categories: parent categories first (parent = 0 or no parent)
  const sortedCategories = [...wcCategories].sort((a, b) => {
    const aIsTopLevel = !a.parent || a.parent === 0;
    const bIsTopLevel = !b.parent || b.parent === 0;
    
    if (aIsTopLevel && !bIsTopLevel) return -1;
    if (!aIsTopLevel && bIsTopLevel) return 1;
    return a.menu_order - b.menu_order;
  });

  // First pass: Import all categories without parent references
  for (const wcCategory of sortedCategories) {
    try {
      // Check if category already exists (by slug or WC ID)
      const existing = await categories.findOne({
        $or: [
          { slug: wcCategory.slug },
          { _wcId: wcCategory.id },
        ],
      });

      // Build parent map from already imported categories
      const parentMap = new Map<number, string>();
      for (const [wcId, mongoId] of categoryMap.entries()) {
        parentMap.set(wcId, mongoId);
      }
      
      const transformed = transformCategory(wcCategory, parentMap);

      if (existing) {
        // Update existing category
        await categories.updateOne(
          { _id: existing._id },
          { $set: transformed }
        );
        categoryMap.set(wcCategory.id, existing._id.toString());
        stats.categories.imported++;
        console.log(`  Updated category: ${wcCategory.name}`);
      } else {
        // Create new category
        const result = await categories.insertOne(transformed);
        categoryMap.set(wcCategory.id, result.insertedId.toString());
        stats.categories.imported++;
        console.log(`  Created category: ${wcCategory.name}`);
      }
    } catch (error: any) {
      console.error(`${colors.red}Error importing category ${wcCategory.name}:${colors.reset}`, error.message);
      stats.categories.errors++;
      errors.push({
        type: 'category',
        id: wcCategory.id,
        error: error.message || 'Unknown error',
      });
    }
  }

  console.log(`${colors.green}✓ Imported ${stats.categories.imported} categories${colors.reset}\n`);
  return categoryMap;
}

/**
 * Import products to MongoDB
 */
async function importProducts(
  wcProducts: WooCommerceProduct[],
  categoryMap: Map<number, string>,
  collections: Awaited<ReturnType<typeof getCollections>>
): Promise<void> {
  console.log(`${colors.blue}Importing products to MongoDB...${colors.reset}`);
  
  const { products } = collections;

  for (let i = 0; i < wcProducts.length; i++) {
    const wcProduct = wcProducts[i];
    
    try {
      // Check if product already exists
      const existing = await products.findOne({
        $or: [
          { slug: wcProduct.slug },
          { _wcId: wcProduct.id },
        ],
      });

      // Fetch variations if product is variable
      let variants: any[] = [];
      if (wcProduct.type === 'variable' && wcProduct.variations && wcProduct.variations.length > 0) {
        try {
          const wcVariations = await fetchProductVariations(wcProduct.id);
          stats.variations.fetched += wcVariations.length;
          
          variants = wcVariations.map(v => transformVariation(v));
        } catch (error: any) {
          console.warn(`${colors.yellow}Warning: Could not fetch variations for product ${wcProduct.id}:${colors.reset}`, error.message);
        }
      }

      // Transform product
      const transformed = transformProduct(wcProduct, categoryMap);
      transformed.variants = variants;

      if (existing) {
        // Update existing product
        await products.updateOne(
          { _id: existing._id },
          { $set: { ...transformed, updatedAt: new Date() } }
        );
        console.log(`  [${i + 1}/${wcProducts.length}] Updated product: ${wcProduct.name}`);
      } else {
        // Create new product
        await products.insertOne(transformed);
        console.log(`  [${i + 1}/${wcProducts.length}] Created product: ${wcProduct.name}`);
      }

      stats.products.imported++;

      // Rate limiting: small delay to avoid overwhelming the database
      if ((i + 1) % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error: any) {
      console.error(`${colors.red}Error importing product ${wcProduct.name} (ID: ${wcProduct.id}):${colors.reset}`, error.message);
      stats.products.errors++;
      errors.push({
        type: 'product',
        id: wcProduct.id,
        error: error.message || 'Unknown error',
      });
    }
  }

  console.log(`${colors.green}✓ Imported ${stats.products.imported} products${colors.reset}\n`);
}

/**
 * Print migration summary
 */
function printSummary() {
  console.log(`\n${colors.cyan}=== Migration Summary ===${colors.reset}\n`);

  console.log(`${colors.blue}Products:${colors.reset}`);
  console.log(`  Fetched: ${stats.products.fetched}`);
  console.log(`  Transformed: ${stats.products.transformed}`);
  console.log(`  Imported: ${stats.products.imported}`);
  console.log(`  Errors: ${colors.red}${stats.products.errors}${colors.reset}`);

  console.log(`\n${colors.blue}Categories:${colors.reset}`);
  console.log(`  Fetched: ${stats.categories.fetched}`);
  console.log(`  Transformed: ${stats.categories.transformed}`);
  console.log(`  Imported: ${stats.categories.imported}`);
  console.log(`  Errors: ${colors.red}${stats.categories.errors}${colors.reset}`);

  console.log(`\n${colors.blue}Variations:${colors.reset}`);
  console.log(`  Fetched: ${stats.variations.fetched}`);
  console.log(`  Transformed: ${stats.variations.transformed}`);
  console.log(`  Errors: ${colors.red}${stats.variations.errors}${colors.reset}`);

  if (errors.length > 0) {
    console.log(`\n${colors.red}=== Errors (${errors.length}) ===${colors.reset}`);
    errors.slice(0, 10).forEach(err => {
      console.log(`  ${err.type} [${err.id}]: ${err.error}`);
    });
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }

  const totalErrors = stats.products.errors + stats.categories.errors + stats.variations.errors;
  if (totalErrors === 0) {
    console.log(`\n${colors.green}✓ Migration completed successfully!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠ Migration completed with ${totalErrors} errors${colors.reset}\n`);
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log(`${colors.cyan}=== WordPress/WooCommerce to MongoDB Migration ===${colors.reset}\n`);

  try {
    // Connect to MongoDB
    console.log(`${colors.blue}Connecting to MongoDB...${colors.reset}`);
    await connectDB();
    const collections = await getCollections();
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    // Step 1: Fetch categories first (needed for product mapping)
    const wcCategories = await fetchAllCategories();
    
    // Step 2: Import categories
    const categoryMap = await importCategories(wcCategories, collections);

    // Step 3: Fetch products
    const wcProducts = await fetchAllProducts();

    // Step 4: Import products
    await importProducts(wcProducts, categoryMap, collections);

    // Step 5: Print summary
    printSummary();

  } catch (error: any) {
    console.error(`${colors.red}Fatal error during migration:${colors.reset}`, error);
    process.exit(1);
  } finally {
    // ✅ PERFORMANCE: Luôn đóng database connection trong finally block
    // Đảm bảo connection được đóng dù có lỗi hay không, tránh connection leaks
    await closeDB();
  }
}

// Run migration
migrate();

