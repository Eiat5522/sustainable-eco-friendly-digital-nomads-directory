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
  if (!body || !body.email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const fixtures = await readFixtures();
  // Avoid duplicates by email
  fixtures.users = fixtures.users.filter((u: any) => u.email !== body.email);
  fixtures.users.push(body);
  await writeFixtures(fixtures);
  return NextResponse.json(body, { status: 201 });
}

export async function DELETE(req: Request) {
  if (!ENABLED) return NextResponse.json({ error: 'Test API disabled' }, { status: 403 });
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const fixtures = await readFixtures();
  fixtures.users = fixtures.users.filter((u: any) => u.email !== email);
  await writeFixtures(fixtures);
  return NextResponse.json({ deleted: email });
}
