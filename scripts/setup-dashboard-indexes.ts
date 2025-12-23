/**
 * Setup MongoDB Indexes for Dashboard
 * 
 * Creates compound indexes for dashboard queries to improve performance
 * Verifies existing indexes before creating new ones
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB } from '../lib/db';

async function setupDashboardIndexes() {
  console.log('🔧 Setting up dashboard indexes...\n');

  try {
    const { orders } = await getCollections();

    // Get existing indexes
    const existingIndexes = await orders.indexes();
    const indexNames = existingIndexes.map((idx) => idx.name || '');

    console.log('📋 Existing indexes:', indexNames.join(', '));

    // Compound index for common dashboard queries
    // Query pattern: { createdAt: { $gte: start, $lte: end }, status: 'completed', paymentStatus: 'paid' }
    const compoundIndexName = 'createdAt_status_paymentStatus';
    if (!indexNames.includes(compoundIndexName)) {
      console.log(`\n📦 Creating compound index: ${compoundIndexName}...`);
      await orders.createIndex(
        { createdAt: 1, status: 1, paymentStatus: 1 },
        { name: compoundIndexName }
      );
      console.log(`   ✅ Compound index created: ${compoundIndexName}`);
    } else {
      console.log(`   ✅ Compound index already exists: ${compoundIndexName}`);
    }

    // Verify single field indexes exist (should already exist from setup-database-indexes.ts)
    const singleFieldIndexes = [
      { field: 'createdAt', name: 'createdAt_1' },
      { field: 'status', name: 'status_1' },
      { field: 'paymentStatus', name: 'paymentStatus_1' },
      { field: 'customerEmail', name: 'customerEmail_1' },
    ];

    console.log('\n📦 Verifying single field indexes...');
    for (const index of singleFieldIndexes) {
      if (!indexNames.includes(index.name)) {
        console.log(`   ⚠️  Missing index: ${index.name}, creating...`);
        await orders.createIndex({ [index.field]: 1 }, { name: index.name });
        console.log(`   ✅ Created: ${index.name}`);
      } else {
        console.log(`   ✅ Exists: ${index.name}`);
      }
    }

    // Verify refunds collection indexes (if needed)
    try {
      const { refunds } = await getCollections();
      const refundsIndexes = await refunds.indexes();
      const refundsIndexNames = refundsIndexes.map((idx) => idx.name || '');

      if (!refundsIndexNames.includes('createdAt_1')) {
        console.log('\n📦 Creating refunds createdAt index...');
        await refunds.createIndex({ createdAt: 1 });
        console.log('   ✅ Refunds createdAt index created');
      } else {
        console.log('   ✅ Refunds createdAt index already exists');
      }

      if (!refundsIndexNames.includes('status_1')) {
        console.log('📦 Creating refunds status index...');
        await refunds.createIndex({ status: 1 });
        console.log('   ✅ Refunds status index created');
      } else {
        console.log('   ✅ Refunds status index already exists');
      }
    } catch (error) {
      console.log('   ⚠️  Refunds collection not found or error:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('\n✅ Dashboard indexes setup complete!');
  } catch (error) {
    console.error('❌ Error setting up dashboard indexes:', error);
    throw error;
  } finally {
    await closeDB();
  }
}

// Run if executed directly
if (require.main === module) {
  setupDashboardIndexes()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error);
      process.exit(1);
    });
}

export { setupDashboardIndexes };

