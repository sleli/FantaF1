# API Documentation: Active Season Behavior

## Overview
All API endpoints that return season-dependent data (Events, Predictions, Leaderboard) enforce a strict check for an **Active Season**.

## General Rules
1. **Active Season Check**:
   - The backend always verifies if a season is marked as `isActive: true`.
   - If **NO active season** exists, the API returns `204 No Content` (empty response body).
   - If an active season exists, data is automatically filtered by that season's ID.

2. **Parameter Validation**:
   - Endpoints validate query parameters.
   - Unsupported parameters are ignored and logged as warnings.
   - Strict mode: currently we log warnings, but future updates might return `400 Bad Request`.

## Endpoints

### 1. `GET /api/events`
Returns events for the **active season**.

- **Response (Active Season Exists):**
  - Status: `200 OK`
  - Body: `{ events: [...] }`
- **Response (No Active Season):**
  - Status: `204 No Content`
  - Body: `null`

### 2. `GET /api/predictions`
Returns user predictions for the **active season**.

- **Response (Active Season Exists):**
  - Status: `200 OK`
  - Body: `[ ... ]`
- **Response (No Active Season):**
  - Status: `204 No Content`
  - Body: `null`

### 3. `GET /api/leaderboard`
Returns leaderboard for the **active season**.

- **Response (Active Season Exists):**
  - Status: `200 OK`
  - Body: `{ season: ..., leaderboard: ... }`
- **Response (No Active Season):**
  - Status: `204 No Content`
  - Body: `null`

## Error Handling
- **401 Unauthorized**: User is not logged in.
- **500 Internal Server Error**: Database or server error.
