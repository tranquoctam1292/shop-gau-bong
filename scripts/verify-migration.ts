/**
 * Migration Verification Script
 * 
 * Verifies data integrity after migration from WordPress/WooCommerce to MongoDB
 * 
 * Usage: npm run migrate:verify
 */

import dotenv from 'dotenv';
import { resolve } from 'path';
import { connectDB, getCollections, closeDB } from '@/lib/db';

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
};

interface VerificationResult {
  products: {
    total: number;
    published: number;
    draft: number;
    withVariants: number;
    withImages: number;
    missingFields: number;
    issues: string[];
  };
  categories: {
    total: number;
    topLevel: number;
    withParent: number;
    withImages: number;
    issues: string[];
  };
  dataIntegrity: {
    productsWithoutCategory: number;
    categoriesWithoutProducts: number;
    productsWithInvalidVariants: number;
    issues: string[];
  };
}

/**
 * Verify products
 */
async function verifyProducts(collections: Awaited<ReturnType<typeof getCollections>>): Promise<VerificationResult['products']> {
  const { products } = collections;
  const issues: string[] = [];

  const allProducts = await products.find({}).toArray();
  const total = allProducts.length;

  let published = 0;
  let draft = 0;
  let withVariants = 0;
  let withImages = 0;
  let missingFields = 0;

  for (const product of allProducts) {
    // Check status
    if (product.status === 'publish') published++;
    else if (product.status === 'draft') draft++;

    // Check variants
    if (product.variants && product.variants.length > 0) {
      withVariants++;
    }

    // Check images
    if (product.images && product.images.length > 0) {
      withImages++;
    }

    // Check required fields
    const requiredFields = ['name', 'slug', 'minPrice'];
    const missing = requiredFields.filter(field => !product[field]);
    if (missing.length > 0) {
      missingFields++;
      issues.push(`Product ${product.slug || product._id}: Missing fields: ${missing.join(', ')}`);
    }

    // Check price validity
    if (product.minPrice === undefined || product.minPrice < 0) {
      issues.push(`Product ${product.slug || product._id}: Invalid minPrice`);
    }

    // Check variant integrity
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (!variant.size || !variant.price || variant.price < 0) {
          issues.push(`Product ${product.slug || product._id}: Invalid variant`);
        }
      }
    }
  }

  return {
    total,
    published,
    draft,
    withVariants,
    withImages,
    missingFields,
    issues: issues.slice(0, 20), // Limit to first 20 issues
  };
}

/**
 * Verify categories
 */
async function verifyCategories(collections: Awaited<ReturnType<typeof getCollections>>): Promise<VerificationResult['categories']> {
  const { categories } = collections;
  const issues: string[] = [];

  const allCategories = await categories.find({}).toArray();
  const total = allCategories.length;

  let topLevel = 0;
  let withParent = 0;
  let withImages = 0;

  for (const category of allCategories) {
    // Check parent
    if (!category.parentId) {
      topLevel++;
    } else {
      withParent++;
      
      // Verify parent exists
      const parent = await categories.findOne({ _id: category.parentId });
      if (!parent) {
        issues.push(`Category ${category.slug || category._id}: Parent ${category.parentId} not found`);
      }
    }

    // Check images
    if (category.imageUrl) {
      withImages++;
    }

    // Check required fields
    if (!category.name || !category.slug) {
      issues.push(`Category ${category.slug || category._id}: Missing required fields`);
    }
  }

  return {
    total,
    topLevel,
    withParent,
    withImages,
    issues: issues.slice(0, 20),
  };
}

/**
 * Verify data integrity
 */
async function verifyDataIntegrity(collections: Awaited<ReturnType<typeof getCollections>>): Promise<VerificationResult['dataIntegrity']> {
  const { products, categories } = collections;
  const issues: string[] = [];

  // Check products without valid category
  const allProducts = await products.find({}).toArray();
  let productsWithoutCategory = 0;

  for (const product of allProducts) {
    if (product.category) {
      // Check if category exists (could be ObjectId string or slug)
      const category = await categories.findOne({
        $or: [
          { _id: product.category },
          { slug: product.category },
        ],
      });
      
      if (!category) {
        productsWithoutCategory++;
        issues.push(`Product ${product.slug || product._id}: Category ${product.category} not found`);
      }
    }
  }

  // Check categories without products
  const allCategories = await categories.find({}).toArray();
  let categoriesWithoutProducts = 0;

  for (const category of allCategories) {
    const productCount = await products.countDocuments({
      $or: [
        { category: category._id.toString() },
        { category: category.slug },
      ],
    });

    if (productCount === 0) {
      categoriesWithoutProducts++;
      // Don't add to issues - empty categories are OK
    }
  }

  // Check products with invalid variants
  let productsWithInvalidVariants = 0;
  for (const product of allProducts) {
    if (product.variants && product.variants.length > 0) {
      const invalidVariants = product.variants.filter(
        (v: any) => !v.size || !v.price || v.price < 0 || !v.id
      );
      
      if (invalidVariants.length > 0) {
        productsWithInvalidVariants++;
        issues.push(`Product ${product.slug || product._id}: Has ${invalidVariants.length} invalid variants`);
      }
    }
  }

  return {
    productsWithoutCategory,
    categoriesWithoutProducts,
    productsWithInvalidVariants,
    issues: issues.slice(0, 20),
  };
}

/**
 * Main verification function
 */
async function verify() {
  console.log(`${colors.cyan}=== Migration Verification ===${colors.reset}\n`);

  try {
    // Connect to MongoDB
    console.log(`${colors.blue}Connecting to MongoDB...${colors.reset}`);
    await connectDB();
    const collections = await getCollections();
    console.log(`${colors.green}✓ Connected to MongoDB${colors.reset}\n`);

    // Verify products
    console.log(`${colors.blue}Verifying products...${colors.reset}`);
    const productsResult = await verifyProducts(collections);
    console.log(`${colors.green}✓ Products verified${colors.reset}\n`);

    // Verify categories
    console.log(`${colors.blue}Verifying categories...${colors.reset}`);
    const categoriesResult = await verifyCategories(collections);
    console.log(`${colors.green}✓ Categories verified${colors.reset}\n`);

    // Verify data integrity
    console.log(`${colors.blue}Verifying data integrity...${colors.reset}`);
    const integrityResult = await verifyDataIntegrity(collections);
    console.log(`${colors.green}✓ Data integrity verified${colors.reset}\n`);

    // Print summary
    console.log(`${colors.cyan}=== Verification Summary ===${colors.reset}\n`);

    console.log(`${colors.blue}Products:${colors.reset}`);
    console.log(`  Total: ${productsResult.total}`);
    console.log(`  Published: ${productsResult.published}`);
    console.log(`  Draft: ${productsResult.draft}`);
    console.log(`  With Variants: ${productsResult.withVariants}`);
    console.log(`  With Images: ${productsResult.withImages}`);
    console.log(`  Missing Fields: ${colors.yellow}${productsResult.missingFields}${colors.reset}`);
    if (productsResult.issues.length > 0) {
      console.log(`  ${colors.red}Issues:${colors.reset}`);
      productsResult.issues.forEach(issue => console.log(`    - ${issue}`));
    }

    console.log(`\n${colors.blue}Categories:${colors.reset}`);
    console.log(`  Total: ${categoriesResult.total}`);
    console.log(`  Top Level: ${categoriesResult.topLevel}`);
    console.log(`  With Parent: ${categoriesResult.withParent}`);
    console.log(`  With Images: ${categoriesResult.withImages}`);
    if (categoriesResult.issues.length > 0) {
      console.log(`  ${colors.red}Issues:${colors.reset}`);
      categoriesResult.issues.forEach(issue => console.log(`    - ${issue}`));
    }

    console.log(`\n${colors.blue}Data Integrity:${colors.reset}`);
    console.log(`  Products Without Valid Category: ${colors.yellow}${integrityResult.productsWithoutCategory}${colors.reset}`);
    console.log(`  Categories Without Products: ${integrityResult.categoriesWithoutProducts}`);
    console.log(`  Products With Invalid Variants: ${colors.yellow}${integrityResult.productsWithInvalidVariants}${colors.reset}`);
    if (integrityResult.issues.length > 0) {
      console.log(`  ${colors.red}Issues:${colors.reset}`);
      integrityResult.issues.forEach(issue => console.log(`    - ${issue}`));
    }

    const totalIssues = 
      productsResult.issues.length + 
      categoriesResult.issues.length + 
      integrityResult.issues.length;

    if (totalIssues === 0) {
      console.log(`\n${colors.green}✓ All verifications passed!${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}⚠ Found ${totalIssues} issues${colors.reset}\n`);
    }

    // Close database connection
    await closeDB();
  } catch (error: any) {
    console.error(`${colors.red}Fatal error during verification:${colors.reset}`, error);
    await closeDB();
    process.exit(1);
  }
}

// Run verification
verify();

