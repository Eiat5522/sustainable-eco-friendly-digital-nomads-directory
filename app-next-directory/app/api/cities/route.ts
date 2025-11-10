import { NextResponse } from 'next/server';
import { getCitiesList } from '@/lib/data/city';
import type { CityDTO } from '@/types/dto';

type CitiesFetcher = (limit?: number) => Promise<CityDTO[]>;

const isTestEnv = process.env.NODE_ENV === 'test';

export const _testControl = isTestEnv
  ? {
      fetchCitiesOverride: undefined as CitiesFetcher | undefined,
    }
  : undefined;

export async function GET() {
  try {
    const fetchCities = _testControl?.fetchCitiesOverride ?? getCitiesList;
    const cities = await fetchCities(8);
    return NextResponse.json({ cities });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
  }
}
