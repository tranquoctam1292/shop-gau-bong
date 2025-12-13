/**
 * NextAuth API Route
 * 
 * Handles authentication for admin panel
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

