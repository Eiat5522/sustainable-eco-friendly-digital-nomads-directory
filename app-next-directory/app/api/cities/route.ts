import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

type FetchFn = (query: string, params?: Record<string, unknown>) => Promise<unknown>;

export const testControl = {
  clientFetchOverride: undefined as FetchFn | undefined,
};

export async function GET() {
  try {
    const fetchFn =
      testControl.clientFetchOverride ??
      ((query: string, params?: Record<string, unknown>) => client.fetch(query, params));
    const cities = await fetchFn(`*[_type == "city"] | order(name asc) {
      _id,
      name
    }`);
    return NextResponse.json({ cities });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
  }
}
