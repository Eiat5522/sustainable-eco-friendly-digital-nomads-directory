import { MCPServer, error, object, text, widget } from 'mcp-use/server';
import type {
  ListingCandidate as SharedListingCandidate,
  WorkdayPlanInput as SharedWorkdayPlanInput,
} from '../app-next-directory/src/lib/workday-domain/schemas';
import { planSustainableWorkday } from '../app-next-directory/src/lib/workday-domain/planner';
import {
  fetchListingCandidate,
  fetchListingCandidates,
  hasSanityConfiguration,
  searchListingReferences,
} from './src/lib/workday-service';
import {
  fetchToolSchema,
  listingFetchOutputSchema,
  renderWorkdayInputSchema,
  searchToolOutputSchema,
  searchToolSchema,
  workdayPlanOutputSchema,
  workdayPlanToolSchema,
} from './src/lib/workday-schemas';

const server = new MCPServer({
  name: 'sustainable-workday-planner',
  title: 'Sustainable Workday Planner MCP Apps Server',
  version: '0.1.0',
  description: 'Phase 1 MCP Apps server for sustainable workday planning and itinerary browsing.',
  baseUrl: process.env.MCP_URL || 'http://localhost:3000',
  favicon: 'favicon.ico',
  websiteUrl: 'https://github.com/Eiat5522/sustainable-eco-friendly-digital-nomads-directory',
  icons: [
    {
      src: 'icon.svg',
      mimeType: 'image/svg+xml',
      sizes: ['512x512'],
    },
  ],
});

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;

const directoryBaseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL ?? process.env.FRONTEND_URL ?? process.env.SITE_URL ?? '';

const resolveListingUrl = (href: string): string => {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('/') && directoryBaseUrl) {
    return new URL(href, directoryBaseUrl).toString();
  }
  return href;
};

const normalizeListing = (listing: SharedListingCandidate): SharedListingCandidate => ({
  ...listing,
  website: listing.website ? resolveListingUrl(listing.website) : listing.website,
  imageUrl: listing.imageUrl,
  canonicalUrl: resolveListingUrl(listing.canonicalUrl),
});

const normalizeItinerary = (itinerary: ReturnType<typeof planSustainableWorkday>) => ({
  ...itinerary,
  stops: itinerary.stops.map(stop => ({
    ...stop,
    listing: normalizeListing(stop.listing),
  })),
});

const listingNarrative = (listing: SharedListingCandidate): string =>
  [
    listing.shortDescription,
    listing.longDescription,
    listing.address ? `Address: ${listing.address}` : null,
    listing.website ? `Website: ${listing.website}` : null,
    listing.planningNotes.length > 0 ? `Planning notes: ${listing.planningNotes.join('; ')}` : null,
  ]
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join('\n\n');

const searchNarrative = (query: string, total: number): string => {
  const base = `Found ${total} published sustainable listing${total === 1 ? '' : 's'} matching "${query}".`;
  if (hasSanityConfiguration) return base;
  return `${base} Results may be empty until Sanity environment variables are configured.`;
};

server.tool(
  {
    name: 'search',
    description:
      'Search published sustainable digital nomad directory listings by keyword and browse the matches in a widget.',
    schema: searchToolSchema,
    outputSchema: searchToolOutputSchema,
    annotations: READ_ONLY_ANNOTATIONS,
    widget: {
      name: 'workday-search',
      invoking: 'Searching sustainable listings...',
      invoked: 'Search results ready',
    },
  },
  async ({ query }) => {
    const results = (await searchListingReferences(query)).map(result => ({
      ...result,
      url: resolveListingUrl(result.url),
    }));

    return widget({
      props: { query, results },
      output: text(searchNarrative(query, results.length)),
    });
  }
);

server.tool(
  {
    name: 'fetch',
    description:
      'Fetch full details for one published sustainable directory listing using a listing id or listing slug.',
    schema: fetchToolSchema,
    outputSchema: listingFetchOutputSchema,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async ({ id }) => {
    const listing = await fetchListingCandidate(id);
    if (!listing) {
      return error(`Listing not found for identifier: ${id}`);
    }

    const normalizedListing = normalizeListing(listing);
    return object({
      id: normalizedListing.id,
      title: normalizedListing.name,
      text: listingNarrative(normalizedListing),
      url: normalizedListing.canonicalUrl,
      metadata: {
        type: normalizedListing.type,
        city: normalizedListing.city.name,
        ecoFocusTags: normalizedListing.ecoFocusTags,
        digitalNomadFeatures: normalizedListing.digitalNomadFeatures,
        amenities: normalizedListing.amenities,
      },
      listing: normalizedListing,
    });
  }
);

server.tool(
  {
    name: 'plan_sustainable_workday',
    description:
      'Plan a sustainable workday itinerary for a city using published cafes, workspaces, food stops, and activities.',
    schema: workdayPlanToolSchema,
    outputSchema: workdayPlanOutputSchema,
    annotations: READ_ONLY_ANNOTATIONS,
  },
  async input => {
    try {
      const candidates = await fetchListingCandidates({ city: input.city });
      const itinerary = normalizeItinerary(
        planSustainableWorkday(input as SharedWorkdayPlanInput, candidates)
      );
      return object({ itinerary });
    } catch (caughtError) {
      return error(
        caughtError instanceof Error
          ? `Failed to plan sustainable workday: ${caughtError.message}`
          : 'Failed to plan sustainable workday.'
      );
    }
  }
);

server.tool(
  {
    name: 'render_workday_itinerary',
    description:
      'Render a previously planned sustainable workday itinerary in a browsable widget timeline.',
    schema: renderWorkdayInputSchema,
    outputSchema: renderWorkdayInputSchema,
    annotations: READ_ONLY_ANNOTATIONS,
    widget: {
      name: 'workday-itinerary',
      invoking: 'Rendering itinerary...',
      invoked: 'Itinerary ready',
    },
  },
  async ({ itinerary }) => {
    const normalizedItinerary = normalizeItinerary(itinerary);
    return widget({
      props: { itinerary: normalizedItinerary },
      output: text(normalizedItinerary.summary),
    });
  }
);

server.listen();
