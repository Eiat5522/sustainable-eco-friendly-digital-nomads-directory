import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { server } from '../../../test-helpers/msw-server-bridge'
import { http, HttpResponse } from 'msw'
import { CityCarousel } from '../CityCarousel'
import { CityDTO } from '../../../types/city'

// Top-level mock for lucide-react icons
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <svg aria-hidden="true" data-icon="chevron-left" />,
  ChevronRight: () => <svg aria-hidden="true" data-icon="chevron-right" />,
  Leaf: () => <svg aria-hidden="true" data-icon="leaf" />,
  MapPin: () => <svg aria-hidden="true" data-icon="map-pin" />,
}));

// Mock icons used by CityCarousel to keep tests light and deterministic.
const mockCities: CityDTO[] = [
  {
    id: '1',
    name: 'Copenhagen',
    slug: 'copenhagen',
    country: 'Denmark',
    sustainabilityScore: 92,
    highlights: ['Cycling culture', 'Harbor baths'],
    imageUrl: 'https://example.com/copenhagen.jpg',
  },
  {
    id: '2',
    name: 'Freiburg',
    slug: 'freiburg',
    country: 'Germany',
    sustainabilityScore: 94,
    highlights: ['Solar Powered', 'Green Architecture'],
    imageUrl: 'https://example.com/freiburg.jpg',
  }
]
beforeAll(() => {
  // Server lifecycle is handled in jest.setup.ts; no per-file listen/close to avoid duplicates.
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  // no-op, global teardown handles server.close()
})
describe('CityCarousel', () => {
  it('renders loading state initially', () => {
    render(<CityCarousel />)
    expect(screen.getByText(/loading cities/i)).toBeInTheDocument()
  })
  
  it('renders city cards after successful fetch', async () => {    server.use(
      http.get('/api/cities', () => {
        return HttpResponse.json({ cities: mockCities }, { status: 200 })
      })
    )

    render(<CityCarousel />)

    await waitFor(() => {
      expect(screen.getByText('Copenhagen')).toBeInTheDocument()
      expect(screen.getByText('Freiburg')).toBeInTheDocument()
    })

expect(screen.getByAltText('Copenhagen')).toHaveAttribute(
  'src',
  expect.stringContaining('copenhagen.jpg')
)
expect(screen.getByAltText('Freiburg')).toHaveAttribute(
  'src',
  expect.stringContaining('freiburg.jpg')
)
  })
  it('renders error state on fetch failure', async () => {
    server.use(
      http.get('/api/cities', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    render(<CityCarousel />)

    await waitFor(() => {
      expect(screen.getByText(/error: failed to fetch cities/i)).toBeInTheDocument()
    })
  })
})