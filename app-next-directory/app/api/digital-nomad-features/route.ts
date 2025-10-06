
import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function GET() {
  try {
    const digitalNomadFeatures = await client.fetch(`*[_type == "nomadFeature"] | order(name asc) {
      _id,
      name
    }`);
    return NextResponse.json({ digitalNomadFeatures });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch digital nomad features' }, { status: 500 });
  }
}
