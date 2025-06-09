import { NextRequest, NextResponse } from 'next/server';

// Eco tags data
const ECO_TAGS = [
  { id: 'zero-waste', label: 'Zero Waste', impact: 'high' },
  { id: 'renewable-energy', label: 'Renewable Energy', impact: 'high' },
  { id: 'plant-based', label: 'Plant-Based', impact: 'medium' },
  { id: 'eco-construction', label: 'Eco Construction', impact: 'high' },
  { id: 'water-conservation', label: 'Water Conservation', impact: 'medium' },
  { id: 'local-community', label: 'Local Community', impact: 'medium' },
  { id: 'organic', label: 'Organic', impact: 'medium' }
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(ECO_TAGS);
  } catch (error) {
    console.error('Error fetching eco tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eco tags' },
      { status: 500 }
    );
  }
}
