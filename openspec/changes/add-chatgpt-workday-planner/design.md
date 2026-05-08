# Design: ChatGPT Sustainable Workday Planner

## Context

The directory already stores published listing content in Sanity and exposes public listing/search
surfaces in the Next.js app. The ChatGPT App should use the same authoritative listing content
without requiring user login or mutating application state.

## Goals

- Provide a read-only ChatGPT App for sustainable workday itinerary planning.
- Use published Sanity listings as the v1 source of truth.
- Separate data tools from widget rendering so ChatGPT can reason over compact tool results before
  choosing whether to render UI.
- Keep missing listing metadata recoverable through user-visible notices.

## Non-Goals

- No authentication, saved itineraries, bookings, payments, reviews, or owner listing changes in v1.
- No external routing or maps dependency in v1.
- No use of authenticated Mongo-backed listing management APIs for planner data.

## Architecture

The app uses an interactive-decoupled ChatGPT Apps pattern:

- `search` and `fetch` expose read-only listing discovery and detail retrieval.
- `plan_sustainable_workday` returns compact `structuredContent` with an itinerary and notices.
- `render_workday_itinerary` attaches the itinerary widget resource and carries the same structured
  itinerary content for the model and widget.
- The widget resource is versioned with a stable URI and uses the MCP Apps HTML MIME type.

The planner data layer queries Sanity directly for published listings and projects only the fields
needed to rank and render candidate stops.

## Tool Guardrails

All v1 tools are read-only, idempotent, non-destructive, and closed-world. The app is available
without account linking. The render tool is the only tool that advertises widget output metadata.
