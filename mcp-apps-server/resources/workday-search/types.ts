import { z } from 'zod';
import { listingFetchOutputSchema, listingReferenceSchema } from '../../src/lib/workday-schemas';

export const workdaySearchWidgetPropsSchema = z.object({
  query: z.string().describe('Original query that produced the search results.'),
  results: z
    .array(listingReferenceSchema)
    .describe('Search results that can be browsed and expanded for details.'),
});

export const fetchResultSchema = listingFetchOutputSchema;

export type WorkdaySearchWidgetProps = z.infer<typeof workdaySearchWidgetPropsSchema>;
