import { NextAuthOptions } from 'next-auth';
import Google from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { compare } from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Inserisci email e password');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          throw new Error('Utente non trovato o password non impostata');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Password non valida');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Quando un utente invitato accede con Google OAuth, aggiorna invitationStatus
      if (account?.provider === 'google' && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, invitationStatus: true }
        });

        // 1. BLOCCA l'accesso se l'utente non esiste nel database (Sistema Invite-Only)
        if (!existingUser) {
          return false; // O lanciare un errore personalizzato se NextAuth lo supporta bene nella UI
        }

        // 2. Se l'utente è PENDING, accetta l'invito
        if (existingUser.invitationStatus === 'PENDING') {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              invitationToken: null,
              invitationStatus: 'ACCEPTED'
            }
          });
        }
      }
      return true;
    },
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
    signIn: '/login',
    error: '/error',
  },
};
