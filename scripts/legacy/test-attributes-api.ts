/**
 * Test Attributes API
 * 
 * Script để test API routes cho attributes
 * 
 * Usage: npx tsx scripts/test-attributes-api.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

async function testAttributesAPI() {
  console.log('🧪 Testing Attributes API Routes...\n');

  try {
    // Test 1: Direct database query (simulating GET /api/admin/attributes)
    console.log('📡 Test 1: Simulating GET /api/admin/attributes');
    const { getCollections } = await import('../lib/db');
    const { productAttributes, productAttributeTerms } = await getCollections();

    const attributes = await productAttributes.find({}).sort({ createdAt: -1 }).toArray();
    console.log(`   Found ${attributes.length} attributes`);
    
    const attributesWithCounts = await Promise.all(
      attributes.map(async (attr) => {
        const termsCount = await productAttributeTerms.countDocuments({
          attributeId: attr._id.toString(),
        });
        return {
          ...attr,
          id: attr._id.toString(),
          termsCount,
        } as typeof attr & { id: string; termsCount: number };
      })
    );

    console.log('   Attributes with counts:');
    attributesWithCounts.forEach((attr) => {
      console.log(`      - ${attr.name} (${attr.slug}) [${attr.type}] - ${attr.termsCount} terms`);
    });

    // Test 2: Check if API route format matches
    console.log('\n📡 Test 2: Checking API response format');
    const expectedFormat = {
      attributes: attributesWithCounts.map((attr) => ({
        id: attr.id,
        name: attr.name,
        slug: attr.slug,
        type: attr.type,
        sortOrder: attr.sortOrder,
        termsCount: attr.termsCount,
        createdAt: attr.createdAt,
        updatedAt: attr.updatedAt,
      })),
      pagination: {
        total: attributes.length,
        totalPages: 1,
        currentPage: 1,
        perPage: 20,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    console.log('   Expected API response format:');
    console.log(`      - attributes: ${expectedFormat.attributes.length} items`);
    console.log(`      - pagination.total: ${expectedFormat.pagination.total}`);

    // Test 3: Check public API format (GET /api/cms/attributes)
    console.log('\n📡 Test 3: Simulating GET /api/cms/attributes');
    const publicAttributes = await productAttributes.find({}).sort({ name: 1 }).toArray();
    const publicFormat = publicAttributes.map((attr) => ({
      id: attr._id.toString(),
      name: attr.name,
      slug: attr.slug,
      type: attr.type,
      sortOrder: attr.sortOrder,
    }));

    console.log(`   Found ${publicFormat.length} attributes for public API`);
    publicFormat.forEach((attr) => {
      console.log(`      - ${attr.name} (${attr.slug}) [${attr.type}]`);
    });

    console.log('\n✅ All tests passed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run db:setup-indexes (to add missing indexes)');
    console.log('   2. Check browser console for API errors');
    console.log('   3. Check network tab in browser DevTools');
    console.log('   4. Verify authentication is working');

    const { closeDB } = await import('../lib/db');
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed!\n');

    if (error instanceof Error) {
      console.error('Error details:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error('Unknown error:', error);
    }

    const { closeDB } = await import('../lib/db');
    await closeDB();
    process.exit(1);
  }
}

// Run test
testAttributesAPI();
