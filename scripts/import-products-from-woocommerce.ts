/**
 * Import Products from WooCommerce to MongoDB
 * 
 * This script imports products from WooCommerce REST API to MongoDB
 * Similar to migrate-wordpress-to-mongodb.ts but focused on import functionality
 * 
 * Usage: npm run import:woocommerce
 */

import { connectDB, getCollections, closeDB } from '../lib/db';
import dotenv from 'dotenv';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });

const WOOCOMMERCE_URL = process.env.WOOCOMMERCE_URL;
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

if (!WOOCOMMERCE_URL || !WOOCOMMERCE_CONSUMER_KEY || !WOOCOMMERCE_CONSUMER_SECRET) {
  console.error('❌ Missing WooCommerce credentials in .env.local');
  console.error('Required: WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET');
  process.exit(1);
}

interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: any[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: string;
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  default_attributes: any[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: Array<{
    id: number;
    key: string;
    value: any;
  }>;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
}

async function fetchWooCommerceProducts(page = 1, perPage = 100): Promise<WooCommerceProduct[]> {
  const url = new URL(`${WOOCOMMERCE_URL}/wp-json/wc/v3/products`);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('per_page', perPage.toString());
  url.searchParams.append('status', 'publish');

  const auth = Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getMetaValue(metaData: Array<{ key: string; value: any }>, key: string): any {
  const meta = metaData.find((m) => m.key === key);
  return meta ? meta.value : null;
}

async function transformProduct(wcProduct: WooCommerceProduct, categories: any[]): Promise<any> {
  // Find category IDs
  const categoryIds = wcProduct.categories.map((cat) => {
    const found = categories.find((c) => c.slug === cat.slug || c.name === cat.name);
    return found ? found._id.toString() : null;
  }).filter(Boolean);

  // Calculate volumetric weight
  const length = parseFloat(wcProduct.dimensions.length) || 0;
  const width = parseFloat(wcProduct.dimensions.width) || 0;
  const height = parseFloat(wcProduct.dimensions.height) || 0;
  const volumetricWeight = length && width && height ? (length * width * height) / 6000 : undefined;

  // Transform variants
  const variants: any[] = [];
  if (wcProduct.type === 'variable' && wcProduct.variations && wcProduct.variations.length > 0) {
    // Note: In a full implementation, you would fetch variations here
    // For now, we'll create a basic variant structure
    wcProduct.attributes.forEach((attr) => {
      if (attr.variation) {
        attr.options.forEach((option) => {
          variants.push({
            id: `variant-${Date.now()}-${Math.random()}`,
            [attr.name.toLowerCase()]: option,
            price: parseFloat(wcProduct.price) || 0,
            stock: wcProduct.stock_quantity || 0,
          });
        });
      }
    });
  }

  return {
    name: wcProduct.name,
    slug: wcProduct.slug,
    description: wcProduct.description || '',
    shortDescription: wcProduct.short_description || '',
    sku: wcProduct.sku || '',
    price: parseFloat(wcProduct.price) || 0,
    categoryId: categoryIds[0] || undefined,
    categoryIds: categoryIds,
    tags: wcProduct.tags.map((t) => t.name),
    images: wcProduct.images.map((img) => img.src),
    status: wcProduct.status === 'publish' ? 'publish' : 'draft',
    isActive: wcProduct.status === 'publish',
    isHot: wcProduct.featured || false,
    stockQuantity: wcProduct.stock_quantity || 0,
    stockStatus: wcProduct.stock_status || 'instock',
    length: length || undefined,
    width: width || undefined,
    height: height || undefined,
    weight: parseFloat(wcProduct.weight) || undefined,
    volumetricWeight,
    material: getMetaValue(wcProduct.meta_data, 'material') || undefined,
    origin: getMetaValue(wcProduct.meta_data, 'origin') || undefined,
    variants,
    // Store original WooCommerce ID for reference
    wooCommerceId: wcProduct.id,
    createdAt: new Date(wcProduct.date_created),
    updatedAt: new Date(wcProduct.date_modified),
  };
}

async function main() {
  console.log('🚀 Starting WooCommerce Import...\n');

  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const { products, categories } = await getCollections();

    // Fetch all categories
    const allCategories = await categories.find({}).toArray();
    console.log(`📦 Found ${allCategories.length} categories in MongoDB\n`);

    // Fetch products from WooCommerce
    let page = 1;
    let allProducts: WooCommerceProduct[] = [];
    let hasMore = true;

    while (hasMore) {
      console.log(`📥 Fetching page ${page} from WooCommerce...`);
      const wcProducts = await fetchWooCommerceProducts(page, 100);
      
      if (wcProducts.length === 0) {
        hasMore = false;
      } else {
        allProducts = [...allProducts, ...wcProducts];
        console.log(`   ✅ Fetched ${wcProducts.length} products (Total: ${allProducts.length})`);
        page++;
        
        // Rate limiting: wait 1 second between requests
        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    console.log(`\n📊 Total products to import: ${allProducts.length}\n`);

    // Import products
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const wcProduct of allProducts) {
      try {
        // Check if product already exists (by slug or WooCommerce ID)
        const existing = await products.findOne({
          $or: [
            { slug: wcProduct.slug },
            { wooCommerceId: wcProduct.id },
          ],
        });

        if (existing) {
          console.log(`⏭️  Skipping ${wcProduct.name} (already exists)`);
          skipped++;
          continue;
        }

        // Transform and import
        const productData = await transformProduct(wcProduct, allCategories);
        await products.insertOne(productData);
        
        console.log(`✅ Imported: ${wcProduct.name}`);
        imported++;
      } catch (error: any) {
        console.error(`❌ Error importing ${wcProduct.name}:`, error.message);
        errors++;
      }
    }

    console.log('\n🎉 Import completed!');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
  } catch (error: any) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await closeDB();
  }
}

// Run import
main();

