I have identified the additional points that need modification to ensure the frontend remains season-agnostic and the backend fully manages the season context.

### 1. **Public API: Drivers (`src/app/api/drivers/route.ts`)**
- **Current Behavior**: Returns all drivers marked as `active: true` globally, regardless of whether they are participating in the current season.
- **Change**: Import `getActiveSeason` and filter drivers to include only those associated with the active season (`seasons: { some: { id: activeSeason.id } }`). This ensures the frontend only receives relevant drivers.

### 2. **Admin API: Drivers (`src/app/api/admin/drivers/route.ts`)**
- **Current Behavior**: Returns all drivers by default unless `activeOnly=true` is passed.
- **Change**: Change the default behavior to filter by the active season. Users (Admin) can explicitly request all drivers (e.g., via `all=true` param) if needed for historical management.

### 3. **Admin API: Events (`src/app/api/admin/events/route.ts`)**
- **Current Behavior**: Returns all events by default unless `active=true` is passed.
- **Change**: Default to filtering by the active season (`where.seasonId = activeSeason.id`). Add support for an `all=true` parameter to view historical events.

### 4. **Public/Admin API: All Predictions (`src/app/api/predictions/all/route.ts`)**
- **Current Behavior**: Returns all predictions from all time if no `eventId` is provided.
- **Change**: Default to filtering predictions by the active season (`event: { seasonId: activeSeason.id }`) when no specific event is requested.

### Verification Strategy
- I will verify that all modified endpoints import and use `getActiveSeason` correctly.
- I will ensure that the default path (no parameters) always targets the active season, fulfilling the requirement that the frontend does not need to know about the season.