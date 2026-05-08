import {
  callWorkdayTool,
  createWorkdayMcpServer,
  getWorkdayToolDescriptors,
  WORKDAY_RENDER_TOOL_NAME,
} from '../mcp-server';
import { WORKDAY_WIDGET_RESOURCE } from '../workday-widget';
import { fetchListingCandidate, fetchListingCandidates, searchListingReferences } from '../listing-candidates';

jest.mock('../listing-candidates', () => ({
  fetchListingCandidate: jest.fn(),
  fetchListingCandidates: jest.fn(),
  searchListingReferences: jest.fn(),
}));

const searchMock = jest.mocked(searchListingReferences);
const fetchCandidateMock = jest.mocked(fetchListingCandidate);
const fetchCandidatesMock = jest.mocked(fetchListingCandidates);

describe('ChatGPT workday MCP server helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('describes all v1 tools as read-only and non-mutating', () => {
    const descriptors = getWorkdayToolDescriptors();

    expect(descriptors.map(tool => tool.name)).toEqual([
      'search',
      'fetch',
      'plan_sustainable_workday',
      WORKDAY_RENDER_TOOL_NAME,
    ]);
    expect(descriptors.every(tool => tool.annotations.readOnlyHint)).toBe(true);
    expect(descriptors.every(tool => tool.annotations.destructiveHint === false)).toBe(true);
    expect(descriptors.find(tool => tool.name === WORKDAY_RENDER_TOOL_NAME)?._meta).toMatchObject({
      ui: { resourceUri: WORKDAY_WIDGET_RESOURCE.uri },
      'openai/outputTemplate': WORKDAY_WIDGET_RESOURCE.uri,
    });
  });

  it('returns standard search results as JSON text content', async () => {
    searchMock.mockResolvedValueOnce([
      { id: 'listing-1', title: 'Green Desk', url: '/listings/green-desk' },
    ]);

    const result = await callWorkdayTool('search', { query: 'green coworking Bangkok' });

    expect(result.content).toEqual([
      {
        type: 'text',
        text: JSON.stringify({
          results: [{ id: 'listing-1', title: 'Green Desk', url: '/listings/green-desk' }],
        }),
      },
    ]);
  });

  it('plans a workday from listing candidates', async () => {
    fetchCandidatesMock.mockResolvedValueOnce([
      {
        id: 'cafe-1',
        name: 'Circular Cafe',
        slug: 'circular-cafe',
        type: 'cafe',
        city: { name: 'Bangkok', country: 'Thailand', slug: 'bangkok' },
        address: null,
        location: null,
        shortDescription: null,
        longDescription: null,
        website: null,
        priceRange: 'moderate',
        imageUrl: null,
        ecoFocusTags: ['Zero Waste'],
        digitalNomadFeatures: ['Wi-Fi'],
        amenities: [],
        openingHours: [],
        planningNotes: [],
        canonicalUrl: '/listings/circular-cafe',
      },
    ]);

    const result = await callWorkdayTool('plan_sustainable_workday', { city: 'Bangkok' });

    expect(result.structuredContent).toEqual({
      itinerary: expect.objectContaining({
        city: 'Bangkok',
        stops: expect.arrayContaining([
          expect.objectContaining({ listing: expect.objectContaining({ slug: 'circular-cafe' }) }),
        ]),
      }),
    });
  });

  it('renders the itinerary with widget metadata', async () => {
    const result = await callWorkdayTool('render_workday_itinerary', {
      itinerary: {
        city: 'Bangkok',
        generatedAt: '2026-05-08T01:00:00.000Z',
        summary: 'A sustainable workday.',
        stops: [],
        notices: [],
      },
    });

    expect(result._meta).toMatchObject({
      ui: { resourceUri: WORKDAY_WIDGET_RESOURCE.uri },
      'openai/outputTemplate': WORKDAY_WIDGET_RESOURCE.uri,
    });
  });

  it('creates an MCP server instance', () => {
    expect(createWorkdayMcpServer().isConnected()).toBe(false);
  });
});
