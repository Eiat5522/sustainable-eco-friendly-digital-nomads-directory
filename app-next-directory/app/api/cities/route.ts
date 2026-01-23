import { connection, NextResponse } from 'next/server';
import { getCitiesList } from '@/lib/data-access/cities.dal';
import type { CityDTO } from '@/types/dto';

type CitiesFetcher = (limit?: number) => Promise<CityDTO[]>;

const isTestEnv = process.env.NODE_ENV === 'test';

const _testControl = isTestEnv
  ? {
      fetchCitiesOverride: undefined as CitiesFetcher | undefined,
    }
  : undefined;

if (process.env.NODE_ENV === 'test') {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

export async function GET() {
  // Signal that this route should be dynamically rendered at request time
  await connection();

  try {
    const fetchCities = _testControl?.fetchCitiesOverride ?? getCitiesList;
    const cities = await fetchCities(8);
    return NextResponse.json({ cities });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
  }
}
