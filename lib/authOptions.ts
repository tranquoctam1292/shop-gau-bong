/**
 * NextAuth Configuration
 * 
 * Separated from route handler to comply with Next.js App Router requirements
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getCollections } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { comparePassword } from '@/lib/utils/passwordUtils';
import { AdminRole } from '@/types/admin';

/**
 * ✅ PERFORMANCE: In-memory cache for user status (token_version, is_active)
 * Cache TTL: 2 minutes (120 seconds)
 * This reduces database queries from every request to once per 2 minutes per user
 */
interface CachedUserStatus {
  token_version: number;
  is_active: boolean;
  cachedAt: number; // Timestamp
}

const userStatusCache = new Map<string, CachedUserStatus>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Get cached user status or fetch from database
 */
async function getUserStatus(userId: string): Promise<{ token_version: number; is_active: boolean } | null> {
  const cached = userStatusCache.get(userId);
  const now = Date.now();

  // Check if cache is valid
  if (cached && (now - cached.cachedAt) < CACHE_TTL_MS) {
    return {
      token_version: cached.token_version,
      is_active: cached.is_active,
    };
  }

  // Cache miss or expired - fetch from database
  try {
    const { adminUsers } = await getCollections();
    const { ObjectId } = await import('mongodb');
    const user = await adminUsers.findOne(
      { _id: new ObjectId(userId) },
      { projection: { token_version: 1, is_active: 1 } }
    );

    if (!user) {
      return null;
    }

    // Update cache
    userStatusCache.set(userId, {
      token_version: user.token_version || 0,
      is_active: user.is_active || false,
      cachedAt: now,
    });

    return {
      token_version: user.token_version || 0,
      is_active: user.is_active || false,
    };
  } catch (error) {
    console.error('[NextAuth] Error fetching user status:', error);
    // Return cached value if available (even if expired) as fallback
    if (cached) {
      return {
        token_version: cached.token_version,
        is_active: cached.is_active,
      };
    }
    return null;
  }
}

/**
 * Invalidate cache for a user (call when user status changes)
 */
export function invalidateUserStatusCache(userId: string): void {
  userStatusCache.delete(userId);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const { adminUsers } = await getCollections();
          
          // Find user by username (for RBAC, we use username instead of email)
          const user = await adminUsers.findOne({ username: credentials.username });
          
          if (!user) {
            return null;
          }

          // Check if user is active
          if (!user.is_active) {
            return null;
          }

          // Verify password using passwordUtils
          const isValidPassword = await comparePassword(
            credentials.password,
            user.password_hash
          );

          if (!isValidPassword) {
            return null;
          }

          // Update last_login
          await adminUsers.updateOne(
            { _id: user._id },
            { $set: { last_login: new Date() } }
          );

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.full_name,
            role: user.role as AdminRole,
            permissions: user.permissions || [],
            tokenVersion: user.token_version || 0, // V1.2: Include token version
          };
        } catch (error) {
          console.error('[NextAuth] Error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions || [];
        token.tokenVersion = (user as any).tokenVersion || 0; // V1.2: Store token version
      } else if (token.id) {
        // ✅ PERFORMANCE: Use cached user status instead of querying DB every request
        // Cache TTL: 2 minutes - reduces DB queries from every request to once per 2 minutes per user
        // Full verification still happens in middleware for critical operations
        try {
          const userStatus = await getUserStatus(token.id as string);
          
          if (!userStatus || !userStatus.is_active) {
            // User deleted or inactive - invalidate token
            return { ...token, tokenVersion: -1 };
          }
          
          // Check token version
          if (userStatus.token_version !== token.tokenVersion) {
            // Token revoked - invalidate token and cache
            invalidateUserStatusCache(token.id as string);
            return { ...token, tokenVersion: -1 };
          }
        } catch (error) {
          // On error, don't invalidate token (will be checked in middleware)
          console.error('[NextAuth JWT] Error verifying token version:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions || [];
        (session.user as any).tokenVersion = token.tokenVersion || 0; // V1.2: Include token version
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    // V1.2: Secure cookies configuration
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // Only in production (HTTPS required)
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // CRITICAL FIX: Remove hardcoded fallback - throw error if secret is missing
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error(
        'NEXTAUTH_SECRET is required. ' +
        'Please set it in your .env.local file (development) or Environment Variables (production). ' +
        'Generate one with: openssl rand -base64 32'
      );
    }
    return secret;
  })(),
  debug: process.env.NODE_ENV === 'development',
};
