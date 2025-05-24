# Next.js + Auth.js + Neon + Prisma Boilerplate

This is a starter project with:

- Next.js (App Router, `src/` structure)
- Auth.js (NextAuth) with Google provider
- Neon PostgreSQL serverless database
- Prisma ORM
- TypeScript and ESLint

## Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Generate Prisma client and run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Generate `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
   Paste it into `.env.local`.

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Edit `.env.local` and set:

```env
DATABASE_URL=postgresql://<USER>:<PASSWORD>@<NEON_DB_URL>
NEXTAUTH_SECRET=<YOUR_SECRET>
GOOGLE_ID=<YOUR_GOOGLE_CLIENT_ID>
GOOGLE_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>
```

