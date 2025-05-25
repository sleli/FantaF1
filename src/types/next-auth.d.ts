import { UserRole } from '@prisma/client';
import 'next-auth';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role?: UserRole;
  }
}

// Extend JWT payload to include role
declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    userId?: string;
  }
}
