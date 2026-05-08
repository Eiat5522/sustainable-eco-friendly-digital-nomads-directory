## ADDED Requirements

### Requirement: Public Read-Only ChatGPT App

The system SHALL expose a public ChatGPT App MCP endpoint for sustainable workday planning without
requiring user authentication.

#### Scenario: App works without account linking

- **WHEN** ChatGPT connects to the MCP endpoint
- **THEN** the planner tools are available without user login
- **AND** every v1 tool is read-only and non-mutating

### Requirement: Listing Search And Fetch Tools

The system SHALL provide read-only listing discovery tools that can search published listings and
fetch a single listing by id or slug.

#### Scenario: Search returns published listing references

- **WHEN** ChatGPT searches for sustainable workspaces in a city
- **THEN** the system returns matching published listing references with titles and canonical URLs

#### Scenario: Fetch returns listing detail text

- **WHEN** ChatGPT fetches a known listing id or slug
- **THEN** the system returns listing detail text and metadata suitable for citation and reasoning

### Requirement: Sustainable Workday Planning

The system SHALL build a deterministic itinerary from published Sanity listings using the requested
city, schedule, budget, work style, priorities, and dietary needs.

#### Scenario: Candidate listings cover the workday

- **WHEN** matching cafe, coworking, restaurant, and activity listings exist
- **THEN** the system returns an itinerary with ordered stops and reasons for each selection

#### Scenario: Listing data is incomplete

- **WHEN** useful listings are missing opening hours, coordinates, or category coverage
- **THEN** the system returns the best available itinerary with explicit notices

### Requirement: Itinerary Widget Rendering

The system SHALL provide a render tool that displays a planned itinerary in a ChatGPT App widget.

#### Scenario: Render tool attaches the widget template

- **WHEN** ChatGPT calls the itinerary render tool
- **THEN** the tool result includes the itinerary structured content
- **AND** the tool result advertises the versioned widget resource URI
