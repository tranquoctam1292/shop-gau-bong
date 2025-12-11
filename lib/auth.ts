/**
 * Auth utilities
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get current session (server-side)
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Check if user is authenticated and is admin
 */
export async function requireAdmin() {
  const session = await getSession();
  
  if (!session || (session.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  return session;
}

