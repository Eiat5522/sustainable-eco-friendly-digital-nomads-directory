import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  fetchListingCandidate,
  fetchListingCandidates,
  searchListingReferences,
} from './listing-candidates';
import { planSustainableWorkday } from './workday-planner';
import {
  type WorkdayItinerary,
  WorkdayItinerarySchema,
  WorkdayPlanInputObjectSchema,
  WorkdayPlanInputSchema,
} from './workday-schemas';
import { renderWorkdayWidgetHtml, WORKDAY_WIDGET_RESOURCE } from './workday-widget';

export const WORKDAY_RENDER_TOOL_NAME = 'render_workday_itinerary';

type ToolAnnotations = {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  openWorldHint: boolean;
  idempotentHint: boolean;
};

type WorkdayToolDescriptor = {
  name: 'search' | 'fetch' | 'plan_sustainable_workday' | typeof WORKDAY_RENDER_TOOL_NAME;
  title: string;
  description: string;
  annotations: ToolAnnotations;
  _meta?: Record<string, unknown>;
};

type TextContent = {
  type: 'text';
  text: string;
};

export type WorkdayToolResult = {
  content: TextContent[];
  structuredContent?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
};

const READ_ONLY_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
};

const SearchInputSchema = z.object({
  query: z.string().trim().min(1),
});

const FetchInputSchema = z.object({
  id: z.string().trim().min(1),
});

const RenderInputSchema = z.object({
  itinerary: WorkdayItinerarySchema,
});

const jsonText = (value: unknown): TextContent => ({
  type: 'text',
  text: JSON.stringify(value),
});

const itineraryText = (itinerary: WorkdayItinerary): TextContent => ({
  type: 'text',
  text: itinerary.summary,
});

const renderToolMeta = {
  ui: {
    resourceUri: WORKDAY_WIDGET_RESOURCE.uri,
  },
  'openai/outputTemplate': WORKDAY_WIDGET_RESOURCE.uri,
} as const;

export function getWorkdayToolDescriptors(): WorkdayToolDescriptor[] {
  return [
    {
      name: 'search',
      title: 'Search sustainable directory listings',
      description:
        'Use this when the user wants to find sustainable digital nomad directory listings.',
      annotations: READ_ONLY_ANNOTATIONS,
    },
    {
      name: 'fetch',
      title: 'Fetch a sustainable directory listing',
      description:
        'Use this when the user wants details for one known listing id or listing slug.',
      annotations: READ_ONLY_ANNOTATIONS,
    },
    {
      name: 'plan_sustainable_workday',
      title: 'Plan a sustainable workday',
      description:
        'Use this when the user asks for a day itinerary using cafes, workspaces, meals, and activities.',
      annotations: READ_ONLY_ANNOTATIONS,
    },
    {
      name: WORKDAY_RENDER_TOOL_NAME,
      title: 'Render a sustainable workday itinerary',
      description:
        'Use this after planning an itinerary when a visual timeline would help the user compare stops.',
      annotations: READ_ONLY_ANNOTATIONS,
      _meta: renderToolMeta,
    },
  ];
}

export async function callWorkdayTool(name: string, input: unknown): Promise<WorkdayToolResult> {
  if (name === 'search') {
    const parsed = SearchInputSchema.parse(input);
    const results = await searchListingReferences(parsed.query);
    return { content: [jsonText({ results })] };
  }

  if (name === 'fetch') {
    const parsed = FetchInputSchema.parse(input);
    const listing = await fetchListingCandidate(parsed.id);
    if (!listing) {
      return { content: [jsonText({ id: parsed.id, error: 'Listing not found' })] };
    }
    return {
      content: [
        jsonText({
          id: listing.id,
          title: listing.name,
          text: [
            listing.shortDescription,
            listing.longDescription,
            listing.address ? `Address: ${listing.address}` : null,
            listing.website ? `Website: ${listing.website}` : null,
          ]
            .filter((part): part is string => typeof part === 'string' && part.length > 0)
            .join('\n\n'),
          url: listing.canonicalUrl,
          metadata: {
            type: listing.type,
            city: listing.city,
            ecoFocusTags: listing.ecoFocusTags,
            digitalNomadFeatures: listing.digitalNomadFeatures,
            amenities: listing.amenities,
          },
        }),
      ],
    };
  }

  if (name === 'plan_sustainable_workday') {
    // Execution keeps the cross-field time refinement; MCP registration uses the base object
    // shape below because the SDK cannot advertise a refined ZodEffects object as JSON schema.
    const parsed = WorkdayPlanInputSchema.parse(input);
    const candidates = await fetchListingCandidates({ city: parsed.city });
    const itinerary = planSustainableWorkday(parsed, candidates);
    return {
      content: [itineraryText(itinerary)],
      structuredContent: { itinerary },
    };
  }

  if (name === WORKDAY_RENDER_TOOL_NAME) {
    const parsed = RenderInputSchema.parse(input);
    return {
      content: [itineraryText(parsed.itinerary)],
      structuredContent: { itinerary: parsed.itinerary },
      _meta: renderToolMeta,
    };
  }

  return { content: [jsonText({ error: `Unknown tool: ${name}` })] };
}

export function createWorkdayMcpServer(): McpServer {
  const server = new McpServer({
    name: 'sustainable-workday-planner',
    version: '0.1.0',
  });

  server.registerResource(
    WORKDAY_WIDGET_RESOURCE.title,
    WORKDAY_WIDGET_RESOURCE.uri,
    {
      description: WORKDAY_WIDGET_RESOURCE.meta['openai/widgetDescription'],
      mimeType: WORKDAY_WIDGET_RESOURCE.mimeType,
      _meta: {
        ui: WORKDAY_WIDGET_RESOURCE.meta.ui,
        'openai/widgetDescription': WORKDAY_WIDGET_RESOURCE.meta['openai/widgetDescription'],
        'openai/widgetPrefersBorder': WORKDAY_WIDGET_RESOURCE.meta['openai/widgetPrefersBorder'],
      },
    },
    async () => ({
      contents: [
        {
          uri: WORKDAY_WIDGET_RESOURCE.uri,
          mimeType: WORKDAY_WIDGET_RESOURCE.mimeType,
          text: renderWorkdayWidgetHtml(),
          _meta: {
            ui: WORKDAY_WIDGET_RESOURCE.meta.ui,
          },
        },
      ],
    })
  );

  server.registerTool(
    'search',
    {
      title: 'Search sustainable directory listings',
      description:
        'Use this when the user wants to find sustainable digital nomad directory listings.',
      inputSchema: { query: z.string().trim().min(1) },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async args => callWorkdayTool('search', args)
  );

  server.registerTool(
    'fetch',
    {
      title: 'Fetch a sustainable directory listing',
      description:
        'Use this when the user wants details for one known listing id or listing slug.',
      inputSchema: { id: z.string().trim().min(1) },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async args => callWorkdayTool('fetch', args)
  );

  server.registerTool(
    'plan_sustainable_workday',
    {
      title: 'Plan a sustainable workday',
      description:
        'Use this when the user asks for a day itinerary using cafes, workspaces, meals, and activities.',
      // Use the raw object shape for tool discovery; the handler validates the refined schema.
      inputSchema: WorkdayPlanInputObjectSchema.shape,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async args => callWorkdayTool('plan_sustainable_workday', args)
  );

  server.registerTool(
    WORKDAY_RENDER_TOOL_NAME,
    {
      title: 'Render a sustainable workday itinerary',
      description:
        'Use this after planning an itinerary when a visual timeline would help the user compare stops.',
      inputSchema: { itinerary: WorkdayItinerarySchema },
      annotations: READ_ONLY_ANNOTATIONS,
      _meta: renderToolMeta,
    },
    async args => callWorkdayTool(WORKDAY_RENDER_TOOL_NAME, args)
  );

  return server;
}
