/**
 * SEO Performance Monitoring
 *
 * Utilities for tracking SEO module performance metrics
 * - API response times
 * - Audit execution times
 * - Cache hit rates
 *
 * @see docs/plans/SEO_MODULE_PLAN.md
 */

// Performance metrics storage (in-memory for dev, can be sent to external service in prod)
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const metricsBuffer: PerformanceMetric[] = [];
const MAX_BUFFER_SIZE = 1000;

/**
 * Track performance of an async operation
 */
export async function trackPerformance<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    recordMetric(name, duration, metadata);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    recordMetric(`${name}_error`, duration, { ...metadata, error: String(error) });
    throw error;
  }
}

/**
 * Track performance of a sync operation
 */
export function trackPerformanceSync<T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, unknown>
): T {
  const startTime = performance.now();

  try {
    const result = operation();
    const duration = performance.now() - startTime;

    recordMetric(name, duration, metadata);

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    recordMetric(`${name}_error`, duration, { ...metadata, error: String(error) });
    throw error;
  }
}

/**
 * Record a performance metric
 */
function recordMetric(
  name: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  const metric: PerformanceMetric = {
    name,
    duration,
    timestamp: new Date(),
    metadata,
  };

  // Add to buffer
  metricsBuffer.push(metric);

  // Trim buffer if too large
  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.splice(0, metricsBuffer.length - MAX_BUFFER_SIZE);
  }

  // Log slow operations in development
  if (process.env.NODE_ENV === 'development' && duration > 1000) {
    console.warn(`[SEO Performance] Slow operation: ${name} took ${duration.toFixed(2)}ms`, metadata);
  }
}

/**
 * Get performance statistics for SEO operations
 */
export function getSEOPerformanceStats(): {
  operations: {
    name: string;
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
  }[];
  totalOperations: number;
  timeRange: { start: Date | null; end: Date | null };
} {
  if (metricsBuffer.length === 0) {
    return {
      operations: [],
      totalOperations: 0,
      timeRange: { start: null, end: null },
    };
  }

  // Group by operation name
  const grouped = new Map<string, number[]>();

  for (const metric of metricsBuffer) {
    if (!grouped.has(metric.name)) {
      grouped.set(metric.name, []);
    }
    grouped.get(metric.name)!.push(metric.duration);
  }

  // Calculate stats for each operation
  const operations = Array.from(grouped.entries()).map(([name, durations]) => {
    durations.sort((a, b) => a - b);

    const count = durations.length;
    const avgDuration = durations.reduce((a, b) => a + b, 0) / count;
    const minDuration = durations[0];
    const maxDuration = durations[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95Duration = durations[p95Index] || maxDuration;

    return {
      name,
      count,
      avgDuration: Math.round(avgDuration * 100) / 100,
      minDuration: Math.round(minDuration * 100) / 100,
      maxDuration: Math.round(maxDuration * 100) / 100,
      p95Duration: Math.round(p95Duration * 100) / 100,
    };
  });

  // Sort by count descending
  operations.sort((a, b) => b.count - a.count);

  return {
    operations,
    totalOperations: metricsBuffer.length,
    timeRange: {
      start: metricsBuffer[0]?.timestamp || null,
      end: metricsBuffer[metricsBuffer.length - 1]?.timestamp || null,
    },
  };
}

/**
 * Clear performance metrics buffer
 */
export function clearSEOPerformanceMetrics(): void {
  metricsBuffer.length = 0;
}

// ============================================
// SEO-specific performance trackers
// ============================================

/**
 * Track SEO audit performance
 */
export async function trackAuditPerformance<T>(
  productCount: number,
  operation: () => Promise<T>
): Promise<T> {
  return trackPerformance('seo_audit', operation, { productCount });
}

/**
 * Track redirect cache performance
 */
export function trackRedirectCacheHit(isHit: boolean): void {
  recordMetric('redirect_cache', 0, { hit: isHit });
}

/**
 * Track SEO API response time
 */
export async function trackSEOApiResponse<T>(
  endpoint: string,
  method: string,
  operation: () => Promise<T>
): Promise<T> {
  return trackPerformance(`seo_api_${method.toLowerCase()}`, operation, { endpoint });
}

/**
 * Get redirect cache stats
 */
export function getRedirectCacheStats(): {
  totalRequests: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
} {
  const cacheMetrics = metricsBuffer.filter((m) => m.name === 'redirect_cache');

  const hitCount = cacheMetrics.filter((m) => m.metadata?.hit === true).length;
  const missCount = cacheMetrics.filter((m) => m.metadata?.hit === false).length;
  const totalRequests = hitCount + missCount;

  return {
    totalRequests,
    hitCount,
    missCount,
    hitRate: totalRequests > 0 ? Math.round((hitCount / totalRequests) * 100) : 0,
  };
}

// ============================================
// Performance thresholds and alerts
// ============================================

const PERFORMANCE_THRESHOLDS = {
  seo_audit: 5000, // 5 seconds for bulk audit
  seo_api_get: 500, // 500ms for GET requests
  seo_api_post: 1000, // 1 second for POST requests
  seo_api_patch: 1000, // 1 second for PATCH requests
  redirect_lookup: 50, // 50ms for redirect lookup
} as const;

/**
 * Check if any operations are exceeding thresholds
 */
export function getPerformanceAlerts(): {
  operation: string;
  avgDuration: number;
  threshold: number;
  severity: 'warning' | 'critical';
}[] {
  const stats = getSEOPerformanceStats();
  const alerts: {
    operation: string;
    avgDuration: number;
    threshold: number;
    severity: 'warning' | 'critical';
  }[] = [];

  for (const op of stats.operations) {
    const threshold = PERFORMANCE_THRESHOLDS[op.name as keyof typeof PERFORMANCE_THRESHOLDS];

    if (threshold && op.avgDuration > threshold) {
      alerts.push({
        operation: op.name,
        avgDuration: op.avgDuration,
        threshold,
        severity: op.avgDuration > threshold * 2 ? 'critical' : 'warning',
      });
    }
  }

  return alerts;
}
