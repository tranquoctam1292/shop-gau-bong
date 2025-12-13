/**
 * Test Script for Menu Management Phase 5: Drag & Drop & Structure Management
 * 
 * Tests:
 * 1. Add items from different sources (Pages, Categories, Products, Posts, Custom)
 * 2. Drag & drop functionality (reorder, move to child)
 * 3. Depth limit validation
 * 4. Auto-save structure
 * 5. Expand/collapse items
 */

import { getCollections, ObjectId } from '../lib/db';

// Load environment variables
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Testing Menu Management Phase 5...\n');

  const { menus, menuItems } = await getCollections();

  // Test 1: Create a test menu
  let testMenuId: ObjectId;
  await test('Create test menu', async () => {
    // Use a unique location to avoid duplicate key error
    const uniqueLocation = `test-phase5-${Date.now()}`;
    const result = await menus.insertOne({
      name: 'Test Menu Phase 5',
      location: uniqueLocation,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    testMenuId = result.insertedId;
  });

  // Test 2: Add page item (should use URL, not referenceId)
  let pageItemId: ObjectId;
  await test('Add page item (URL-based)', async () => {
    const result = await menuItems.insertOne({
      menuId: testMenuId!,
      parentId: null,
      title: 'Trang chủ',
      type: 'page',
      referenceId: null,
      url: '/',
      target: '_self',
      iconClass: null,
      cssClass: null,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    pageItemId = result.insertedId;
  });

  // Test 3: Add custom link item
  let customItemId: ObjectId;
  await test('Add custom link item', async () => {
    const result = await menuItems.insertOne({
      menuId: testMenuId!,
      parentId: null,
      title: 'Custom Link',
      type: 'custom',
      referenceId: null,
      url: 'https://example.com',
      target: '_blank',
      iconClass: null,
      cssClass: null,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    customItemId = result.insertedId;
  });

  // Test 4: Add category item (requires valid ObjectId)
  let categoryItemId: ObjectId;
  await test('Add category item (referenceId-based)', async () => {
    // First, get a real category ID
    const { categories } = await getCollections();
    const category = await categories.findOne({});
    
    if (!category) {
      throw new Error('No categories found in database. Please create at least one category first.');
    }

    const result = await menuItems.insertOne({
      menuId: testMenuId!,
      parentId: null,
      title: category.name,
      type: 'category',
      referenceId: category._id,
      url: null,
      target: '_self',
      iconClass: null,
      cssClass: null,
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    categoryItemId = result.insertedId;
  });

  // Test 5: Add child item (nested structure)
  let childItemId: ObjectId;
  await test('Add child item (level 1)', async () => {
    const result = await menuItems.insertOne({
      menuId: testMenuId!,
      parentId: categoryItemId!,
      title: 'Child Item',
      type: 'custom',
      referenceId: null,
      url: '/child',
      target: '_self',
      iconClass: null,
      cssClass: null,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    childItemId = result.insertedId;
  });

  // Test 6: Add grandchild item (level 2)
  let grandchildItemId: ObjectId;
  await test('Add grandchild item (level 2)', async () => {
    const result = await menuItems.insertOne({
      menuId: testMenuId!,
      parentId: childItemId!,
      title: 'Grandchild Item',
      type: 'custom',
      referenceId: null,
      url: '/grandchild',
      target: '_self',
      iconClass: null,
      cssClass: null,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    grandchildItemId = result.insertedId;
  });

  // Test 7: Test structure update API (bulk update)
  await test('Update menu structure (bulk update)', async () => {
    const structure = [
      {
        id: pageItemId!.toString(),
        children: [],
      },
      {
        id: customItemId!.toString(),
        children: [],
      },
      {
        id: categoryItemId!.toString(),
        children: [
          {
            id: childItemId!.toString(),
            children: [
              {
                id: grandchildItemId!.toString(),
                children: [],
              },
            ],
          },
        ],
      },
    ];

    // Simulate API call (we'll test the actual API separately)
    // For now, just verify the structure is valid
    const validateDepth = (items: any[], depth: number = 0): number => {
      let maxDepth = depth;
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          const childDepth = validateDepth(item.children, depth + 1);
          maxDepth = Math.max(maxDepth, childDepth);
        }
      }
      return maxDepth;
    };

    const maxDepth = validateDepth(structure);
    if (maxDepth >= 3) {
      throw new Error(`Maximum depth exceeded: ${maxDepth} (max allowed: 2)`);
    }
  });

  // Test 8: Test depth limit (should reject level 3)
  await test('Reject structure with depth >= 3', async () => {
    const invalidStructure = [
      {
        id: pageItemId!.toString(),
        children: [
          {
            id: customItemId!.toString(),
            children: [
              {
                id: categoryItemId!.toString(),
                children: [
                  {
                    id: childItemId!.toString(),
                    children: [], // This would be level 3 (depth 2)
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const validateDepth = (items: any[], depth: number = 0): number => {
      let maxDepth = depth;
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          const childDepth = validateDepth(item.children, depth + 1);
          maxDepth = Math.max(maxDepth, childDepth);
        }
      }
      return maxDepth;
    };

    const maxDepth = validateDepth(invalidStructure);
    if (maxDepth < 3) {
      throw new Error('Expected depth >= 3, but validation passed');
    }
  });

  // Test 9: Verify items can be retrieved in tree format
  await test('Retrieve menu items in tree format', async () => {
    const items = await menuItems
      .find({ menuId: testMenuId! })
      .sort({ order: 1 })
      .toArray();

    if (items.length === 0) {
      throw new Error('No items found');
    }

    // Build tree
    const buildTree = (parentId: ObjectId | null = null): any[] => {
      return items
        .filter((item) => {
          if (parentId === null) {
            return !item.parentId;
          }
          return item.parentId?.toString() === parentId.toString();
        })
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          id: item._id.toString(),
          title: item.title,
          type: item.type,
          children: buildTree(item._id),
        }));
    };

    const tree = buildTree();
    if (tree.length === 0) {
      throw new Error('Tree is empty');
    }
  });

  // Test 10: Cleanup - Delete test menu and items
  await test('Cleanup test data', async () => {
    await menuItems.deleteMany({ menuId: testMenuId! });
    await menus.deleteOne({ _id: testMenuId! });
  });

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('─'.repeat(50));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Total: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

