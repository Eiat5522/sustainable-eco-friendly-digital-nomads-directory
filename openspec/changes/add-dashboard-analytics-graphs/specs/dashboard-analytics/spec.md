## ADDED Requirements

### Requirement: Admin dashboard analytics charts
The system SHALL provide admins with a dashboard that combines current totals with monthly trend charts and categorical breakdown charts.

#### Scenario: Admin loads dashboard analytics
- **WHEN** an authenticated admin or super admin opens `/admin`
- **THEN** the dashboard shows summary metrics for users, listings, reviews, and moderation
- **AND** the dashboard shows monthly trend data for the selected month window
- **AND** the dashboard shows categorical breakdowns for user roles and listing workflow state.

### Requirement: Month-window dashboard filtering
The system SHALL support dashboard analytics windows of 3, 6, or 12 months for admin and venue-owner analytics views.

#### Scenario: User selects a larger window
- **WHEN** an admin or venue owner requests a 6- or 12-month analytics window
- **THEN** the dashboard uses the requested month range
- **AND** any unsupported value is clamped to the supported month windows.

### Requirement: Venue-owner chart-driven analytics
The system SHALL present venue-owner analytics on `/profile` using charts and comparative listing summaries instead of table-only views.

#### Scenario: Venue owner views listing analytics
- **WHEN** a venue owner opens the listing or monthly analytics tabs on `/profile`
- **THEN** the dashboard renders chart-based monthly performance views
- **AND** it shows per-listing comparisons for ratings, reviews, favourites, and views
- **AND** notices and empty states remain visible when analytics data is unavailable.

### Requirement: Motion-safe dashboard interactions
The system SHALL animate dashboard charts and summary metrics subtly while respecting reduced-motion preferences.

#### Scenario: User prefers reduced motion
- **WHEN** the browser reports `prefers-reduced-motion`
- **THEN** dashboard animations are disabled or simplified
- **AND** all dashboard information remains readable and fully usable.
