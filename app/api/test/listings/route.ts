import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const ENABLED = process.env.TEST_API_ENABLED === 'true';
const FIXTURES_PATH = path.join(process.cwd(), 'tmp', 'e2e-fixtures.json');

async function readFixtures() {
  try {
    const text = await fs.readFile(FIXTURES_PATH, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    return { users: [], listings: [] };
  }
}

async function writeFixtures(data: any) {
  await fs.mkdir(path.dirname(FIXTURES_PATH), { recursive: true });
  await fs.writeFile(FIXTURES_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function POST(req: Request) {
  if (!ENABLED) return NextResponse.json({ error: 'Test API disabled' }, { status: 403 });
  const body = await req.json();
  if (!body || !body.slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const fixtures = await readFixtures();
  // Avoid duplicates by slug
  fixtures.listings = fixtures.listings.filter((l: any) => l.slug !== body.slug);
  fixtures.listings.push(body);
  await writeFixtures(fixtures);
  return NextResponse.json(body, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!ENABLED) return NextResponse.json({ error: 'Test API disabled' }, { status: 403 });
  const { slug } = await req.json();
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const fixtures = await readFixtures();
  fixtures.listings = fixtures.listings.filter((l: any) => l.slug !== slug);
  await writeFixtures(fixtures);
  return NextResponse.json({ deleted: slug });
}
