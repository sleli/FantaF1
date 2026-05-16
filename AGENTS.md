# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

FantaF1 is a Fantasy Formula 1 platform for small groups. Users make predictions on race/sprint results, earn points based on accuracy, and compete on leaderboards. Built with Next.js (App Router), NextAuth.js, PostgreSQL/Prisma, and TypeScript.

## Essential Commands

### Development
```bash
npm run dev                    # Start development server on localhost:3000
npm run build                  # Build for production (includes prisma generate)
npm start                      # Start production server
npm test                       # Run Jest tests
npm run test:drivers          # Test driver data script
```

### Database Operations
```bash
npm run db:push               # Push Prisma schema to database + seed
npm run db:seed               # Seed drivers (F1 2025 grid)
npm run db:reset              # Reset database and reseed
npx prisma studio             # Open Prisma Studio GUI
npx tsx scripts/test-db.ts    # Test database connection
npx prisma migrate dev        # Create and apply migrations
```

### Prisma Workflow
After modifying `prisma/schema.prisma`:
1. Run `npx prisma migrate dev --name <description>` for production changes
2. Or `npm run db:push` for rapid prototyping (development only)
3. Always regenerate Prisma Client: `npx prisma generate`

## Architecture

### Authentication & Authorization

**Invite-Only System:**
- Registration is RESTRICTED: Users cannot sign up freely.
- Admins must invite users via `/admin/users` (creates user with `PENDING` status).
- **Login Guard**: `signIn` callback in `src/lib/auth.ts` blocks Google login if user does not exist in DB.
- **Auto-Accept**: If invited user (`PENDING`) logs in with Google matching email, status updates to `ACCEPTED`.

**Two-Level Security:**
1. **Middleware** (`/middleware.ts`): First line of defense, validates JWT tokens before requests reach pages/API
   - Protects `/admin/*` routes (requires ADMIN role)
   - Protects `/profile/*` routes (requires authentication)
   - Supports maintenance mode via `MAINTENANCE_MODE=true` env var

2. **API Route Protection** (`/src/lib/auth/api-auth.ts`):
   - Use `withAuthAPI()` wrapper for API handlers requiring auth/role
   - Example: `withAuthAPI(handler, { requiredRole: 'ADMIN' })`

**Session Management:**
- JWT-based sessions (not database sessions)
- Session includes: `id`, `email`, `name`, `image`, `role`
- Role checked from JWT token (no DB query in middleware)
- Types extended in `/src/types/next-auth.d.ts`

**Auth Configuration** (`/src/lib/auth.ts`):
- Google OAuth + Credentials providers
- Prisma adapter for User/Session/Account management
- Passwords hashed with bcryptjs

### Database Schema (Prisma)

**Core Models:**
- **User**: Player accounts with role (ADMIN/PLAYER)
- **Season**: Container for events/drivers, has `isActive` flag and `scoringType`
- **Driver**: F1 drivers in a season (unique by seasonId + number)
- **Event**: Races/Sprints with status (UPCOMING/CLOSED/COMPLETED)
- **Prediction**: User predictions for events (one per user per event)

**Key Relationships:**
- Season → Events (one-to-many)
- Season → Drivers (one-to-many)
- Event → Predictions (one-to-many)
- User → Predictions (one-to-many)
- Event → Driver (results: firstPlaceId, secondPlaceId, thirdPlaceId)

**Important Constraints:**
- Only ONE season should have `isActive=true`
- Prediction unique on (userId, eventId)
- Driver unique on (seasonId, number)

### Scoring System

**Location:** `/src/lib/scoring.ts`

**Strategy Pattern Implementation:**
Two scoring algorithms based on `Season.scoringType`:

1. **LEGACY_TOP3** (Traditional):
   - Predict top 3 finishers
   - Points: Race (25/15/10/5), Sprint (12.5/7.5/5/2.5)
   - Correct position = full points, wrong position = bonus points

2. **FULL_GRID_DIFF** (Advanced):
   - Predict full 20-driver grid order
   - Score = sum of absolute position differences (lower is better)
   - Sprint scores multiplied by 0.5
   - Missing driver penalty = 20 points

**Key Functions:**
- `calculateScore(prediction, event, drivers)` - Main scoring entry point
- `calculateLeaderboard(predictions, scoringType)` - Aggregate user rankings
- `validatePrediction()` / `validateEventResults()` - Validation before scoring

**Score Calculation Flow:**
1. Admin sets Event results (top 3 or full grid in `results` JSON field)
2. Admin triggers POST `/api/admin/events/[id]/calculate-scores`
3. System auto-fills missing predictions (copies last prediction)
4. Scores calculated for all predictions using appropriate strategy
5. Points saved to `Prediction.points` field

### Season Management

**Active Season Pattern:**
- System assumes ONE active season at a time
- Cached query: `getActiveSeason()` in `/src/lib/season.ts`
- Cache duration: 1 hour (Next.js `unstable_cache`)
- All queries/mutations filter by active season

**Changing Seasons:**
1. Set old season `isActive=false`
2. Set new season `isActive=true`
3. Active season cache auto-revalidates hourly

### API Route Patterns

**Public Authenticated Routes:**
- `/api/events` - List events (query: ?status=UPCOMING&type=RACE)
- `/api/predictions` - User predictions (GET/POST)
- `/api/leaderboard` - Rankings (query: ?eventId=123 for event-specific)
- `/api/drivers` - Drivers in active season

**Admin Routes:**
- `/api/admin/events` - Event CRUD
- `/api/admin/drivers` - Driver CRUD
- `/api/admin/users` - User management
- `/api/admin/events/[id]/calculate-scores` - **Critical**: Score calculation endpoint
- `/api/admin/bulk-predictions` - Bulk import predictions

**Route Protection Example:**
```typescript
// In /src/app/api/admin/example/route.ts
import { withAuthAPI } from '@/lib/auth/api-auth';

async function handler(req: Request) {
  // Your logic here - user is authenticated and is ADMIN
}

export const POST = withAuthAPI(handler, { requiredRole: 'ADMIN' });
```

### Component Organization

**Structure:**
- `/src/components/ui/` - Base primitives (Button, Card, Input, etc.)
- `/src/components/admin/` - Admin-specific (AdminSidebar, DriverList, EventForm)
- `/src/components/auth/` - Auth-related (AuthStatus, UserMenu, withAuth HOC)
- `/src/components/events/` - Event display components
- `/src/components/predictions/` - Prediction forms and lists
- `/src/components/layout/` - Layout components (PublicLayout)

**Key Components:**
- `AdminSidebar.tsx` - Complex navigation with mobile/desktop responsive handling
- `PredictionForm.tsx` - Handles both LEGACY_TOP3 and FULL_GRID_DIFF input
- `EventForm.tsx` - Event creation/editing with result input
- `ScoringTestComponent.tsx` - Admin debugging tool for scoring system

### Providers Setup

**Root Layout** (`/src/app/layout.tsx`):
```tsx
<Providers>
  <SessionProvider>    {/* NextAuth */}
    <ThemeProvider>    {/* Dark/light mode */}
      {children}
    </ThemeProvider>
  </SessionProvider>
</Providers>
```

**Default Theme:** Dark mode enforced (`forcedTheme="dark"` in layout)

## Common Development Patterns

### Adding a New Admin Page
1. Create page: `/src/app/admin/new-feature/page.tsx`
2. Add API route: `/src/app/api/admin/new-feature/route.ts`
3. Use `withAuthAPI()` wrapper with `requiredRole: 'ADMIN'`
4. Middleware automatically protects `/admin/*` routes

### Adding a New Scoring Type
1. Add enum value to `ScoringType` in `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add-new-scoring`
3. Create strategy class in `/src/lib/scoring.ts` implementing `ScoringStrategy` interface
4. Update `calculateScore()` to handle new type
5. Update `PredictionForm.tsx` to render appropriate input UI
6. Test with admin scoring test page

### Modifying Database Schema
1. Edit `/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe_change`
3. Update TypeScript types in `/src/lib/types.ts` if needed
4. Regenerate Prisma Client: `npx prisma generate`
5. Update seed script if new fields need default data

### Testing Predictions & Scoring
Use admin panel's scoring test page:
1. Navigate to `/admin/events/scoring-test`
2. Select event and predictions to test
3. View calculated scores without saving to database
4. Debug scoring logic issues

## Important Architectural Decisions

1. **JWT vs Database Sessions**: JWT chosen for faster middleware checks (no DB query per request)
2. **Single Active Season**: Simplifies queries; all operations assume one active season
3. **Strategy Pattern for Scoring**: Allows multiple scoring algorithms to coexist
4. **Auto-Fill Missing Predictions**: Copies user's last prediction if they miss deadline (fairness)
5. **Middleware-First Auth**: Authorization happens before pages/API handlers execute
6. **Cached Active Season**: Reduces DB load; revalidates hourly via Next.js cache
7. **Two Result Storage Methods**: Events store both categorical (driver IDs) and array (full grid JSON)

## Environment Variables

Required in `.env` or `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fantaf1?schema=public"
NEXTAUTH_SECRET="generate-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_ID="your-google-oauth-client-id"
GOOGLE_SECRET="your-google-oauth-client-secret"

# Optional
MAINTENANCE_MODE="false"  # Set to "true" to enable maintenance mode
```

## Code Style & Conventions

- **Language**: Italian for UI strings (buttons, labels, messages)
- **TypeScript**: Strict mode enabled
- **File Naming**:
  - Components: PascalCase (e.g., `UserMenu.tsx`)
  - Utilities: camelCase (e.g., `scoring.ts`)
  - Pages: lowercase (e.g., `page.tsx`, route.ts)
- **Component Pattern**: Functional components with TypeScript interfaces for props
- **State Management**: React hooks (no Redux/Zustand)
- **Styling**: Tailwind CSS utility classes
- **Layout Width**: Use `.page-container` for public page wrappers to keep width/padding consistent
- **Desktop Framing**: Use `.page-desktop-card` inside `.page-container` to add a frame only on md+
- **Background**: Prefer uniform backgrounds; avoid page-specific pattern overlays

## Testing

- **Unit Tests**: Jest + React Testing Library
- **Config**: `jest.config.js` + `jest.setup.js`
- **Run Tests**: `npm test`
- **Test Location**: Place tests next to source files as `*.test.ts` or `*.test.tsx`

## Mobile-First Design

- Pull-to-refresh gesture detection (`useSwipe` hook)
- Touch feedback components
- Responsive AdminSidebar (hamburger menu on mobile)
- Mobile viewport configured in root layout

## Maintenance Mode

Set `MAINTENANCE_MODE=true` in environment to redirect all users to `/maintenance` page. Auth endpoints remain accessible.

## Debugging Tips

1. **Prisma Queries**: Use `npx prisma studio` to inspect database visually
2. **Auth Issues**: Check JWT token in browser DevTools → Application → Cookies
3. **Scoring Bugs**: Use `/admin/events/scoring-test` page to test calculations
4. **Middleware Logs**: Add console.logs in `/middleware.ts` to debug auth flow
5. **API Errors**: Check Network tab for detailed error responses (JSON format)

## Performance Considerations

- Active season queries are cached (1 hour TTL)
- Prisma Client singleton prevents multiple instances in dev
- Lazy loading for large prediction grids (FULL_GRID_DIFF)
- Images use `LazyImage` component for deferred loading
