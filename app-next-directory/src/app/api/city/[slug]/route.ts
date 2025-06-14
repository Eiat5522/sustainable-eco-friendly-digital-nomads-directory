import { NextRequest, NextResponse } from 'next/server';
import { getCityBySlug } from '@/lib/sanity/queries'; // Import the new function
import { ApiResponseHandler } from '@/utils/api-response'; // Assuming you have this utility

// Define the shape of the context parameter
type RouteContext = {
  params: { slug: string }; // Updated to reflect Next.js 13+ App Router context
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { slug } = context.params; // Directly access params

  try {
    const cityData = await getCityBySlug(slug);

    if (!cityData) {
      return ApiResponseHandler.notFound('City');
    }

    // Construct the mainImage URL if using Sanity's image asset reference
    // This depends on your urlFor utility setup
    // For now, assuming cityData.mainImage.asset.url is directly available or handled by getCityBySlug
    // If not, you'll need to import and use your urlFor helper here.
    // Example: const mainImageUrl = cityData.mainImage ? urlFor(cityData.mainImage.asset).url() : null;
    // const responseData = { ...cityData, mainImageUrl };

    return ApiResponseHandler.success(cityData);
  } catch (error) {
    console.error(`Failed to fetch city data for slug: ${slug}`, error);
    return ApiResponseHandler.error('Failed to fetch city data');
  }
}

// You can add other HTTP method handlers here as needed:
// export async function POST(request: NextRequest, context: RouteContext) { ... }
// export async function PUT(request: NextRequest, context: RouteContext) { ... }
// export async function DELETE(request: NextRequest, context: RouteContext) { ... }
