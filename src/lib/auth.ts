import { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add role to JWT token when user signs in
      if (user) {
        token.role = user.role || 'PLAYER';
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Add role and userId to session from token
        session.user.role = token.role as UserRole;
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt', // Use JWT strategy for easier role access in middleware
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    error: '/error',
  },
};
