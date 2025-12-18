/**
 * NextAuth API Route
 * 
 * Handles authentication for admin panel
 * 
 * 🔒 SECURITY FIX: Rate limiting is now enforced in authorize function
 * This prevents brute force attacks even if attacker bypasses /api/admin/auth/login
 * 
 * Rate limiting is username-based (5 attempts per 15 minutes per username)
 * This is effective because attacker needs to know username to attack
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
