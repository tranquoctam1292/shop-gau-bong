import 'next-auth';
import { AdminRole, Permission } from '@/types/admin';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: AdminRole;
      permissions?: Permission[];
      tokenVersion?: number; // V1.2: Token version for revocation
    };
  }

  interface User {
    id: string;
    token?: string;
    role?: AdminRole;
    permissions?: Permission[];
    tokenVersion?: number; // V1.2: Token version for revocation
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    id?: string;
    role?: AdminRole;
    permissions?: Permission[];
    tokenVersion?: number; // V1.2: Token version for revocation
  }
}

