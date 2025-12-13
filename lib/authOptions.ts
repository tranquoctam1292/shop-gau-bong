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
        // V1.2: Verify token version on each request (optional - can be done in middleware instead)
        // This is a lightweight check - full verification happens in middleware
        try {
          const { adminUsers } = await getCollections();
          const { ObjectId } = await import('mongodb');
          const user = await adminUsers.findOne(
            { _id: new ObjectId(token.id as string) },
            { projection: { token_version: 1, is_active: 1 } }
          );
          
          if (!user || !user.is_active) {
            // User deleted or inactive - invalidate token
            return { ...token, tokenVersion: -1 };
          }
          
          // Check token version
          if (user.token_version !== token.tokenVersion) {
            // Token revoked - invalidate
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
