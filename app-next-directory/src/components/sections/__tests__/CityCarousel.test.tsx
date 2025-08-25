import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
// Mock icons used by CityCarousel to keep tests light and deterministic.
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <svg aria-hidden="true" data-icon="chevron-left" />,
  ChevronRight: () => <svg aria-hidden="true" data-icon="chevron-right" />,
  Leaf: () => <svg aria-hidden="true" data-icon="leaf" />,
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
  },
];]

describe('CityCarousel', () => {
  it('renders loading state initially', () => {
    render(<CityCarousel />)
    expect(screen.getByText(/loading cities/i)).toBeInTheDocument()
  })

  it('renders city cards after successful fetch', async () => {
    server.use(
      rest.get('/api/cities', (req, res, ctx) => {
        return res(ctx.json({ cities: mockCities }))
      })
    )

    render(<CityCarousel />)

    await waitFor(() => {
      expect(screen.getByText('Copenhagen')).toBeInTheDocument()
      expect(screen.getByText('Freiburg')).toBeInTheDocument()
    })

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/copenhagen.jpg')
    expect(images[1]).toHaveAttribute('src', 'https://example.com/freiburg.jpg')
  })

  it('renders error state on fetch failure', async () => {
    server.use(
      rest.get('/api/cities', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    render(<CityCarousel />)

    await waitFor(() => {
      expect(screen.getByText(/error: failed to fetch cities/i)).toBeInTheDocument()
    })
  })
})