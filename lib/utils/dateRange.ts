/**
 * Date Range Utilities for Dashboard
 * 
 * Functions for calculating date ranges with Vietnam timezone (UTC+7)
 * Handles timezone conversion and validation
 */

import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, subMonths } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

/**
 * Get today's date range in Vietnam timezone
 * Returns start and end of today in UTC (for MongoDB queries)
 */
export function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const vietnamNow = toZonedTime(now, VIETNAM_TZ);
  const start = fromZonedTime(startOfDay(vietnamNow), VIETNAM_TZ);
  const end = fromZonedTime(endOfDay(vietnamNow), VIETNAM_TZ);
  return { start, end };
}

/**
 * Get this month's date range in Vietnam timezone
 * Returns start and end of current month in UTC
 */
export function getThisMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const vietnamNow = toZonedTime(now, VIETNAM_TZ);
  const start = fromZonedTime(startOfMonth(vietnamNow), VIETNAM_TZ);
  const end = fromZonedTime(endOfMonth(vietnamNow), VIETNAM_TZ);
  return { start, end };
}

/**
 * Get this week's date range in Vietnam timezone
 * Returns start and end of current week in UTC
 */
export function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const vietnamNow = toZonedTime(now, VIETNAM_TZ);
  const start = fromZonedTime(startOfWeek(vietnamNow, { weekStartsOn: 1 }), VIETNAM_TZ); // Monday
  const end = fromZonedTime(endOfWeek(vietnamNow, { weekStartsOn: 1 }), VIETNAM_TZ);
  return { start, end };
}

/**
 * Get yesterday's date range in Vietnam timezone
 * Returns start and end of yesterday in UTC (for MongoDB queries)
 */
export function getYesterdayRange(): { start: Date; end: Date } {
  const now = new Date();
  const vietnamNow = toZonedTime(now, VIETNAM_TZ);
  const yesterday = subDays(vietnamNow, 1);
  const start = fromZonedTime(startOfDay(yesterday), VIETNAM_TZ);
  const end = fromZonedTime(endOfDay(yesterday), VIETNAM_TZ);
  return { start, end };
}

/**
 * Get last 7 days date range in Vietnam timezone
 * Returns from 7 days ago to today (inclusive)
 */
export function getLast7DaysRange(): { start: Date; end: Date } {
  const now = new Date();
  const vietnamNow = toZonedTime(now, VIETNAM_TZ);
  const sevenDaysAgo = subDays(vietnamNow, 6); // 6 days ago + today = 7 days
  const start = fromZonedTime(startOfDay(sevenDaysAgo), VIETNAM_TZ);
  const end = fromZonedTime(endOfDay(vietnamNow), VIETNAM_TZ);
  return { start, end };
}

/**
 * Get last month's date range in Vietnam timezone
 * Returns start and end of last month in UTC
 */
export function getLastMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const vietnamNow = toZonedTime(now, VIETNAM_TZ);
  const lastMonth = subMonths(vietnamNow, 1);
  const start = fromZonedTime(startOfMonth(lastMonth), VIETNAM_TZ);
  const end = fromZonedTime(endOfMonth(lastMonth), VIETNAM_TZ);
  return { start, end };
}

/**
 * Get custom date range from ISO date strings
 * Returns start and end dates in UTC
 */
export function getCustomRange(startDate: string, endDate: string): { start: Date; end: Date } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Convert to Vietnam timezone for start/end of day
  const vietnamStart = toZonedTime(start, VIETNAM_TZ);
  const vietnamEnd = toZonedTime(end, VIETNAM_TZ);
  
  // Get start of day for start date, end of day for end date
  const startOfStartDay = fromZonedTime(startOfDay(vietnamStart), VIETNAM_TZ);
  const endOfEndDay = fromZonedTime(endOfDay(vietnamEnd), VIETNAM_TZ);
  
  return { start: startOfStartDay, end: endOfEndDay };
}

/**
 * Validate date range
 * Returns validation result with error message if invalid
 */
export function validateDateRange(start: Date, end: Date): { valid: boolean; error?: string } {
  // Check if dates are valid
  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Start date is invalid' };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, error: 'End date is invalid' };
  }
  
  // Check if start is before end
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  // Check max range (1 year)
  const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
  if (end.getTime() - start.getTime() > maxRange) {
    return { valid: false, error: 'Date range cannot exceed 1 year' };
  }
  
  // Check if end date is in the future
  const now = new Date();
  if (end > now) {
    return { valid: false, error: 'End date cannot be in the future' };
  }
  
  return { valid: true };
}

/**
 * Get date range based on dateRange option
 */
export function getDateRange(
  dateRange: 'today' | 'yesterday' | 'last7Days' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom',
  startDate?: string,
  endDate?: string
): { start: Date; end: Date; error?: string } {
  switch (dateRange) {
    case 'today':
      return getTodayRange();
    case 'yesterday':
      return getYesterdayRange();
    case 'last7Days':
      return getLast7DaysRange();
    case 'thisWeek':
      return getThisWeekRange();
    case 'thisMonth':
      return getThisMonthRange();
    case 'lastMonth':
      return getLastMonthRange();
    case 'custom':
      if (!startDate || !endDate) {
        return {
          start: new Date(),
          end: new Date(),
          error: 'Start date and end date are required for custom range',
        };
      }
      const range = getCustomRange(startDate, endDate);
      const validation = validateDateRange(range.start, range.end);
      if (!validation.valid) {
        return {
          start: range.start,
          end: range.end,
          error: validation.error,
        };
      }
      return range;
    default:
      // Fallback to today
      return getTodayRange();
  }
}

/**
 * Format date for MongoDB $dateToString aggregation
 * Returns format string based on groupBy option
 */
export function getDateToStringFormat(groupBy: 'day' | 'hour' | 'week'): string {
  switch (groupBy) {
    case 'day':
      return '%Y-%m-%d';
    case 'hour':
      return '%Y-%m-%d-%H';
    case 'week':
      return '%Y-%W'; // Year-Week number
    default:
      return '%Y-%m-%d';
  }
}

/**
 * Get appropriate groupBy option based on date range
 * Single day ranges (today, yesterday) use 'hour' for granularity
 * Multi-day ranges use 'day' for readability
 */
export function getGroupByForDateRange(
  dateRange: 'today' | 'yesterday' | 'last7Days' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'custom'
): 'day' | 'hour' | 'week' {
  switch (dateRange) {
    case 'today':
    case 'yesterday':
      return 'hour'; // Show hourly data for single day
    case 'last7Days':
    case 'thisWeek':
    case 'thisMonth':
    case 'lastMonth':
      return 'day'; // Show daily data for ranges > 1 day
    case 'custom':
    default:
      return 'day'; // Default to day for custom ranges
  }
}

