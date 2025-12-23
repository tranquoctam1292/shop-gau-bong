/**
 * Verify MongoDB Transaction Support
 * 
 * Checks if MongoDB cluster supports transactions (requires replica set)
 * 
 * Usage: npm run verify:mongodb-transactions
 */

import { MongoClient } from 'mongodb';
import { connectDB } from '@/lib/db';

async function verifyTransactionSupport() {
  let client: MongoClient | null = null;

  try {
    console.log('🔍 Verifying MongoDB transaction support...\n');

    // Connect to MongoDB
    client = await connectDB();
    const adminDb = client.db().admin();

    // Check server status
    const serverStatus = await adminDb.serverStatus();
    const replicaSetName = serverStatus.repl?.setName;

    console.log('📊 MongoDB Server Information:');
    console.log(`   - Version: ${serverStatus.version}`);
    console.log(`   - Replica Set Name: ${replicaSetName || 'None (Standalone)'}`);
    console.log(`   - Process: ${serverStatus.process}`);

    // Check if replica set is configured
    if (!replicaSetName) {
      console.log('\n❌ WARNING: MongoDB is running in standalone mode.');
      console.log('   Transactions require a replica set or sharded cluster.');
      console.log('   Please configure a replica set to use transactions.\n');
      
      // Try to get replica set status (will fail if not replica set)
      try {
        await adminDb.command({ replSetGetStatus: 1 });
      } catch (error) {
        console.log('   ❌ Replica set status check failed (expected for standalone)');
        return false;
      }
    } else {
      console.log(`\n✅ Replica Set detected: "${replicaSetName}"`);
      
      // Get replica set status
      try {
        const replStatus = await adminDb.command({ replSetGetStatus: 1 });
        const members = (replStatus as any).members || [];
        const primary = members.find((m: any) => m.stateStr === 'PRIMARY');
        
        console.log(`   - Primary: ${primary?.name || 'Not found'}`);
        console.log(`   - Members: ${members.length}`);
        
        if (primary) {
          console.log('\n✅ Transactions are SUPPORTED on this cluster.');
          return true;
        } else {
          console.log('\n⚠️  WARNING: No primary member found in replica set.');
          return false;
        }
      } catch (error) {
        console.log('\n⚠️  WARNING: Could not get replica set status.');
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }

    // Test transaction capability
    console.log('\n🧪 Testing transaction capability...');
    const db = client.db();
    const testCollection = db.collection('_transaction_test');

    try {
      const session = client.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Simple test transaction
          await testCollection.insertOne({ test: true }, { session });
          await testCollection.deleteOne({ test: true }, { session });
        });
        
        console.log('✅ Transaction test PASSED');
        console.log('\n✅ MongoDB cluster FULLY SUPPORTS transactions!');
        return true;
      } catch (error) {
        if (error instanceof Error && error.message.includes('transaction')) {
          console.log('❌ Transaction test FAILED');
          console.log(`   Error: ${error.message}`);
          return false;
        }
        throw error;
      } finally {
        await session.endSession();
      }
    } catch (error) {
      console.log('❌ Transaction test FAILED');
      console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    } finally {
      // Cleanup test collection
      try {
        await testCollection.drop().catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    console.error('\n❌ Error verifying MongoDB transaction support:');
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    return false;
  } finally {
    if (client) {
      // Don't close client - it's cached globally
    }
  }
}

// Run verification
if (require.main === module) {
  verifyTransactionSupport()
    .then((supported) => {
      if (supported) {
        console.log('\n✅ Verification complete: Transactions are supported');
        process.exit(0);
      } else {
        console.log('\n⚠️  Verification complete: Transactions may not be fully supported');
        console.log('   Consider using fallback strategy (optimistic locking + retry)');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

export { verifyTransactionSupport };

