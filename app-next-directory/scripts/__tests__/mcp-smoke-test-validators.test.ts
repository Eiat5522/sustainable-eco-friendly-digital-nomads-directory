import { describe, expect, it } from '@jest/globals';

describe('mcp smoke test itinerary validation', () => {
  it('accepts empty itineraries when notices explain missing listing data', async () => {
    const { validatePlannedItinerary } = await import('../mcp-smoke-test-validators.mjs');

    expect(() =>
      validatePlannedItinerary({
        city: 'Bangkok',
        generatedAt: '2026-05-15T00:00:00.000Z',
        summary: 'No sustainable workday stops could be planned for Bangkok.',
        stops: [],
        notices: ['No published listings were available for this city.'],
      })
    ).not.toThrow();
  });
});
