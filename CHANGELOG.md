# Changelog

## [Unreleased] - 2026-01-21

### Added
- View Mode Toggle in Prediction Form: Users can now switch between "Top 3" (Legacy) and "Full Grid" views.
- `ViewModeToggle` component.
- Unit tests for PredictionForm view modes.
- `localStorage` persistence for view mode preference.

### Changed
- Refactored `PredictionForm` to support dual view modes regardless of the underlying event scoring type.
- Improved data synchronization between Top 3 selections and Full Grid ordering.
