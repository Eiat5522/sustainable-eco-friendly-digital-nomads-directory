import { z } from 'zod';
import { workdayItinerarySchema } from '../../src/lib/workday-schemas';

export const workdayItineraryWidgetPropsSchema = z.object({
  itinerary: workdayItinerarySchema.describe('Generated itinerary to browse in the widget.'),
});

export type WorkdayItineraryWidgetProps = z.infer<typeof workdayItineraryWidgetPropsSchema>;
