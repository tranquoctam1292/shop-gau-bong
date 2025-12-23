/**
 * Validation Error Helpers
 * 
 * Standardized error messages for Zod validation errors
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Format Zod validation errors to user-friendly Vietnamese messages
 */
export function formatValidationErrors(error: z.ZodError): Array<{
  field: string;
  message: string;
}> {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message || 'Dữ liệu không hợp lệ',
  }));
}

/**
 * Create a standardized validation error response
 */
export function createValidationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      error: 'Dữ liệu không hợp lệ',
      details: formatValidationErrors(error),
    },
    { status: 400 }
  );
}

/**
 * Handle Zod validation errors in API routes
 * 
 * Usage:
 * ```typescript
 * try {
 *   const validatedData = schema.parse(body);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     return handleValidationError(error);
 *   }
 *   throw error;
 * }
 * ```
 */
export function handleValidationError(error: unknown) {
  if (error instanceof z.ZodError) {
    return createValidationErrorResponse(error);
  }
  return null;
}
