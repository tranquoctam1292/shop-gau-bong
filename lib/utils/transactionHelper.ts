/**
 * MongoDB Transaction Helper
 * 
 * Provides utilities for working with MongoDB transactions including:
 * - Retry logic for TransientTransactionError
 * - Session management
 * - Error handling
 */

import { MongoClient, ClientSession, TransactionOptions } from 'mongodb';
import { connectDB } from '@/lib/db';

export interface TransactionConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

const DEFAULT_CONFIG: Required<TransactionConfig> = {
  maxRetries: 3,
  retryDelayMs: 100,
  timeoutMs: 30000, // 30 seconds
};

/**
 * Check if error is a transient transaction error that can be retried
 */
export function isTransientTransactionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const errorName = (error as any).errorLabels?.[0] || error.name;
  const errorMessage = error.message.toLowerCase();
  
  return (
    errorName === 'TransientTransactionError' ||
    errorMessage.includes('transienttransactionerror') ||
    errorMessage.includes('unknown transaction commit result')
  );
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Cache for transaction support check
let transactionSupportChecked = false;
let transactionSupported: boolean | null = null;

/**
 * Check if MongoDB supports transactions (requires replica set)
 * Caches the result to avoid repeated checks
 */
export async function checkTransactionSupport(): Promise<boolean> {
  if (transactionSupportChecked) {
    return transactionSupported === true;
  }

  try {
    const client = await connectDB();
    const adminDb = client.db().admin();
    const serverStatus = await adminDb.serverStatus();
    const replicaSetName = serverStatus.repl?.setName;

    if (!replicaSetName) {
      transactionSupported = false;
      transactionSupportChecked = true;
      return false;
    }

    // Try a simple transaction to verify support
    const session = client.startSession();
    try {
      const testCollection = client.db().collection('_transaction_test');
      await session.withTransaction(async () => {
        await testCollection.insertOne({ test: true }, { session });
        await testCollection.deleteOne({ test: true }, { session });
      });
      transactionSupported = true;
    } catch (error) {
      // If transaction fails, check if it's a transaction-related error
      if (error instanceof Error && error.message.includes('transaction')) {
        transactionSupported = false;
      } else {
        // Other error, assume transactions are supported
        transactionSupported = true;
      }
    } finally {
      await session.endSession();
      // Cleanup test collection
      try {
        await client.db().collection('_transaction_test').drop().catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }

    transactionSupportChecked = true;
    return transactionSupported === true;
  } catch (error) {
    // If check fails, assume transactions are not supported
    console.warn('[Transaction] Failed to check transaction support:', error);
    transactionSupported = false;
    transactionSupportChecked = true;
    return false;
  }
}

/**
 * Execute a function within a MongoDB transaction with retry logic
 * Falls back to non-transaction execution if transactions are not supported
 * 
 * @param callback - Function to execute within transaction
 * @param config - Transaction configuration
 * @returns Result of callback function
 */
export async function withTransaction<T>(
  callback: (session: ClientSession) => Promise<T>,
  config: TransactionConfig = {}
): Promise<T> {
  // Check transaction support
  const supportsTransactions = await checkTransactionSupport();

  if (!supportsTransactions) {
    // FALLBACK: Execute without transaction (not ideal, but allows code to work)
    console.warn(
      '[Transaction] MongoDB does not support transactions (requires replica set). ' +
      'Executing without transaction - data consistency not guaranteed.'
    );

    // Create a mock session object for compatibility
    const mockSession = {
      // Empty object - operations will not use session
    } as ClientSession;

    try {
      return await callback(mockSession);
    } catch (error) {
      // Re-throw with context
      if (error instanceof Error) {
        throw new Error(`Operation failed (no transaction support): ${error.message}`);
      }
      throw error;
    }
  }

  // Normal transaction execution
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const client = await connectDB();

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= finalConfig.maxRetries) {
    const session = client.startSession();

    try {
      const transactionOptions: TransactionOptions = {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
        maxTimeMS: finalConfig.timeoutMs,
      };

      const result = await session.withTransaction(
        async () => {
          return await callback(session);
        },
        transactionOptions
      );

      return result as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If it's a transient error and we have retries left, retry
      if (isTransientTransactionError(error) && attempt < finalConfig.maxRetries) {
        attempt++;
        const delay = finalConfig.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(
          `[Transaction] TransientTransactionError on attempt ${attempt}, retrying in ${delay}ms...`
        );
        await sleep(delay);
        continue;
      }

      // Not a transient error or out of retries
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Transaction failed after all retries');
}

/**
 * Get collections with session support for transactions
 * All collection operations will use the provided session
 */
export async function getCollectionsWithSession(session: ClientSession) {
  const { getCollections } = await import('@/lib/db');
  const collections = await getCollections();
  
  // Return collections - session will be passed to individual operations
  // Note: Collections themselves don't store session, but operations use it
  return {
    ...collections,
    session, // Include session for reference
  };
}

