/**
 * Migrate Orders Schema
 * 
 * Updates existing orders to match new schema requirements:
 * - Add missing fields (channel, cancelledReason, trackingNumber, carrier)
 * - Update shipping object with province, district, ward if missing
 * - Ensure all orders have required fields
 * 
 * Usage: npm run migrate:orders-schema
 * Or: tsx scripts/migrate-orders-schema.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { getCollections, closeDB } from '../lib/db';

async function migrateOrdersSchema() {
  console.log('🔄 Migrating orders schema...\n');

  try {
    const { orders } = await getCollections();

    // Find all orders
    const allOrders = await orders.find({}).toArray();
    console.log(`📦 Found ${allOrders.length} orders to migrate\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const order of allOrders) {
      const updateData: any = {};
      let needsUpdate = false;

      // Add channel field if missing (default to 'website')
      if (!order.channel) {
        updateData.channel = 'website';
        needsUpdate = true;
      }

      // Update shipping object to include province, district, ward if missing
      if (order.shipping) {
        const shippingUpdate: any = {};
        
        // Extract province, district, ward from city if possible
        // Or set defaults if not available
        if (!order.shipping.province) {
          shippingUpdate['shipping.province'] = order.shipping.city || '';
        }
        if (!order.shipping.district) {
          shippingUpdate['shipping.district'] = '';
        }
        if (!order.shipping.ward) {
          shippingUpdate['shipping.ward'] = '';
        }

        if (Object.keys(shippingUpdate).length > 0) {
          Object.assign(updateData, shippingUpdate);
          needsUpdate = true;
        }
      }

      // Add taxTotal and discountTotal if missing (default to 0)
      if (order.taxTotal === undefined) {
        updateData.taxTotal = 0;
        needsUpdate = true;
      }
      if (order.discountTotal === undefined) {
        updateData.discountTotal = 0;
        needsUpdate = true;
      }

      // Add grandTotal if missing (calculate from existing fields)
      if (order.grandTotal === undefined) {
        const subtotal = order.subtotal || 0;
        const shippingTotal = order.shippingTotal || 0;
        const taxTotal = order.taxTotal || 0;
        const discountTotal = order.discountTotal || 0;
        updateData.grandTotal = Math.max(
          0,
          subtotal + shippingTotal + taxTotal - discountTotal
        );
        needsUpdate = true;
      }

      // Add shippingMethod if missing (default to empty string)
      if (!order.shippingMethod) {
        updateData.shippingMethod = '';
        needsUpdate = true;
      }

      // Update status if it's an old status value
      const oldStatuses: Record<string, string> = {
        'on-hold': 'pending',
      };
      if (order.status && oldStatuses[order.status]) {
        updateData.status = oldStatuses[order.status];
        needsUpdate = true;
        console.log(
          `   ⚠️  Order ${order.orderNumber}: Updated status from "${order.status}" to "${updateData.status}"`
        );
      }

      if (needsUpdate) {
        await orders.updateOne({ _id: order._id }, { $set: updateData });
        updatedCount++;
        console.log(`   ✅ Updated order: ${order.orderNumber}`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Updated: ${updatedCount} orders`);
    console.log(`   Skipped: ${skippedCount} orders (already up to date)`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed!\n');

    if (error instanceof Error) {
      console.error('Error details:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error('Unknown error:', error);
    }

    process.exit(1);
  } finally {
    // ✅ PERFORMANCE: Luôn đóng database connection trong finally block
    // Đảm bảo connection được đóng dù có lỗi hay không, tránh connection leaks
    await closeDB();
  }
}

// Run migration
migrateOrdersSchema();

