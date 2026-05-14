import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('mcp smoke test itinerary validation', () => {
  it('accepts empty itineraries when notices explain missing listing data', () => {
    const validatorPath = path.resolve(__dirname, '../../scripts/mcp-smoke-test-validators.mjs');
    const validatorSource = readFileSync(validatorPath, 'utf8').replace(
      'export const validatePlannedItinerary =',
      'const validatePlannedItinerary ='
    );
    const validatePlannedItinerary = new Function(
      `${validatorSource}\nreturn validatePlannedItinerary;`
    )();

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
