const { describe, expect, it } = require('@jest/globals');
const { validatePlannedItinerary } = require('../../scripts/mcp-smoke-test-validators.cjs');

describe('mcp smoke test itinerary validation', () => {
  it('accepts empty itineraries when notices explain missing listing data', () => {
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

  it('rejects empty itineraries without notices', () => {
    expect(() =>
      validatePlannedItinerary({
        city: 'Bangkok',
        generatedAt: '2026-05-15T00:00:00.000Z',
        summary: 'No sustainable workday stops could be planned for Bangkok.',
        stops: [],
        notices: [],
      })
    ).toThrow('Empty itineraries should explain why no stops were returned');
  });

  it('rejects empty itineraries with unrelated notices', () => {
    expect(() =>
      validatePlannedItinerary({
        city: 'Bangkok',
        generatedAt: '2026-05-15T00:00:00.000Z',
        summary: 'No sustainable workday stops could be planned for Bangkok.',
        stops: [],
        notices: ['The weather was rainy today.'],
      })
    ).toThrow('Empty itineraries should explain why no stops were returned');
  });
});
