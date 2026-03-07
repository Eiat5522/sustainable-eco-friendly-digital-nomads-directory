# Change: Add graph-driven admin and owner dashboards

## Why
The admin dashboard is currently a simplified placeholder, and venue-owner analytics on `/profile` are table-heavy despite the repo already exposing monthly metrics. The product needs graph-based dashboards with subtle micro-interactions so admins and listing owners can understand trends at a glance.

## What Changes
- Restore the admin dashboard with summary cards and charts backed by new monthly analytics.
- Upgrade the venue-owner dashboard on `/profile` to use chart-driven analytics and richer per-listing comparisons.
- Add month-window support for admin analytics and profile analytics views.
- Reuse the existing `recharts` stack and add reduced-motion-safe dashboard interactions.

## Impact
- Affected specs: `dashboard-analytics`
- Affected code: admin analytics service and route, admin dashboard page/client, profile page/client, shared dashboard chart components, related tests.
