import { type NextRequest, NextResponse } from "next/server";

export async function GET(
	_request: NextRequest,
	{ params }: { params: { slug: string } },
) {
	const { slug } = params; // This will be "Koh-Samui" if that's the slug in the URL

	// For now, let's just return the slug
	return NextResponse.json({ message: `Data for city: ${slug}` });
}
