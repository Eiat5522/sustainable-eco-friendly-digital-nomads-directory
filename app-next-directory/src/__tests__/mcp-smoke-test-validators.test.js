const { describe, expect, it } = require('@jest/globals');
const {
  validatePlannedItinerary,
  validateSearchStructuredContent,
  validateToolWidgetMetadata,
  validateWidgetResource,
} = require('../../scripts/mcp-smoke-test-validators.cjs');

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

describe('mcp smoke test search and widget metadata validation', () => {
  it('accepts standard search structured content', () => {
    expect(() =>
      validateSearchStructuredContent({
        results: [{ id: 'listing-1', title: 'Circular Cafe', url: '/listings/circular-cafe' }],
      })
    ).not.toThrow();
  });

  it('rejects malformed search structured content', () => {
    expect(() => validateSearchStructuredContent({ results: [{ title: 'Circular Cafe' }] })).toThrow(
      'search returned malformed result at index 0'
    );
  });

  it('requires widget metadata on tools that render widgets', () => {
    expect(() =>
      validateToolWidgetMetadata(
        [
          {
            name: 'search',
            _meta: { ui: { resourceUri: 'ui://widget/search.html' } },
          },
          {
            name: 'render_workday_itinerary',
            _meta: { ui: { resourceUri: 'ui://widget/itinerary.html' } },
          },
        ],
        ['search', 'render_workday_itinerary']
      )
    ).not.toThrow();
  });

  it('rejects missing widget metadata on render tools', () => {
    expect(() =>
      validateToolWidgetMetadata([{ name: 'search', _meta: {} }], ['search'])
    ).toThrow('search is missing _meta.ui.resourceUri');
  });

  it('accepts widget resource metadata with MCP Apps HTML MIME type', () => {
    expect(() =>
      validateWidgetResource({
        uri: 'ui://widget/sustainable-workday-itinerary-v1.html',
        mimeType: 'text/html;profile=mcp-app',
        text: '<!doctype html><html></html>',
        _meta: {
          ui: {
            csp: { connectDomains: [], resourceDomains: [] },
            prefersBorder: true,
          },
        },
      })
    ).not.toThrow();
  });

  it('rejects widget resources without MCP Apps metadata', () => {
    expect(() =>
      validateWidgetResource({
        uri: 'ui://widget/sustainable-workday-itinerary-v1.html',
        mimeType: 'text/html',
        text: '<!doctype html><html></html>',
      })
    ).toThrow('widget resource must use text/html;profile=mcp-app');
  });
});
