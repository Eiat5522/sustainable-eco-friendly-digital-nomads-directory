# Change: Add ChatGPT sustainable workday planner

## Why

Digital nomads should be able to ask ChatGPT for a sustainable workday plan using the
directory's curated listings instead of manually searching across cafes, coworking spaces,
restaurants, and activities.

## What Changes

- Add a public, read-only ChatGPT App MCP endpoint for listing discovery and workday planning.
- Add standard read-only `search` and `fetch` tools for listing discovery compatibility.
- Add a `plan_sustainable_workday` data tool that builds an itinerary from published Sanity listings.
- Add a `render_workday_itinerary` render tool that displays the itinerary in an MCP Apps widget.
- Keep v1 unauthenticated and non-mutating: no saved plans, bookings, payments, or listing writes.

## Impact

- Affected specs: `chatgpt-workday-planner`
- Affected code: Next.js app route handlers, Sanity-backed planner data access, planner schemas,
  widget resource generation, focused Jest tests
