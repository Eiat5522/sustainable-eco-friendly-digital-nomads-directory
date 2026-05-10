import {
  WorkdayItinerarySchema,
  WorkdayPlanInputSchema,
  type ListingCandidate,
  type ListingType,
  type WorkdayItinerary,
  type WorkdayPlanInput,
  type WorkdayStop,
} from './schemas';

type SlotDefinition = {
  slot: WorkdayStop['slot'];
  title: string;
  preferredTypes: ListingType[];
  fallbackNoticeType: string;
};

const SLOT_DEFINITIONS: SlotDefinition[] = [
  {
    slot: 'morning',
    title: 'Start with focused cafe work',
    preferredTypes: ['cafe'],
    fallbackNoticeType: 'cafe',
  },
  {
    slot: 'midday',
    title: 'Settle into the primary work block',
    preferredTypes: ['coworking', 'accommodation'],
    fallbackNoticeType: 'coworking',
  },
  {
    slot: 'afternoon',
    title: 'Recharge with a sustainable meal',
    preferredTypes: ['restaurant', 'cafe'],
    fallbackNoticeType: 'restaurant',
  },
  {
    slot: 'evening',
    title: 'Close the day with a low-impact activity',
    preferredTypes: ['activities'],
    fallbackNoticeType: 'activity',
  },
];

const DEFAULT_SLOT_TIMES: Record<WorkdayStop['slot'], { startTime: string; endTime: string }> = {
  morning: { startTime: '09:00', endTime: '11:00' },
  midday: { startTime: '11:30', endTime: '15:00' },
  afternoon: { startTime: '15:30', endTime: '16:30' },
  evening: { startTime: '17:00', endTime: '18:00' },
};

const normalize = (value: string): string => value.trim().toLowerCase();

const listingText = (candidate: ListingCandidate): string =>
  [
    candidate.name,
    candidate.type,
    candidate.shortDescription,
    candidate.longDescription,
    candidate.priceRange,
    ...candidate.ecoFocusTags,
    ...candidate.digitalNomadFeatures,
    ...candidate.amenities,
    ...candidate.planningNotes,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

const scoreCandidate = (
  input: WorkdayPlanInput,
  candidate: ListingCandidate,
  preferredTypes: ListingType[]
): number => {
  let score = 0;

  if (normalize(candidate.city.name) === normalize(input.city)) score += 25;
  if (preferredTypes.includes(candidate.type)) score += 30;
  if (input.budget === 'any' || candidate.priceRange === input.budget) score += 8;
  if (candidate.ecoFocusTags.length > 0) score += 6;
  if (candidate.digitalNomadFeatures.length > 0) score += 6;
  if (candidate.location) score += 3;
  if (candidate.openingHours.length > 0) score += 3;

  const haystack = listingText(candidate);
  for (const priority of input.priorities) {
    if (haystack.includes(normalize(priority))) score += 10;
  }
  for (const need of input.dietaryNeeds) {
    if (haystack.includes(normalize(need))) score += 10;
  }
  if (input.workStyle === 'quiet' && haystack.includes('quiet')) score += 8;
  if (input.workStyle === 'social' && haystack.includes('community')) score += 8;
  if (input.workStyle === 'outdoor' && haystack.includes('outdoor')) score += 8;

  return score;
};

const chooseCandidate = (
  input: WorkdayPlanInput,
  candidates: ListingCandidate[],
  slot: SlotDefinition,
  selectedIds: Set<string>
): ListingCandidate | null => {
  const ranked = candidates
    .filter(candidate => !selectedIds.has(candidate.id))
    .filter(candidate => slot.preferredTypes.includes(candidate.type))
    .map(candidate => ({
      candidate,
      score: scoreCandidate(input, candidate, slot.preferredTypes),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.candidate.name.localeCompare(right.candidate.name);
    });

  return ranked[0]?.candidate ?? null;
};

const reasonsFor = (
  input: WorkdayPlanInput,
  candidate: ListingCandidate,
  preferredTypes: ListingType[]
): string[] => {
  const reasons = [`Selected as a ${candidate.type} stop in ${candidate.city.name}.`];
  if (preferredTypes.includes(candidate.type)) reasons.push('Matches the preferred stop category.');
  if (candidate.ecoFocusTags.length > 0) {
    reasons.push(`Sustainability signals: ${candidate.ecoFocusTags.slice(0, 3).join(', ')}.`);
  }
  if (candidate.digitalNomadFeatures.length > 0) {
    reasons.push(`Nomad features: ${candidate.digitalNomadFeatures.slice(0, 3).join(', ')}.`);
  }
  if (input.budget !== 'any' && candidate.priceRange === input.budget) {
    reasons.push(`Fits the requested ${input.budget} budget.`);
  }
  return reasons;
};

const buildNotices = (
  candidates: ListingCandidate[],
  selected: ListingCandidate[],
  missingCategoryNotices: string[]
): string[] => {
  const notices = [...missingCategoryNotices];
  if (candidates.length === 0) {
    notices.push('No published listings were available for this city.');
  }
  if (selected.some(candidate => !candidate.location)) {
    notices.push('Some selected listings are missing coordinates.');
  }
  if (selected.some(candidate => candidate.openingHours.length === 0)) {
    notices.push('Some selected listings are missing opening hours.');
  }
  return Array.from(new Set(notices));
};

export function planSustainableWorkday(
  rawInput: WorkdayPlanInput,
  candidates: ListingCandidate[],
  generatedAt = new Date()
): WorkdayItinerary {
  const input = WorkdayPlanInputSchema.parse(rawInput);
  const selectedIds = new Set<string>();
  const missingCategoryNotices: string[] = [];
  const stops: WorkdayStop[] = [];

  for (const slot of SLOT_DEFINITIONS) {
    const candidate = chooseCandidate(input, candidates, slot, selectedIds);
    if (!candidate) {
      missingCategoryNotices.push(
        `No ${slot.fallbackNoticeType} listing was available for the ${slot.slot} stop.`
      );
      continue;
    }

    selectedIds.add(candidate.id);
    const times = DEFAULT_SLOT_TIMES[slot.slot];
    stops.push({
      id: `${slot.slot}-${candidate.id}`,
      slot: slot.slot,
      title: slot.title,
      startTime: times.startTime,
      endTime: times.endTime,
      listing: candidate,
      reasons: reasonsFor(input, candidate, slot.preferredTypes),
    });
  }

  return WorkdayItinerarySchema.parse({
    city: input.city,
    generatedAt: generatedAt.toISOString(),
    summary:
      stops.length > 0
        ? `${stops.length}-stop sustainable workday in ${input.city}.`
        : `No sustainable workday stops could be planned for ${input.city}.`,
    stops,
    notices: buildNotices(
      candidates,
      stops.map(stop => stop.listing),
      missingCategoryNotices
    ),
  });
}
