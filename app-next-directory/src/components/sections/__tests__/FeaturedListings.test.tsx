import { render, screen, waitFor } from '@testing-library/react'
import { FeaturedListings } from '../FeaturedListings'
import { server } from '@/mocks/server'
import { rest } from 'msw'
import { FeaturedListingDTO } from '@/types/dto'

const mockListings: FeaturedListingDTO[] = [
  {
    id: '1',
    name: 'Eco-friendly Coworking Space',
    slug: 'eco-friendly-coworking-space',
    imageUrl: 'https://example.com/image1.jpg',
    city: 'Berlin',
    amenityNames: ['Solar Power', 'Recycling Program'],
  },
  {
    id: '2',
    name: 'Sustainable Cafe',
    slug: 'sustainable-cafe',
    imageUrl: 'https://example.com/image2.jpg',
    city: 'Amsterdam',
    amenityNames: ['Organic Coffee', 'Local Ingredients'],
  },
]

describe('FeaturedListings', () => {
  afterEach(() => {
    server.resetHandlers()
  })
  it('renders loading state initially', () => {
    render(<FeaturedListings />)
    expect(screen.getByText(/loading featured listings/i)).toBeInTheDocument()
  })

  it('renders featured listings after successful fetch', async () => {
    server.use(
      rest.get('/api/featured-listings', (req, res, ctx) => {
        return res(ctx.json({ listings: mockListings }))
      })
    )

    render(<FeaturedListings />)

    await waitFor(() => {
      expect(screen.getByText('Eco-friendly Coworking Space')).toBeInTheDocument()
      expect(screen.getByText('Sustainable Cafe')).toBeInTheDocument()
    })

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg')
    expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg')
  })

  it('renders error state on fetch failure', async () => {
    server.use(
      rest.get('/api/featured-listings', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )

    render(<FeaturedListings />)

    expect(await screen.findByText(/error: failed to fetch featured listings/i)).toBeInTheDocument()
    expect(screen.queryByText('Eco-friendly Coworking Space')).not.toBeInTheDocument()
    expect(screen.queryByText('Sustainable Cafe')).not.toBeInTheDocument()
    expect(screen.queryByText(/loading featured listings/i)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('img')).toHaveLength(0)
  })
})
